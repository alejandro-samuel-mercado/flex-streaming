'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, FileVideo, CheckCircle2, AlertCircle, X, Plus } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { useUploadStore } from '@/lib/upload-store';

export default function UploadManagerPage() {
  const { files, addFiles, removeFile, updateProgress, updateStatus, updateType, setErrorMessage } = useUploadStore();
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'' | 'success' | 'error' | 'partial'>('');
  const [contentList, setContentList] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<{ id: string; contentId: string }[]>([]);
  const [uploadLimit, setUploadLimit] = useState(5);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };
    
    fetch(API_ROUTES.ADMIN.BASE + '/settings', { headers })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data['UPLOAD_CONCURRENT_LIMIT']) {
           setUploadLimit(parseInt(d.data['UPLOAD_CONCURRENT_LIMIT'], 10));
        }
      }).catch(() => {});

    fetch(API_ROUTES.CONTENT.LIST, { headers })
      .then(r => r.json())
      .then(d => {
        const list = d.data ?? [];
        setContentList(list);
      })
      .catch(() => {});
  }, []);

  // Generate blocks automatically when uploadLimit or contentList changes
  useEffect(() => {
    if (contentList.length === 0) return;
    setBlocks(prev => {
      if (prev.length === uploadLimit) return prev;
      
      const newBlocks = [];
      const usedInPrev = new Set(prev.map(b => b.contentId).filter(Boolean));

      for (let i = 0; i < uploadLimit; i++) {
        if (prev[i]) {
          newBlocks.push(prev[i]);
        } else {
          // Initialize empty blocks so the user can choose freely.
          // Pre-selecting content was causing items to be marked as "(En uso)" immediately.
          newBlocks.push({ id: Math.random().toString(), contentId: '' });
        }
      }
      return newBlocks;
    });
  }, [uploadLimit, contentList]);



  const updateBlockContent = (id: string, newContentId: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, contentId: newContentId } : b));
  };

  const CHUNK_SIZE = 10 * 1024 * 1024;
  const CONCURRENCY = 3;

  const handleUpload = async () => {
    if (!files.length) return;
    const validFiles = files.filter(f => f.contentId);
    if (!validFiles.length) return;

    setUploading(true);
    setStatus('');

    const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
    const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

    let okCount = 0;
    let errCount = 0;

    for (const f of validFiles) {
      if (f.status === 'success') {
        okCount++;
        continue;
      }

      updateStatus(f.file.name, 'uploading');
      const totalChunks = Math.ceil(f.file.size / CHUNK_SIZE);
      const fileId = Math.random().toString(36).substring(2, 15);

      try {
        const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
        let completedChunks = 0;

        const uploadChunk = async (i: number) => {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, f.file.size);
          const chunk = f.file.slice(start, end);

          const fd = new FormData();
          fd.append('chunk', chunk);
          fd.append('fileId', fileId);
          fd.append('chunkIndex', i.toString());

          const res = await fetch(API_ROUTES.ADMIN.UPLOAD.CHUNK, { method: 'POST', body: fd, headers });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Error en chunk ${i}`);
          }
          completedChunks++;
          updateProgress(f.file.name, Math.round((completedChunks / totalChunks) * 100));
        };

        const queue = [...chunkIndices];
        const activeUploads: Promise<void>[] = [];
        
        while (queue.length > 0 || activeUploads.length > 0) {
          while (queue.length > 0 && activeUploads.length < CONCURRENCY) {
            const idx = queue.shift()!;
            const uploadPromise = uploadChunk(idx).then(() => {
              activeUploads.splice(activeUploads.indexOf(uploadPromise), 1);
            });
            activeUploads.push(uploadPromise);
          }
          if (activeUploads.length > 0) await Promise.race(activeUploads);
        }

        const completeRes = await fetch(API_ROUTES.ADMIN.UPLOAD.COMPLETE, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId,
            fileName: f.file.name,
            totalChunks,
            contentId: f.contentId,
            type: f.type
          })
        });

        if (!completeRes.ok) {
          const errData = await completeRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Error al finalizar subida');
        }

        updateStatus(f.file.name, 'success');
        updateProgress(f.file.name, 100);
        setTimeout(() => removeFile(f.file.name), 1500);
        okCount++;
      } catch (err: any) {
        console.error(err);
        setErrorMessage(f.file.name, err.message);
        updateStatus(f.file.name, 'error');
        errCount++;
      }
    }

    setStatus(errCount === 0 ? 'success' : okCount === 0 ? 'error' : 'partial');
    setUploading(false);
  };

  const usedContentIds = new Set(blocks.map(b => b.contentId).filter(Boolean));

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Subidas Múltiples / HLS</h1>
          <p className="adm-page-subtitle">Sube trailers y películas concurrentemente para hasta {uploadLimit} títulos</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="adm-btn adm-btn--primary" disabled={!files.length || uploading} onClick={handleUpload}>
            {uploading ? 'Procesando lote...' : 'Iniciar subidas → Cola BullMQ'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {blocks.map((block, index) => {
            const blockFiles = files.filter(f => f.contentId === block.contentId);
            return (
              <div key={block.id} className="adm-table-card" style={{ padding: '20px', position: 'relative' }}>
              
              <div style={{ marginBottom: 16, maxWidth: 400 }}>
                  <label style={{ display: 'block', fontSize: '.75rem', color: 'var(--adm-muted)', marginBottom: 6, fontWeight: 600 }}>PELÍCULA / CONTENIDO {index + 1}</label>
                  <select 
                    className="adm-select" 
                    style={{ width: '100%', padding: '10px 12px' }}
                    value={block.contentId}
                    onChange={e => updateBlockContent(block.id, e.target.value)}
                    disabled={uploading}
                  >
                    <option value="" disabled>Selecciona una película...</option>
                    {contentList.map(c => (
                      <option 
                        key={c.id} 
                        value={c.id} 
                        disabled={c.id !== block.contentId && usedContentIds.has(c.id)}
                      >
                        {c.translations?.[0]?.title || c.slug} {c.id !== block.contentId && usedContentIds.has(c.id) ? '(En uso)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {block.contentId ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <label
                    htmlFor={`upload-${block.id}`}
                    className={`adm-dropzone${draggingBlockId === block.id ? ' dragging' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDraggingBlockId(block.id); }}
                    onDragLeave={() => setDraggingBlockId(null)}
                    onDrop={e => { e.preventDefault(); setDraggingBlockId(null); addFiles(Array.from(e.dataTransfer.files), block.contentId); }}
                  >
                      <UploadCloud size={30} className="adm-dropzone-icon" />
                      <span className="adm-dropzone-label" style={{ fontSize: '.85rem' }}>Arrastra archivos para esta película</span>
                      <input id={`upload-${block.id}`} type="file" accept="video/*" multiple hidden disabled={uploading}
                        onChange={e => addFiles(Array.from(e.target.files || []), block.contentId)} />
                    </label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {blockFiles.length === 0 && (
                         <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--adm-bg-secondary)', borderRadius: 8, color: 'var(--adm-muted)', fontSize: '.8rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                           Sin archivos
                         </div>
                      )}
                      {blockFiles.map(f => (
                        <div key={f.file.name} className="adm-upload-file" style={{ padding: '10px 14px' }}>
                          <FileVideo size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontSize: '.8rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }} title={f.file.name}>{f.file.name}</span>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <select 
                                    className="adm-select" 
                                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                    value={f.type}
                                    onChange={(e) => updateType(f.file.name, e.target.value as any)}
                                    disabled={uploading}
                                >
                                    <option value="MOVIE">Película</option>
                                    <option value="TRAILER">Tráiler</option>
                                </select>
                                <span style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>{(f.file.size / 1024 / 1024).toFixed(1)} MB</span>
                              </div>
                            </div>
                            {(uploading || f.status !== 'idle') && (
                               <div className="adm-progress-bar">
                                 <div className={`adm-progress-fill${f.status === 'error' ? ' error' : ''}${f.status === 'success' ? ' success' : ''}`}
                                    style={{ width: `${f.status === 'error' ? 100 : f.progress}%` }} />
                               </div>
                             )}
                             {f.status === 'error' && f.errorMessage && (
                               <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: 4 }}>{f.errorMessage}</div>
                             )}
                          </div>
                          {!uploading && f.status !== 'uploading' && (
                            <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => removeFile(f.file.name)}><X size={12} /></button>
                          )}
                          {f.status === 'success' && <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', background: 'var(--adm-bg-secondary)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)', color: 'var(--adm-muted)' }}>
                    Selecciona una película
                  </div>
                )}
              </div>
            );
          })}

          {status === 'success' && (
            <div style={{ padding: '12px 16px', background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <CheckCircle2 size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '.83rem', fontWeight: 600, color: '#4ade80' }}>Lote enviado con éxito</div>
              </div>
            </div>
          )}
          {(status === 'error' || status === 'partial') && (
            <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
              <div style={{ fontSize: '.83rem', color: '#f87171', fontWeight: 600 }}>
                {status === 'error' ? 'Error al subir todos los archivos' : 'Algunos archivos fallaron'}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="adm-table-card">
            <div className="adm-table-card-header">
              <h2 className="adm-table-card-title">Pipeline de procesamiento</h2>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { step: '1', label: 'Upload recibido', desc: 'El archivo se guarda en /uploads temporalmente', color: '#a78bfa' },
                { step: '2', label: 'Job encolado', desc: 'BullMQ crea un job en Redis para FFmpeg', color: '#60a5fa' },
                { step: '3', label: 'FFmpeg codifica', desc: 'Genera segmentos .ts y playlist .m3u8 por calidad', color: '#4ade80' },
                { step: '4', label: 'Listo para streaming', desc: 'Estado READY — disponible en HLS player', color: '#facc15' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: s.color + '22', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.7rem', fontWeight: 800, flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontSize: '.83rem', fontWeight: 700, color: 'white' }}>{s.label}</div>
                    <div style={{ fontSize: '.75rem', color: 'var(--adm-muted)', marginTop: 2 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="adm-table-card">
            <div className="adm-table-card-header"><h2 className="adm-table-card-title">Formatos soportados</h2></div>
            <div style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['MP4 (H.264)', 'MKV', 'WEBM (VP9)', 'MOV', 'AVI', 'FLV'].map(f => (
                <span key={f} className="adm-badge adm-badge--gray">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
