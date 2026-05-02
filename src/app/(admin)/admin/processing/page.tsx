'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, Clock, CheckCircle2, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

interface VideoStatus {
  id: string;
  contentId: string;
  processingJobId: string | null;
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  masterPlaylist: string | null;
  createdAt: string;
  progress?: number;
  content: {
    slug: string;
  };
}

export default function ProcessingMonitorPage() {
  const [videos, setVideos] = useState<VideoStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // 1. Initial fetch
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
        const res = await fetch(API_ROUTES.ADMIN.VIDEOS_STATUS, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          setVideos(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching video status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // 2. Setup Sockets
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
    const s = io(backendUrl, { withCredentials: true });
    
    s.on('video-progress', ({ jobId, progress }) => {
      setVideos(prev => prev.map(v => {
        if (v.processingJobId === jobId) {
          // Progress should never go backwards
          const currentProgress = v.progress || 0;
          return { ...v, progress: Math.max(currentProgress, progress), status: 'PROCESSING' };
        }
        return v;
      }));
    });

    s.on('video-status', ({ jobId, status }) => {
      // If a job finishes or fails, we refresh the whole list to get updated metadata
      fetchStatus();
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  const handleCancel = async (id: string, slug: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas cancelar la subida de "${slug}"?`)) return;

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await fetch(API_ROUTES.ADMIN.UPLOAD.DELETE_VIDEO(id), {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        setVideos(prev => prev.filter(v => v.id !== id));
      } else {
        const err = await res.json();
        alert(`Error al cancelar: ${err.error || 'No se pudo cancelar'}`);
      }
    } catch (err) {
      console.error('Cancel error:', err);
      alert('Error de conexión al intentar cancelar');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'var(--adm-success)';
      case 'PROCESSING': return 'var(--adm-primary)';
      case 'FAILED': return 'var(--adm-danger)';
      default: return 'var(--adm-yellow)';
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Monitor de Procesamiento</h1>
          <p className="adm-page-subtitle">Seguimiento en tiempo real del pipeline de FFmpeg y BullMQ</p>
        </div>
        <div className="adm-badge adm-badge--blue" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Activity size={14} className={socket?.connected ? 'animate-pulse' : ''} />
          {socket?.connected ? 'Conectado via WebSockets' : 'Reconectando...'}
        </div>
      </div>

      <div className="adm-table-card">
        <div className="adm-table-card-header">
          <h2 className="adm-table-card-title">Cola de Trabajos Recientes</h2>
        </div>

        {loading ? (
          <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" size={32} color="var(--adm-primary)" />
          </div>
        ) : videos.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--adm-muted)' }}>
            <PlayCircle size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <p>No hay videos procesándose actualmente.</p>
          </div>
        ) : (
          <div className="adm-table-wrapper">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Contenido</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {videos.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'white' }}>{v.content.slug}</div>
                      <div style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>ID: {v.id.slice(-8)}</div>
                    </td>
                    <td>
                      <span className="adm-badge" style={{ 
                        background: getStatusColor(v.status) + '22', 
                        color: getStatusColor(v.status),
                        borderColor: getStatusColor(v.status) + '44'
                      }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ width: 200 }}>
                      {v.status === 'PROCESSING' || v.status === 'COMPLETED' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div className="adm-progress-bar">
                            <div 
                              className={`adm-progress-fill ${v.status === 'COMPLETED' ? 'success' : ''}`}
                              style={{ width: `${v.status === 'COMPLETED' ? 100 : (v.progress || 0)}%` }}
                            />
                          </div>
                          <div style={{ fontSize: '.7rem', textAlign: 'right', fontWeight: 700 }}>
                            {v.status === 'COMPLETED' ? '100%' : `${v.progress || 0}%`}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--adm-muted)', fontSize: '.75rem' }}>En espera...</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '.8rem' }}>{new Date(v.createdAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>{new Date(v.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="adm-btn adm-btn--gray" style={{ padding: '6px 12px' }}>Detalles</button>
                        {v.status !== 'COMPLETED' && (
                          <button 
                            className="adm-btn" 
                            style={{ padding: '6px 12px', background: 'var(--adm-danger)', color: 'white', border: 'none' }}
                            onClick={() => handleCancel(v.id, v.content.slug)}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div className="adm-table-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: 'var(--adm-primary)22', color: 'var(--adm-primary)', padding: 10, borderRadius: 12 }}>
              <Activity size={20} className="animate-pulse" />
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--adm-muted)', fontWeight: 600 }}>PROCESANDO</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{videos.filter(v => v.status === 'PROCESSING').length}</div>
            </div>
          </div>
        </div>
        <div className="adm-table-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: 'var(--adm-yellow)22', color: 'var(--adm-yellow)', padding: 10, borderRadius: 12 }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--adm-muted)', fontWeight: 600 }}>EN COLA</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{videos.filter(v => v.status === 'PENDING' || v.status === 'QUEUED').length}</div>
            </div>
          </div>
        </div>
        <div className="adm-table-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: 'var(--adm-success)22', color: 'var(--adm-success)', padding: 10, borderRadius: 12 }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--adm-muted)', fontWeight: 600 }}>COMPLETADOS HOY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{videos.filter(v => v.status === 'COMPLETED').length}</div>
            </div>
          </div>
        </div>
        <div className="adm-table-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ background: 'var(--adm-danger)22', color: 'var(--adm-danger)', padding: 10, borderRadius: 12 }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--adm-muted)', fontWeight: 600 }}>FALLIDOS</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{videos.filter(v => v.status === 'FAILED').length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
