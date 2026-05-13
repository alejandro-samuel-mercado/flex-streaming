'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    FolderSearch, Search, FileVideo, CheckCircle2, AlertCircle,
    Loader2, Download, Film, Tv2,
    X, FolderOpen, ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';

interface ScannedFile {
    fileName: string;
    cleanName: string;
    filePath: string;
    fileSize: number;
    extension: string;
    lastModified: string;
    alreadyImported: boolean;
    contentType: 'MOVIE' | 'SERIES';
    episode?: {
        m3u8Path: string;
        season: number;
        episodeNumber: number;
        tmdbSeriesId: number | null;
        seriesFolderName: string;
    };
}

interface ImportSummary { total: number; success: number; withTMDB: number; incomplete: number; errors: number; }

function formatFileSize(bytes: number): string {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    if (bytes <= 0) return '—';
    return (bytes / 1e3).toFixed(0) + ' KB';
}

export default function AdminFilesPage() {
    const router = useRouter();
    const [moviePath, setMoviePath] = useState('');
    const [seriesPath, setSeriesPath] = useState('');
    const [suggestedDirs, setSuggestedDirs] = useState<string[]>([]);
    const [files, setFiles] = useState<ScannedFile[]>([]);
    const [importedFiles, setImportedFiles] = useState<ScannedFile[]>([]);
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
    const [importResult, setImportResult] = useState<ImportSummary | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [showImported, setShowImported] = useState(false);
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'MOVIE' | 'SERIES'>('ALL');
    const [autoScanStatus, setAutoScanStatus] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [dirsRes, statusRes] = await Promise.all([
                    adminFetch(API_ROUTES.MEDIA_SCANNER.DIRECTORIES),
                    adminFetch(API_ROUTES.MEDIA_SCANNER.STATUS)
                ]);
                const dirsJson = await dirsRes.json();
                const statusJson = await statusRes.json();

                if (dirsJson.success) setSuggestedDirs(dirsJson.data?.directories || []);
                if (statusJson.success && statusJson.data) {
                    setMoviePath(statusJson.data.moviePath || statusJson.data.path || '');
                    setSeriesPath(statusJson.data.seriesPath || '');
                    setAutoScanStatus(statusJson.data);
                }
            } catch (err) { console.error(err); }
        };
        load();
    }, []);

    const handleScan = useCallback(async () => {
        if (!moviePath.trim() && !seriesPath.trim()) {
            setError('Ingresa al menos una ruta para escanear');
            return;
        }

        setScanning(true); setError(null); setFiles([]); setImportedFiles([]);
        setSelected(new Set()); setImportResult(null); setScanned(false);

        try {
            const params = new URLSearchParams();
            if (moviePath.trim()) params.set('moviePath', moviePath.trim());
            if (seriesPath.trim()) params.set('seriesPath', seriesPath.trim());

            // Start async scan — returns immediately
            const startRes = await adminFetch(`${API_ROUTES.MEDIA_SCANNER.SCAN}?${params.toString()}`);
            const startJson = await startRes.json();

            if (!startRes.ok || !startJson.success) {
                setError(startJson.error || 'Error al iniciar escaneo');
                setScanning(false);
                return;
            }

            // Poll for results every 2 seconds
            const pollInterval = setInterval(async () => {
                try {
                    const pollRes = await adminFetch(API_ROUTES.MEDIA_SCANNER.SCAN_RESULT);
                    const pollJson = await pollRes.json();

                    if (!pollRes.ok || !pollJson.success) return;

                    const status = pollJson.data?.status;

                    if (status === 'done') {
                        clearInterval(pollInterval);
                        setFiles(pollJson.data.files || []);
                        setImportedFiles(pollJson.data.importedFiles || []);
                        setScanned(true);
                        setScanning(false);
                    } else if (status === 'error') {
                        clearInterval(pollInterval);
                        setError(pollJson.data.error || 'Error durante el escaneo');
                        setScanning(false);
                    }
                    // status === 'scanning' → keep polling
                } catch {
                    clearInterval(pollInterval);
                    setError('Error de conexión al obtener resultados');
                    setScanning(false);
                }
            }, 2000);

        } catch (err) {
            setError('Error de conexión');
            setScanning(false);
        }
    }, [moviePath, seriesPath]);

    const handleImport = async () => {
        const selectedFiles = files.filter(f => selected.has(f.filePath));
        if (selectedFiles.length === 0) return;

        const movies = selectedFiles.filter(f => f.contentType === 'MOVIE').length;
        const series = selectedFiles.filter(f => f.contentType === 'SERIES').length;
        const msg = `¿Importar ${selectedFiles.length} archivo(s)?\n\n🎬 Películas: ${movies} (se procesarán con FFmpeg)\n📺 Series: ${series} (ya en HLS, se registrarán directamente)`;
        if (!window.confirm(msg)) return;

        setImporting(true);
        setImportProgress({ current: 0, total: selectedFiles.length });
        setImportResult(null); setError(null);

        try {
            const CHUNK_SIZE = 100;
            const chunks = [];
            for (let i = 0; i < selectedFiles.length; i += CHUNK_SIZE) {
                chunks.push(selectedFiles.slice(i, i + CHUNK_SIZE));
            }

            let success = 0;
            let withTMDB = 0;
            let incomplete = 0;
            let errors = 0;
            const importedPaths = new Set<string>();

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const payload = chunk.map(f => ({
                    filePath: f.filePath,
                    contentType: f.contentType,
                    ...(f.episode ? { episode: f.episode } : {})
                }));

                const res = await adminFetch(API_ROUTES.MEDIA_SCANNER.IMPORT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ files: payload })
                });
                const json = await res.json();

                if (res.ok && json.success) {
                    const s = json.data.summary;
                    success += s.success;
                    withTMDB += s.withTMDB;
                    incomplete += s.incomplete;
                    errors += s.errors;
                    
                    // Mark these as imported
                    chunk.forEach(f => importedPaths.add(f.filePath));
                    
                    setImportProgress({ 
                        current: Math.min((i + 1) * CHUNK_SIZE, selectedFiles.length), 
                        total: selectedFiles.length 
                    });
                } else {
                    throw new Error(json.error || `Error en lote ${i + 1}`);
                }
            }

            setImportResult({ total: selectedFiles.length, success, withTMDB, incomplete, errors });
            setFiles(prev => prev.filter(f => !importedPaths.has(f.filePath)));
            setSelected(new Set());
        } catch (err: any) {
            setError(err.message || 'Error de conexión durante la importación');
        } finally {
            setImporting(false); setImportProgress(null);
        }
    };

    const toggleSelect = (filePath: string) => {
        setSelected(prev => { const n = new Set(prev); n.has(filePath) ? n.delete(filePath) : n.add(filePath); return n; });
    };

    const filteredFiles = files.filter(f => {
        const matchesText = f.fileName.toLowerCase().includes(searchFilter.toLowerCase()) || f.cleanName.toLowerCase().includes(searchFilter.toLowerCase());
        const matchesType = typeFilter === 'ALL' || f.contentType === typeFilter;
        return matchesText && matchesType;
    });

    const toggleSelectAll = () => {
        if (selected.size === filteredFiles.length) setSelected(new Set());
        else setSelected(new Set(filteredFiles.map(f => f.filePath)));
    };

    const movieCount = files.filter(f => f.contentType === 'MOVIE').length;
    const seriesCount = files.filter(f => f.contentType === 'SERIES').length;

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => router.push('/admin/content')} className="adm-icon-btn" title="Volver">
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="adm-page-title">Archivos Detectados</h1>
                        <p className="adm-page-subtitle">Escanea carpetas de películas y series para importar contenido</p>
                    </div>
                </div>
            </div>

            {/* Scan Controls */}
            <div className="adm-table-card" style={{ padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {/* Movies path */}
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Film size={13} /> 🎬 Carpeta de Películas
                        </label>
                        <input
                            type="text" className="adm-input"
                            placeholder="/home/media/peliculas"
                            value={moviePath}
                            onChange={e => setMoviePath(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleScan()}
                        />
                        {suggestedDirs.length > 0 && (
                            <select className="adm-select" style={{ marginTop: 6 }} value="" onChange={e => { if (e.target.value) setMoviePath(e.target.value); }}>
                                <option value="">Sugeridas...</option>
                                {suggestedDirs.map((d, i) => <option key={i} value={d}>{d}</option>)}
                            </select>
                        )}
                    </div>

                    {/* Series path */}
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Tv2 size={13} /> 📺 Carpeta de Series
                        </label>
                        <input
                            type="text" className="adm-input"
                            placeholder="/home/media/series"
                            value={seriesPath}
                            onChange={e => setSeriesPath(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleScan()}
                        />
                        {suggestedDirs.length > 0 && (
                            <select className="adm-select" style={{ marginTop: 6 }} value="" onChange={e => { if (e.target.value) setSeriesPath(e.target.value); }}>
                                <option value="">Sugeridas...</option>
                                {suggestedDirs.map((d, i) => <option key={i} value={d}>{d}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
                    <button className="adm-btn adm-btn--primary" onClick={handleScan} disabled={scanning || (!moviePath.trim() && !seriesPath.trim())}>
                        {scanning ? <Loader2 size={16} className="animate-spin" /> : <FolderSearch size={16} />}
                        {scanning ? 'Escaneando...' : 'Escanear'}
                    </button>

                    {scanned && (
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem' }}>
                            <span style={{ color: '#86efac' }}>
                                <Film size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                                {movieCount} películas nuevas
                            </span>
                            <span style={{ color: '#60a5fa' }}>
                                <Tv2 size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                                {seriesCount} episodios nuevos
                            </span>
                            <span style={{ color: 'var(--adm-muted)' }}>{importedFiles.length} ya importados</span>
                            <button style={{ background: 'none', border: 'none', color: 'var(--adm-muted)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline', padding: 0 }}
                                onClick={() => setShowImported(!showImported)}>
                                {showImported ? 'Ocultar importados' : 'Mostrar importados'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Auto-Scanner Status */}
            {autoScanStatus && (
                <div className="adm-table-card" style={{ padding: '16px 24px', marginBottom: 20, background: autoScanStatus.enabled ? 'rgba(74,222,128,.05)' : 'rgba(248,113,113,.05)', border: `1px solid ${autoScanStatus.enabled ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: autoScanStatus.enabled ? '#4ade80' : '#f87171', boxShadow: autoScanStatus.enabled ? '0 0 8px rgba(74,222,128,.5)' : 'none' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'white' }}>
                                Auto-Scanner: {autoScanStatus.enabled ? 'ACTIVO' : 'DESACTIVADO'}
                            </span>
                            {autoScanStatus.enabled && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--adm-muted)' }}>
                                    (cada {autoScanStatus.intervalMinutes} min)
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                            {autoScanStatus.lastRun && (
                                <span>Último: {new Date(autoScanStatus.lastRun).toLocaleString('es-AR')}</span>
                            )}
                            {autoScanStatus.lastResult && (() => {
                                try {
                                    const r = typeof autoScanStatus.lastResult === 'string' ? JSON.parse(autoScanStatus.lastResult) : autoScanStatus.lastResult;
                                    return <span style={{ color: r.errors > 0 ? '#f87171' : '#86efac' }}>{r.message}</span>;
                                } catch { return null; }
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', color: '#fca5a5', padding: '12px 16px', borderRadius: '12px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertCircle size={18} />{error}
                    <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}><X size={16} /></button>
                </div>
            )}

            {/* Import Result */}
            {importResult && (
                <div style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
                        <strong style={{ color: '#86efac' }}>Importación completada</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: '0.85rem' }}>
                        {[{ label: 'Importados', val: importResult.success, color: '#4ade80' }, { label: 'Con TMDB', val: importResult.withTMDB, color: '#60a5fa' }, { label: 'Incompletos', val: importResult.incomplete, color: '#facc15' }, ...(importResult.errors > 0 ? [{ label: 'Errores', val: importResult.errors, color: '#f87171' }] : [])].map(item => (
                            <div key={item.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: item.color }}>{item.val}</div>
                                <div style={{ color: 'var(--adm-muted)', fontSize: '0.75rem' }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                    <Link href="/admin/content" className="adm-btn adm-btn--ghost adm-btn--sm" style={{ marginTop: 16 }}>Ver contenido importado →</Link>
                </div>
            )}

            {/* Importing overlay */}
            {importing && (
                <div style={{ background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.25)', borderRadius: 16, padding: '24px', marginBottom: 20, textAlign: 'center' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#818cf8', margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600, color: 'white', marginBottom: 4 }}>Importando archivos...</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>Películas → FFmpeg. Series HLS → registro directo.</p>
                    {importProgress && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${(importProgress.current / importProgress.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #818cf8, #6366f1)', borderRadius: 3, transition: 'width 0.3s ease' }} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', marginTop: 6 }}>{importProgress.current} / {importProgress.total}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Files Table */}
            {scanned && files.length > 0 && (
                <>
                    <div className="adm-toolbar">
                        <div className="adm-search-wrap">
                            <Search size={15} className="adm-search-icon" />
                            <input type="text" placeholder="Filtrar por nombre..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} className="adm-search-input" />
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {(['ALL', 'MOVIE', 'SERIES'] as const).map(t => (
                                <button key={t} onClick={() => setTypeFilter(t)}
                                    style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                                        background: typeFilter === t ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                                        color: typeFilter === t ? '#a5b4fc' : 'var(--adm-muted)' }}>
                                    {t === 'ALL' ? 'Todos' : t === 'MOVIE' ? '🎬 Películas' : '📺 Series'}
                                </button>
                            ))}
                        </div>
                        <span style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>{selected.size} seleccionado(s)</span>
                    </div>

                    <div className="adm-table-card">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>
                                        <input type="checkbox" checked={selected.size === filteredFiles.length && filteredFiles.length > 0} onChange={toggleSelectAll} style={{ cursor: 'pointer', accentColor: '#818cf8' }} />
                                    </th>
                                    <th>Tipo</th>
                                    <th>Archivo / Episodio</th>
                                    <th>Nombre limpio</th>
                                    <th>Formato</th>
                                    <th>Tamaño</th>
                                    <th>Modificado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map(file => (
                                    <tr key={file.filePath} onClick={() => toggleSelect(file.filePath)}
                                        style={{ cursor: 'pointer', background: selected.has(file.filePath) ? 'rgba(99,102,241,0.08)' : undefined }}>
                                        <td><input type="checkbox" checked={selected.has(file.filePath)} onChange={() => toggleSelect(file.filePath)} onClick={e => e.stopPropagation()} style={{ cursor: 'pointer', accentColor: '#818cf8' }} /></td>
                                        <td>
                                            {file.contentType === 'SERIES'
                                                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '2px 8px', borderRadius: 6 }}><Tv2 size={11} />Serie</span>
                                                : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: '#86efac', background: 'rgba(74,222,128,0.12)', padding: '2px 8px', borderRadius: 6 }}><Film size={11} />Película</span>
                                            }
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FileVideo size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
                                                <div>
                                                    <span style={{ fontWeight: 500, color: 'white', fontSize: '0.85rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={file.fileName}>{file.fileName}</span>
                                                    {file.episode && (
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--adm-muted)' }}>
                                                            T{String(file.episode.season).padStart(2,'0')}E{String(file.episode.episodeNumber).padStart(2,'0')}
                                                            {file.episode.tmdbSeriesId ? ` · TMDB #${file.episode.tmdbSeriesId}` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>{file.cleanName}</td>
                                        <td><span className="adm-badge adm-badge--gray" style={{ fontSize: '0.7rem' }}>{file.extension}</span></td>
                                        <td className="adm-table-muted" style={{ fontSize: '0.8rem' }}>{formatFileSize(file.fileSize)}</td>
                                        <td className="adm-table-muted" style={{ fontSize: '0.8rem' }}>{new Date(file.lastModified).toLocaleDateString('es-AR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="adm-table-footer"><span>{filteredFiles.length} archivos</span></div>
                    </div>
                </>
            )}

            {/* Imported files */}
            {showImported && importedFiles.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--adm-muted)', marginBottom: 10 }}>Archivos ya importados</h3>
                    <div className="adm-table-card">
                        <table className="adm-table">
                            <thead><tr><th>Archivo</th><th>Tipo</th><th>Formato</th><th>Tamaño</th></tr></thead>
                            <tbody>
                                {importedFiles.map(f => (
                                    <tr key={f.filePath} style={{ opacity: 0.5 }}>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CheckCircle2 size={14} style={{ color: '#4ade80' }} /><span style={{ fontSize: '0.85rem' }}>{f.fileName}</span></div></td>
                                        <td>{f.contentType === 'SERIES' ? <Tv2 size={13} style={{ color: '#60a5fa' }} /> : <Film size={13} style={{ color: '#86efac' }} />}</td>
                                        <td><span className="adm-badge adm-badge--gray" style={{ fontSize: '0.7rem' }}>{f.extension}</span></td>
                                        <td className="adm-table-muted" style={{ fontSize: '0.8rem' }}>{formatFileSize(f.fileSize)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty / initial states */}
            {scanned && files.length === 0 && (
                <div className="adm-table-card" style={{ padding: '48px', textAlign: 'center' }}>
                    <CheckCircle2 size={40} style={{ color: '#4ade80', margin: '0 auto 12px', opacity: 0.6 }} />
                    <h3 style={{ color: 'var(--adm-muted)', marginBottom: 4 }}>No hay archivos nuevos</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', opacity: 0.7 }}>Todos los archivos de video en estas carpetas ya fueron importados.</p>
                </div>
            )}
            {!scanned && !scanning && (
                <div className="adm-table-card" style={{ padding: '48px', textAlign: 'center' }}>
                    <FolderSearch size={48} style={{ color: 'var(--adm-muted)', margin: '0 auto 12px', opacity: 0.3 }} />
                    <h3 style={{ color: 'var(--adm-muted)', marginBottom: 4 }}>Esperando escaneo</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', opacity: 0.7 }}>Ingresa las rutas de películas y/o series y presiona &quot;Escanear&quot;.</p>
                </div>
            )}

            {/* Sticky bottom action bar */}
            {selected.size > 0 && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'linear-gradient(180deg, transparent, rgba(15,15,30,0.95) 20%)', padding: '20px 32px 24px', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                    <div style={{ background: 'rgba(99,102,241,0.15)', backdropFilter: 'blur(20px)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 16, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16, pointerEvents: 'all', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                            {selected.size} archivo(s) — {files.filter(f => selected.has(f.filePath) && f.contentType === 'MOVIE').length} 🎬 · {files.filter(f => selected.has(f.filePath) && f.contentType === 'SERIES').length} 📺
                        </span>
                        <button className="adm-btn adm-btn--primary" onClick={handleImport} disabled={importing}>
                            {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            Importar y crear contenido
                        </button>
                        <button className="adm-btn adm-btn--ghost" onClick={() => setSelected(new Set())}>Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
