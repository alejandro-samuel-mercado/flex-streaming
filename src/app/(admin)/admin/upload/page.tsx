'use client';
import { adminFetch } from '@/lib/admin-api';

import { useState, useEffect } from 'react';
import { UploadCloud, FileVideo, CheckCircle2, AlertCircle, X, Plus, Loader2, Activity } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { useUploadStore } from '@/lib/upload-store';

export default function UploadManagerPage() {
    const {
        files, removeFile, updateProgress, updateStatus, updateType,
        setErrorMessage, blocks, setBlocks, updateBlockContent, hasHydrated
    } = useUploadStore();

    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<'' | 'success' | 'error' | 'partial' | 'uploading'>('');
    const [contentList, setContentList] = useState<any[]>([]);
    const [uploadLimit, setUploadLimit] = useState(5);
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

        fetch(API_ROUTES.CONTENT.LIST + '?limit=500', { headers })
            .then(r => r.json())
            .then(d => {
                const list = d.data ?? [];
                setContentList(list);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (!hasHydrated || contentList.length === 0) return;
        if (blocks.length !== uploadLimit) {
            const newBlocks = [];
            for (let i = 0; i < uploadLimit; i++) {
                if (blocks[i]) newBlocks.push(blocks[i]);
                else newBlocks.push({ id: Math.random().toString(), contentId: '' });
            }
            setBlocks(newBlocks);
        }
    }, [uploadLimit, contentList, hasHydrated, blocks.length, setBlocks]);

    if (!hasHydrated) return (
        <div className="adm-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--adm-muted)' }} />
        </div>
    );

    const CHUNK_SIZE = 50 * 1024 * 1024;
    const CONCURRENCY = 6;

    const handleUpdateBlockContent = (blockId: string, contentId: string) => {
        if (contentId) {
            const content = contentList.find(c => c.id === contentId);
            const hasMovie = content?.videoFiles?.some((vf: any) => vf.type === 'MOVIE' && vf.status !== 'FAILED');
            const hasTrailer = content?.videoFiles?.some((vf: any) => vf.type === 'TRAILER' && vf.status !== 'FAILED');

            if (hasMovie && hasTrailer) {
                alert(`Aviso: El contenido seleccionado ya tiene Película y Trailer en proceso o terminados.`);
            }

            // Sincronizar archivos del bloque
            const block = blocks.find(b => b.id === blockId);
            if (block?.contentId) {
                const updatedFiles = files.map(f => f.contentId === block.contentId ? { ...f, contentId } : f);
                useUploadStore.getState().setFiles(updatedFiles);
            }
        }
        updateBlockContent(blockId, contentId);
    };

    const addFiles = (acceptedFiles: File[], contentId?: string) => {
        const currentFiles = useUploadStore.getState().files;

        if (contentId) {
            const content = contentList.find(c => c.id === contentId);
            const hasMovie = content?.videoFiles?.some((vf: any) => vf.type === 'MOVIE' && vf.status !== 'FAILED');
            const hasTrailer = content?.videoFiles?.some((vf: any) => vf.type === 'TRAILER' && vf.status !== 'FAILED');

            if (hasMovie && hasTrailer) {
                alert("Este contenido ya tiene Película y Trailer procesados o en curso.");
                return;
            }

            acceptedFiles.forEach(file => {
                if (currentFiles.some(f => f.fileName === file.name)) return;
                const suggestedType = !hasMovie ? 'MOVIE' : 'TRAILER';
                useUploadStore.getState().addFile({
                    file,
                    fileName: file.name,
                    progress: 0,
                    status: 'idle',
                    contentId,
                    type: suggestedType
                });
            });
        } else {
            acceptedFiles.forEach(file => {
                if (currentFiles.some(f => f.fileName === file.name)) return;
                useUploadStore.getState().addFile({
                    file,
                    fileName: file.name,
                    progress: 0,
                    status: 'idle',
                    type: 'MOVIE'
                });
            });
        }
    }; const handleUpload = async () => {
        const idleFiles = files.filter(f => f.status === 'idle' && f.file && f.contentId);
        if (idleFiles.length === 0) return;

        // 1. Validación local rápida (datos en memoria)
        for (const f of idleFiles) {
            const content = contentList.find(c => c.id === f.contentId);
            const existingVideo = content?.videoFiles?.find((vf: any) => vf.type === f.type && vf.status !== 'FAILED');
            if (existingVideo) {
                alert(`Error: "${content?.translations?.[0]?.title || content?.slug}" ya tiene un(a) ${f.type === 'MOVIE' ? 'Película' : 'Trailer'} (${existingVideo.status}).\n\nElimina el archivo de la lista.`);
                return;
            }
        }

        setUploading(true);
        setStatus('uploading');

        const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
        const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

        try {
            // 2. Validación en tiempo real contra el servidor
            const freshRes = await adminFetch(`${API_ROUTES.CONTENT.LIST}?limit=500`, { headers });
            if (freshRes.ok) {
                const freshData = await freshRes.json();
                const freshList: any[] = freshData.data || [];
                for (const f of idleFiles) {
                    const c = freshList.find(x => x.id === f.contentId);
                    const existsNow = c?.videoFiles?.some((vf: any) => vf.type === f.type && vf.status !== 'FAILED');
                    if (existsNow) {
                        alert(`⚠️ "${c?.translations?.[0]?.title || c?.slug}" ya tiene un(a) ${f.type === 'MOVIE' ? 'Película' : 'Trailer'} en proceso o terminado. Elimina el archivo de la lista.`);
                        setUploading(false);
                        setStatus('');
                        return;
                    }
                }
                setContentList(freshList);
            }

            // 3. Subir archivos en paralelo
            await Promise.all(idleFiles.map(async (f) => {
                if (!f.file) return;

                updateStatus(f.fileName, 'uploading');
                const totalChunks = Math.ceil(f.file.size / CHUNK_SIZE);
                const fileId = `${f.fileName.replace(/[^a-z0-9]/gi, '_')}-${f.file.size}`;

                // Verificar chunks ya subidos (reanudable) — con auth token
                let uploadedChunks: number[] = [];
                try {
                    const statusRes = await adminFetch(`${API_ROUTES.ADMIN.UPLOAD.BASE}/chunk-status/${fileId}`, { headers });
                    if (statusRes.ok) {
                        const statusData = await statusRes.json();
                        uploadedChunks = statusData.uploadedChunks || [];
                    }
                } catch {
                    // No hay chunks previos, empezar desde cero
                }

                const uploadChunk = async (i: number) => {
                    if (uploadedChunks.includes(i)) return;
                    const start = i * CHUNK_SIZE;
                    const end = Math.min(start + CHUNK_SIZE, f.file!.size);
                    const chunk = f.file!.slice(start, end);
                    const fd = new FormData();
                    fd.append('chunk', chunk);
                    fd.append('fileId', fileId);
                    fd.append('chunkIndex', i.toString());
                    const res = await adminFetch(API_ROUTES.ADMIN.UPLOAD.CHUNK, { method: 'POST', body: fd, headers });
                    if (!res.ok) throw new Error(`Error en parte ${i}`);
                };

                const queue = Array.from({ length: totalChunks }, (_, i) => i);
                let completed = uploadedChunks.length;
                updateProgress(f.fileName, Math.round((completed / totalChunks) * 100));

                const processQueue = async () => {
                    while (queue.length > 0) {
                        const idx = queue.shift();
                        if (idx === undefined) break;
                        if (!uploadedChunks.includes(idx)) {
                            await uploadChunk(idx);
                            completed++;
                            updateProgress(f.fileName, Math.round((completed / totalChunks) * 100));
                        }
                    }
                };

                await Promise.all(Array.from({ length: Math.min(CONCURRENCY, totalChunks) }, processQueue));

                const completeRes = await adminFetch(API_ROUTES.ADMIN.UPLOAD.COMPLETE, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileId, fileName: f.fileName, totalChunks, contentId: f.contentId, type: f.type })
                });

                if (!completeRes.ok) {
                    const errData = await completeRes.json().catch(() => ({}));
                    const msg = errData.error || 'Error al finalizar la subida';
                    updateStatus(f.fileName, 'error');
                    setErrorMessage(f.fileName, msg);
                    throw new Error(msg);
                }

                updateStatus(f.fileName, 'success');
                updateProgress(f.fileName, 100);

                setTimeout(() => {
                    useUploadStore.getState().removeFile(f.fileName);
                    fetch(`${API_ROUTES.CONTENT.LIST}?limit=500`, { headers })
                        .then(r => r.json())
                        .then(d => setContentList(d.data || []))
                        .catch(() => { });
                }, 1500);
            }));

            setStatus('success');
            setUploading(false);
        } catch (err: any) {
            console.error('[Upload] Error:', err);
            setStatus('partial');
            setUploading(false);
        }
    };

    const hasDuplicates = files.some(f => {
        if (!f.contentId || f.status !== 'idle') return false;
        const content = contentList.find(c => c.id === f.contentId);
        const inDb = content?.videoFiles?.some((vf: any) => vf.type === f.type && vf.status !== 'FAILED');
        const inQueue = files.some(other =>
            other.fileName !== f.fileName &&
            other.contentId === f.contentId &&
            other.type === f.type
        );
        return inDb || inQueue;
    });

    const usedContentIds = new Set(blocks.map(b => b.contentId).filter(Boolean));
    const activeFiles = files.filter(f => f.status === 'uploading' || f.status === 'success');
    const idleFiles = files.filter(f => f.status === 'idle' || f.status === 'error');

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Subidas Múltiples / HLS</h1>
                    <p className="adm-page-subtitle">Sube trailers y películas concurrentemente para hasta {uploadLimit} títulos</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="adm-btn adm-btn--ghost" onClick={() => useUploadStore.getState().clearCompleted()}>
                        Limpiar cola
                    </button>
                    <button
                        className="adm-btn adm-btn--primary"
                        disabled={uploading || !files.some(f => f.file && f.contentId && f.status === 'idle') || hasDuplicates}
                        onClick={handleUpload}
                    >
                        {hasDuplicates ? 'Elimina duplicados' : `Iniciar subidas (${idleFiles.length})`}
                    </button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: "100%" }}>
                    {/* ACTIVE UPLOADS SECTION - Only show REAL UPLOADING files */}
                    {files.filter(f => f.status === 'uploading' || f.status === 'success').length > 0 && (
                        <div className="adm-table-card" style={{ padding: 20, border: '1px solid rgba(255, 215, 0,0.3)', background: 'rgba(255, 215, 0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FFD700', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                                    <Activity size={16} /> Subidas en curso
                                </h3>
                                <button
                                    className="adm-btn adm-btn--ghost"
                                    style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                    onClick={() => useUploadStore.getState().clearCompleted()}
                                >
                                    Limpiar completados
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {files.filter(f => f.status === 'uploading' || f.status === 'success').map(f => (
                                    <div key={f.fileName} className="adm-upload-file" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                        <FileVideo size={16} style={{ color: '#FFD700' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{f.fileName}</span>
                                                <span style={{ fontSize: '0.75rem', color: '#FFD700' }}>{f.progress}%</span>
                                            </div>
                                            <div className="adm-progress-bar" style={{ height: 6 }}>
                                                <div className={`adm-progress-fill ${f.status === 'success' ? 'success' : ''}`} style={{ width: `${f.progress}%` }} />
                                            </div>
                                        </div>
                                        {f.status === 'success' ? (
                                            <CheckCircle2 size={16} style={{ color: '#4ade80' }} />
                                        ) : (
                                            <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => removeFile(f.fileName)}>
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PREPARATION GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20, justifyContent: "center", width: "100%" }}>
                        {blocks.map((block, idx) => {
                            const blockFiles = idleFiles.filter(f => f.contentId === block.contentId);
                            return (
                                <div key={block.id} className="adm-table-card" style={{ padding: 24 }}>
                                    <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--adm-muted)', marginBottom: 6, fontWeight: 700, textTransform: 'uppercase' }}>Contenido {idx + 1}</label>
                                            <select
                                                className="adm-select"
                                                style={{ width: '100%', padding: '10px 12px' }}
                                                value={block.contentId || ''}
                                                onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                                            >
                                                <option value="">-- Seleccionar Título --</option>
                                                {contentList.map(c => {
                                                    const title = c.translations?.find((t: any) => t.language === 'es')?.title
                                                        || c.translations?.[0]?.title
                                                        || c.title || c.slug;
                                                    const display = `${title} ${c.releaseYear ? `(${c.releaseYear})` : ''}`;
                                                    return (
                                                        <option key={c.id} value={c.id} disabled={usedContentIds.has(c.id) && block.contentId !== c.id}>
                                                            {display} {usedContentIds.has(c.id) && block.contentId !== c.id ? '(En uso)' : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    {block.contentId ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                            {(() => {
                                                const content = contentList.find(c => c.id === block.contentId);
                                                const hasMovie = content?.videoFiles?.some((vf: any) => vf.type === 'MOVIE' && vf.status !== 'FAILED');
                                                const hasTrailer = content?.videoFiles?.some((vf: any) => vf.type === 'TRAILER' && vf.status !== 'FAILED');

                                                return (
                                                    <div style={{ display: 'contents' }}>
                                                        <label
                                                            className={`adm-dropzone ${draggingBlockId === block.id ? 'dragging' : ''}`}
                                                            style={{ height: 160, opacity: (hasMovie && hasTrailer) ? 0.5 : 1, pointerEvents: (hasMovie && hasTrailer) ? 'none' : 'auto' }}
                                                            onDragOver={e => { e.preventDefault(); setDraggingBlockId(block.id); }}
                                                            onDragLeave={() => setDraggingBlockId(null)}
                                                            onDrop={e => {
                                                                e.preventDefault();
                                                                setDraggingBlockId(null);
                                                                addFiles(Array.from(e.dataTransfer.files), block.contentId);
                                                            }}
                                                        >
                                                            {hasMovie && hasTrailer ? (
                                                                <div style={{ textAlign: 'center' }}>
                                                                    <CheckCircle2 size={32} style={{ color: '#4ade80', marginBottom: 12 }} />
                                                                    <span style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 600 }}>Contenido completo</span>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <UploadCloud size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                                                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Suelta archivos aquí</span>
                                                                    <input type="file" multiple hidden onChange={e => addFiles(Array.from(e.target.files || []), block.contentId)} />
                                                                </>
                                                            )}
                                                        </label>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                            {/* Mostrar estado actual del contenido */}
                                                            <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                                                                <span className={`adm-badge ${hasMovie ? 'adm-badge--success' : 'adm-badge--gray'}`} style={{ fontSize: '0.6rem' }}>Película: {hasMovie ? 'SÍ' : 'NO'}</span>
                                                                <span className={`adm-badge ${hasTrailer ? 'adm-badge--success' : 'adm-badge--gray'}`} style={{ fontSize: '0.6rem' }}>Trailer: {hasTrailer ? 'SÍ' : 'NO'}</span>
                                                            </div>

                                                            {blockFiles.length === 0 && (
                                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--adm-muted)', fontSize: '0.8rem' }}>
                                                                    Sin nuevos archivos
                                                                </div>
                                                            )}
                                                            {blockFiles.map(f => {
                                                                const content = contentList.find(c => c.id === block.contentId);
                                                                // ¿Ya existe en DB (procesando o listo)?
                                                                const isAlreadyInDb = content?.videoFiles?.some((vf: any) => vf.type === f.type && vf.status !== 'FAILED');
                                                                // ¿Ya está en la lista de subidas para este mismo contenido?
                                                                const isAlreadyInQueue = files.some(other =>
                                                                    other.fileName !== f.fileName &&
                                                                    other.contentId === f.contentId &&
                                                                    other.type === f.type
                                                                );
                                                                const isDup = isAlreadyInDb || isAlreadyInQueue;

                                                                return (
                                                                    <div key={f.fileName} className="adm-upload-file" style={{ padding: '12px', border: isDup ? '1px solid var(--adm-danger)' : undefined }}>
                                                                        <FileVideo size={16} style={{ color: isDup ? 'var(--adm-danger)' : '#FFD700' }} />
                                                                        <div style={{ flex: 1 }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.fileName}>{f.fileName}</span>
                                                                                    {isDup && <span style={{ fontSize: '0.6rem', color: 'var(--adm-danger)', fontWeight: 700 }}>⚠️ DUPLICADO O EN CURSO</span>}
                                                                                </div>
                                                                                <select
                                                                                    className="adm-select"
                                                                                    style={{ padding: '2px 6px', fontSize: '0.65rem', height: 22 }}
                                                                                    value={f.type}
                                                                                    onChange={e => updateType(f.fileName, e.target.value as any)}
                                                                                >
                                                                                    <option value="MOVIE" disabled={hasMovie}>Peli</option>
                                                                                    <option value="TRAILER" disabled={hasTrailer}>Trailer</option>
                                                                                </select>
                                                                            </div>
                                                                            {!f.file && <div style={{ fontSize: '0.65rem', color: '#fbbf24' }}>Recarga detectada: re-adjunta el archivo</div>}
                                                                        </div>
                                                                        <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => removeFile(f.fileName)}><X size={14} /></button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.05)', color: 'var(--adm-muted)' }}>
                                            <span style={{ fontSize: '0.9rem' }}>Primero selecciona un contenido</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>


            </div>
        </div >
    );
}
