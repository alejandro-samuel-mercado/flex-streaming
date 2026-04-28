'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, FileVideo, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { useUploadStore } from '@/lib/upload-store';

export default function UploadManagerPage() {
  const { files, addFiles, removeFile, updateProgress, updateStatus } = useUploadStore();
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'' | 'success' | 'error' | 'partial'>('');
  const [dragging, setDragging] = useState(false);
  const [contentList, setContentList] = useState<any[]>([]);
  const [selectedContentId, setSelectedContentId] = useState('');

  // Fetch content list for selection
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    fetch(API_ROUTES.CONTENT.LIST, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    })
      .then(r => r.json())
      .then(d => {
        const list = d.data ?? [];
        setContentList(list);
        if (list.length > 0 && !selectedContentId) setSelectedContentId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const handleUpload = async () => {
    if (!files.length || !selectedContentId) return;
    setUploading(true); setStatus('');

    let okCount = 0, errCount = 0;
    await Promise.all(files.map(async f => {
      if (f.status === 'success') { okCount++; return; }
      
      updateStatus(f.file.name, 'uploading');
      try {
        const fd = new FormData();
        fd.append('video', f.file);
        fd.append('contentId', selectedContentId);
        
        const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
        const res = await fetch(API_ROUTES.ADMIN.UPLOAD, { 
          method: 'POST', 
          body: fd,
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) throw new Error();
        updateProgress(f.file.name, 100);
        updateStatus(f.file.name, 'success');
        okCount++;
      } catch {
        updateStatus(f.file.name, 'error');
        errCount++;
      }
    }));

    setStatus(errCount === 0 ? 'success' : okCount === 0 ? 'error' : 'partial');
    setUploading(false);
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Subidas / HLS</h1>
          <p className="adm-page-subtitle">Sube archivos de video para codificación HLS con FFmpeg y BullMQ</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span className="adm-badge adm-badge--yellow">BullMQ Queue</span>
          <span className="adm-badge adm-badge--blue">FFmpeg Worker</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'start' }}>
        {/* Drop zone */}
        <div className="adm-table-card" style={{ padding: 0, overflow: 'visible' }}>
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Seleccionar archivos</h2>
          </div>
          <div style={{ padding: '20px 20px 0' }}>
            {/* Content Selection */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: '.75rem', color: 'var(--adm-muted)', marginBottom: 6, fontWeight: 600 }}>ASOCIAR A CONTENIDO</label>
              <select 
                className="adm-select" 
                style={{ width: '100%', padding: '10px 12px' }}
                value={selectedContentId}
                onChange={e => setSelectedContentId(e.target.value)}
              >
                {contentList.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.translations?.[0]?.title || c.slug}
                  </option>
                ))}
              </select>
            </div>

            <label
              htmlFor="video-upload"
              className={`adm-dropzone${dragging ? ' dragging' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); }}
            >
              <UploadCloud size={40} className="adm-dropzone-icon" />
              <span className="adm-dropzone-label">Arrastra archivos aquí o haz click</span>
              <span className="adm-dropzone-hint">MP4, MKV, WEBM · Hasta 5 GB por archivo · Múltiple selección</span>
              <input id="video-upload" type="file" accept="video/*" multiple hidden
                onChange={e => addFiles(Array.from(e.target.files || []))} />
            </label>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {files.map((f, i) => (
                <div key={i} className="adm-upload-file">
                   <FileVideo size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ fontSize: '.83rem', color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.file.name}</div>
                     <div style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>{(f.file.size / 1024 / 1024).toFixed(1)} MB</div>
                     {(uploading || f.status === 'uploading' || f.status === 'success' || f.status === 'error') && (
                       <div className="adm-progress-bar">
                         <div className={`adm-progress-fill${f.status === 'error' ? ' error' : ''}${f.status === 'success' ? ' success' : ''}`}
                           style={{ width: `${f.status === 'error' ? 100 : f.progress}%` }} />
                       </div>
                     )}
                   </div>
                   {!uploading && f.status !== 'uploading' && (
                     <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => removeFile(f.file.name)}><X size={12} /></button>
                   )}
                   {f.status === 'success' && <CheckCircle2 size={16} style={{ color: '#4ade80', flexShrink: 0 }} />}
                   {f.status === 'error'  && <AlertCircle  size={16} style={{ color: '#f87171', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          )}

          <div style={{ padding: '16px 20px 20px' }}>
            <button className="adm-btn adm-btn--primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={!files.length || uploading}
              onClick={handleUpload}>
              {uploading
                ? <><span className="adm-login-spinner" style={{ width: 16, height: 16 }} /> Procesando lote...</>
                : <><UploadCloud size={16} /> Iniciar subidas → Cola BullMQ</>}
            </button>
          </div>

          {status === 'success' && (
            <div style={{ margin: '0 20px 20px', padding: '12px 16px', background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <CheckCircle2 size={18} style={{ color: '#4ade80', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '.83rem', fontWeight: 600, color: '#4ade80' }}>Lote enviado con éxito</div>
                <div style={{ fontSize: '.75rem', color: 'var(--adm-muted)', marginTop: 2 }}>El worker FFmpeg procesará los archivos según la concurrencia configurada</div>
              </div>
            </div>
          )}
          {(status === 'error' || status === 'partial') && (
            <div style={{ margin: '0 20px 20px', padding: '12px 16px', background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <AlertCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
              <div style={{ fontSize: '.83rem', color: '#f87171', fontWeight: 600 }}>
                {status === 'error' ? 'Error al subir todos los archivos' : 'Algunos archivos fallaron'}
              </div>
            </div>
          )}
        </div>

        {/* Info panel */}
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
