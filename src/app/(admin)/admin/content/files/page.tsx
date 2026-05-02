'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    FolderSearch, Search, FileVideo, CheckCircle2, AlertCircle,
    Loader2, Download, ArrowLeft, HardDrive, Film,
    Check, X, RefreshCw, FolderOpen, ChevronLeft
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
}

interface ImportSummary {
    total: number;
    success: number;
    withTMDB: number;
    incomplete: number;
    errors: number;
}

function formatFileSize(bytes: number): string {
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    return (bytes / 1e3).toFixed(0) + ' KB';
}

export default function AdminFilesPage() {
    const router = useRouter();
    const [scanPath, setScanPath] = useState('');
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

    // Load suggested dirs and current scan path
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
                if (statusJson.success && statusJson.data?.path) {
                    setScanPath(statusJson.data.path);
                }
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, []);

    const handleScan = useCallback(async () => {
        if (!scanPath.trim()) {
            setError('Ingresa una ruta para escanear');
            return;
        }

        setScanning(true);
        setError(null);
        setFiles([]);
        setImportedFiles([]);
        setSelected(new Set());
        setImportResult(null);
        setScanned(false);

        try {
            const res = await adminFetch(`${API_ROUTES.MEDIA_SCANNER.SCAN}?path=${encodeURIComponent(scanPath)}`);
            const json = await res.json();

            if (res.ok && json.success) {
                setFiles(json.data.files || []);
                setImportedFiles(json.data.importedFiles || []);
                setScanned(true);
            } else {
                setError(json.error || 'Error al escanear');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setScanning(false);
        }
    }, [scanPath]);

    const handleImport = async () => {
        const selectedPaths = Array.from(selected);
        if (selectedPaths.length === 0) return;

        const msg = `¿Importar ${selectedPaths.length} archivo(s)?\n\nEl sistema buscará datos en TMDB y creará contenido automáticamente para cada uno.`;
        if (!window.confirm(msg)) return;

        setImporting(true);
        setImportProgress({ current: 0, total: selectedPaths.length });
        setImportResult(null);
        setError(null);

        try {
            const res = await adminFetch(API_ROUTES.MEDIA_SCANNER.IMPORT, {
                method: 'POST',
                body: JSON.stringify({ filePaths: selectedPaths })
            });

            const json = await res.json();

            if (res.ok && json.success) {
                setImportResult(json.data.summary);
                // Remove imported files from the list
                setFiles(prev => prev.filter(f => !selected.has(f.filePath)));
                setSelected(new Set());
            } else {
                setError(json.error || 'Error al importar');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión durante la importación');
        } finally {
            setImporting(false);
            setImportProgress(null);
        }
    };

    const toggleSelect = (filePath: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(filePath)) next.delete(filePath);
            else next.add(filePath);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === filteredFiles.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filteredFiles.map(f => f.filePath)));
        }
    };

    const filteredFiles = files.filter(f =>
        f.fileName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        f.cleanName.toLowerCase().includes(searchFilter.toLowerCase())
    );

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button onClick={() => router.push('/admin/content')} className="adm-icon-btn" title="Volver">
                        <ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="adm-page-title">Archivos Detectados</h1>
                        <p className="adm-page-subtitle">Escanea carpetas y selecciona archivos para importar como contenido</p>
                    </div>
                </div>
            </div>

            {/* Scan Controls */}
            <div className="adm-table-card" style={{ padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FolderOpen size={13} />
                            Ruta del directorio
                        </label>
                        <input
                            type="text"
                            className="adm-input"
                            placeholder="/mnt/peliculas"
                            value={scanPath}
                            onChange={e => setScanPath(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleScan()}
                        />
                    </div>

                    {suggestedDirs.length > 0 && (
                        <div style={{ minWidth: 220 }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginBottom: 6, display: 'block' }}>Sugeridas</label>
                            <select
                                className="adm-select"
                                value=""
                                onChange={e => { if (e.target.value) setScanPath(e.target.value); }}
                            >
                                <option value="">Seleccionar...</option>
                                {suggestedDirs.map((d, i) => <option key={i} value={d}>{d}</option>)}
                            </select>
                        </div>
                    )}

                    <button
                        className="adm-btn adm-btn--primary"
                        onClick={handleScan}
                        disabled={scanning || !scanPath.trim()}
                        style={{ whiteSpace: 'nowrap', height: 42 }}
                    >
                        {scanning ? <Loader2 size={16} className="animate-spin" /> : <FolderSearch size={16} />}
                        {scanning ? 'Escaneando...' : 'Escanear'}
                    </button>
                </div>

                {scanned && (
                    <div style={{
                        marginTop: 12,
                        display: 'flex',
                        gap: 16,
                        fontSize: '0.8rem'
                    }}>
                        <span style={{ color: '#86efac' }}>
                            <FileVideo size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                            {files.length} nuevos
                        </span>
                        <span style={{ color: 'var(--adm-muted)' }}>
                            {importedFiles.length} ya importados
                        </span>
                        <button
                            style={{
                                background: 'none', border: 'none', color: 'var(--adm-muted)',
                                cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline',
                                padding: 0
                            }}
                            onClick={() => setShowImported(!showImported)}
                        >
                            {showImported ? 'Ocultar importados' : 'Mostrar importados'}
                        </button>
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    background: 'rgba(248, 113, 113, .1)',
                    border: '1px solid rgba(248, 113, 113, .3)',
                    color: '#fca5a5',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                }}>
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Import Result */}
            {importResult && (
                <div style={{
                    background: 'rgba(74, 222, 128, .08)',
                    border: '1px solid rgba(74, 222, 128, .25)',
                    borderRadius: 16,
                    padding: '20px 24px',
                    marginBottom: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <CheckCircle2 size={20} style={{ color: '#4ade80' }} />
                        <strong style={{ color: '#86efac' }}>Importación completada</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 20, fontSize: '0.85rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#4ade80' }}>{importResult.success}</div>
                            <div style={{ color: 'var(--adm-muted)', fontSize: '0.75rem' }}>Importados</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#60a5fa' }}>{importResult.withTMDB}</div>
                            <div style={{ color: 'var(--adm-muted)', fontSize: '0.75rem' }}>Con datos TMDB</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#facc15' }}>{importResult.incomplete}</div>
                            <div style={{ color: 'var(--adm-muted)', fontSize: '0.75rem' }}>Incompletos</div>
                        </div>
                        {importResult.errors > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f87171' }}>{importResult.errors}</div>
                                <div style={{ color: 'var(--adm-muted)', fontSize: '0.75rem' }}>Errores</div>
                            </div>
                        )}
                    </div>
                    <Link href="/admin/content" className="adm-btn adm-btn--ghost adm-btn--sm" style={{ marginTop: 16 }}>
                        Ver contenido importado →
                    </Link>
                </div>
            )}

            {/* Importing overlay */}
            {importing && (
                <div style={{
                    background: 'rgba(99, 102, 241, .08)',
                    border: '1px solid rgba(99, 102, 241, .25)',
                    borderRadius: 16,
                    padding: '24px',
                    marginBottom: 20,
                    textAlign: 'center'
                }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#818cf8', margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600, color: 'white', marginBottom: 4 }}>
                        Importando archivos...
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>
                        Buscando en TMDB, creando contenido y encolando procesamiento de video.
                    </p>
                    {importProgress && (
                        <div style={{ marginTop: 12 }}>
                            <div style={{
                                width: '100%', height: 6, background: 'rgba(255,255,255,0.1)',
                                borderRadius: 3, overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #818cf8, #6366f1)',
                                    borderRadius: 3,
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', marginTop: 6 }}>
                                {importProgress.current} / {importProgress.total}
                            </p>
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
                            <input
                                type="text"
                                placeholder="Filtrar por nombre..."
                                value={searchFilter}
                                onChange={e => setSearchFilter(e.target.value)}
                                className="adm-search-input"
                            />
                        </div>
                        <span style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>
                            {selected.size} seleccionado(s)
                        </span>
                    </div>

                    <div className="adm-table-card">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 40 }}>
                                        <input
                                            type="checkbox"
                                            checked={selected.size === filteredFiles.length && filteredFiles.length > 0}
                                            onChange={toggleSelectAll}
                                            style={{ cursor: 'pointer', accentColor: '#818cf8' }}
                                        />
                                    </th>
                                    <th>Archivo</th>
                                    <th>Nombre limpio</th>
                                    <th>Formato</th>
                                    <th>Tamaño</th>
                                    <th>Modificado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFiles.map(file => (
                                    <tr
                                        key={file.filePath}
                                        onClick={() => toggleSelect(file.filePath)}
                                        style={{
                                            cursor: 'pointer',
                                            background: selected.has(file.filePath) ? 'rgba(99, 102, 241, 0.08)' : undefined
                                        }}
                                    >
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selected.has(file.filePath)}
                                                onChange={() => toggleSelect(file.filePath)}
                                                onClick={e => e.stopPropagation()}
                                                style={{ cursor: 'pointer', accentColor: '#818cf8' }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <FileVideo size={16} style={{ color: '#818cf8', flexShrink: 0 }} />
                                                <span style={{
                                                    fontWeight: 500, color: 'white', fontSize: '0.85rem',
                                                    maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                                }} title={file.fileName}>
                                                    {file.fileName}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>
                                            {file.cleanName}
                                        </td>
                                        <td>
                                            <span className="adm-badge adm-badge--gray" style={{ fontSize: '0.7rem' }}>
                                                {file.extension}
                                            </span>
                                        </td>
                                        <td className="adm-table-muted" style={{ fontSize: '0.8rem' }}>
                                            {formatFileSize(file.fileSize)}
                                        </td>
                                        <td className="adm-table-muted" style={{ fontSize: '0.8rem' }}>
                                            {new Date(file.lastModified).toLocaleDateString('es-AR')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="adm-table-footer">
                            <span>{filteredFiles.length} archivos</span>
                        </div>
                    </div>
                </>
            )}

            {/* Imported files (togglable) */}
            {showImported && importedFiles.length > 0 && (
                <div style={{ marginTop: 20 }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--adm-muted)', marginBottom: 10 }}>Archivos ya importados</h3>
                    <div className="adm-table-card">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Archivo</th>
                                    <th>Formato</th>
                                    <th>Tamaño</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importedFiles.map(f => (
                                    <tr key={f.filePath} style={{ opacity: 0.5 }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <CheckCircle2 size={14} style={{ color: '#4ade80' }} />
                                                <span style={{ fontSize: '0.85rem' }}>{f.fileName}</span>
                                            </div>
                                        </td>
                                        <td><span className="adm-badge adm-badge--gray" style={{ fontSize: '0.7rem' }}>{f.extension}</span></td>
                                        <td className="adm-table-muted" style={{ fontSize: '0.8rem' }}>{formatFileSize(f.fileSize)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty state */}
            {scanned && files.length === 0 && (
                <div className="adm-table-card" style={{ padding: '48px', textAlign: 'center' }}>
                    <CheckCircle2 size={40} style={{ color: '#4ade80', margin: '0 auto 12px', opacity: 0.6 }} />
                    <h3 style={{ color: 'var(--adm-muted)', marginBottom: 4 }}>No hay archivos nuevos</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', opacity: 0.7 }}>
                        Todos los archivos de video en esta carpeta ya fueron importados.
                    </p>
                </div>
            )}

            {/* Not yet scanned */}
            {!scanned && !scanning && (
                <div className="adm-table-card" style={{ padding: '48px', textAlign: 'center' }}>
                    <FolderSearch size={48} style={{ color: 'var(--adm-muted)', margin: '0 auto 12px', opacity: 0.3 }} />
                    <h3 style={{ color: 'var(--adm-muted)', marginBottom: 4 }}>Esperando escaneo</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--adm-muted)', opacity: 0.7 }}>
                        Ingresa una ruta y presiona &quot;Escanear&quot; para buscar archivos de video.
                    </p>
                </div>
            )}

            {/* Sticky bottom action bar */}
            {selected.size > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 100,
                    background: 'linear-gradient(180deg, transparent, rgba(15, 15, 30, 0.95) 20%)',
                    padding: '20px 32px 24px',
                    display: 'flex',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        borderRadius: 16,
                        padding: '14px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        pointerEvents: 'all',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                    }}>
                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                            {selected.size} archivo(s) seleccionado(s)
                        </span>
                        <button
                            className="adm-btn adm-btn--primary"
                            onClick={handleImport}
                            disabled={importing}
                            style={{ gap: 8 }}
                        >
                            {importing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            Importar y crear contenido
                        </button>
                        <button
                            className="adm-btn adm-btn--ghost"
                            onClick={() => setSelected(new Set())}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
