'use client';
import { adminFetch } from '@/lib/admin-api';

import { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, PlayCircle, X } from 'lucide-react';
import Link from 'next/link';
import { API_ROUTES } from '@/lib/api-routes';

interface VideoStatus {
    id: string;
    contentId: string;
    processingJobId: string | null;
    status: string;
    createdAt: string;
    errorMessage?: string;
    type?: string;
    content: {
        slug: string;
        translations?: { title: string }[];
    };
    episode?: {
        number: number;
        season: {
            number: number;
            content?: {
                slug: string;
                translations?: { title: string }[];
            };
        };
    };
}

export default function FailedVideosPage() {
    const [videos, setVideos] = useState<VideoStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorModal, setErrorModal] = useState<VideoStatus | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
                // Reusamos el endpoint de status, que trae los fallidos en el historial
                const res = await adminFetch(API_ROUTES.ADMIN.VIDEOS_STATUS, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    const allVideos = data.data?.videos || [];
                    // Filtramos solo los fallidos
                    setVideos(allVideos.filter((v: VideoStatus) => v.status === 'FAILED'));
                }
            } catch (err) {
                console.error('Error fetching video status:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleRetryAll = async () => {
        if (!window.confirm('¿Deseas reintentar TODOS los videos fallidos?')) return;
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
            const res = await adminFetch(API_ROUTES.ADMIN.VIDEOS_RETRY_FAILED, {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                alert('Todos los videos fallidos han sido reenviados a la cola.');
                setVideos([]); // Limpiamos la lista porque pasaron a QUEUED
            } else {
                const err = await res.json();
                alert(`Error al reintentar todos: ${err.error || 'No se pudo completar la operación'}`);
            }
        } catch (err) {
            console.error('Retry all error:', err);
            alert('Error de conexión al intentar reintentar todos');
        }
    };

    const handleRetry = async (id: string, slug: string) => {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
            const res = await adminFetch(API_ROUTES.ADMIN.UPLOAD.RETRY_VIDEO(id), {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                setVideos(prev => prev.filter(v => v.id !== id));
            } else {
                const err = await res.json();
                alert(`Error al reintentar: ${err.error || 'No se pudo reintentar'}`);
            }
        } catch (err) {
            console.error('Retry error:', err);
            alert('Error de conexión al intentar reintentar');
        }
    };

    const handleCancel = async (id: string, slug: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas cancelar/borrar la subida de "${slug}"?`)) return;

        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
            const res = await adminFetch(API_ROUTES.ADMIN.UPLOAD.DELETE_VIDEO(id), {
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

    const getVideoName = (v: any) => {
        let title = v.content?.translations?.[0]?.title || v.content?.slug;
        if (!title && v.originalPath) {
            title = v.originalPath.split('/').pop();
        }
        if (!title) title = 'Sin título';

        if (v.type === 'EPISODE' && v.episode) {
            const seriesTitle = v.episode.season.content?.translations?.[0]?.title || v.episode.season.content?.slug || title;
            return `${seriesTitle} - T${v.episode.season.number} E${v.episode.number}`;
        }

        if (v.type === 'TRAILER') {
            return `Tráiler: ${title}`;
        }

        return title;
    };

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <Link href="/admin/processing" className="adm-btn adm-btn--gray" style={{ padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ArrowLeft size={16} /> Volver
                        </Link>
                    </div>
                    <h1 className="adm-page-title" style={{ color: 'var(--adm-danger)' }}>Videos Fallidos</h1>
                    <p className="adm-page-subtitle">Revisa el motivo por el cual estos videos no pudieron procesarse.</p>
                </div>
            </div>

            <div className="adm-table-card">
                <div className="adm-table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <h2 className="adm-table-card-title">Listado de Fallos</h2>
                    {videos.length > 0 && (
                        <button
                            className="adm-btn"
                            onClick={handleRetryAll}
                            style={{ background: 'var(--adm-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}
                        >
                            Reintentar Todos
                        </button>
                    )}
                </div>

                {loading ? (
                    <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--adm-primary)" />
                    </div>
                ) : videos.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center', color: 'var(--adm-muted)' }}>
                        <CheckCircle2 size={48} style={{ marginBottom: 16, opacity: 0.3, color: 'var(--adm-success)' }} />
                        <p>No hay videos fallidos actualmente. ¡Todo perfecto!</p>
                    </div>
                ) : (
                    <div className="adm-table-wrapper">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Contenido</th>
                                    <th>Tipo</th>
                                    <th>Fecha de Intento</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {videos.map(v => (
                                    <tr key={v.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'white' }}>{getVideoName(v)}</div>
                                            <div style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>ID: {v?.id?.slice(-8)}</div>
                                        </td>
                                        <td>
                                            <span className="adm-badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#ccc' }}>
                                                {v.type || 'VIDEO'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '.8rem' }}>{new Date(v.createdAt).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>{new Date(v.createdAt).toLocaleTimeString()}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    className="adm-btn"
                                                    style={{ padding: '6px 12px', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid rgba(244, 63, 94, 0.2)' }}
                                                    onClick={() => setErrorModal(v)}
                                                >
                                                    Motivo del Error
                                                </button>
                                                <button
                                                    className="adm-btn"
                                                    style={{ padding: '6px 12px', background: 'var(--adm-primary)', color: 'white', border: 'none' }}
                                                    onClick={() => handleRetry(v.id, v?.content?.slug || 'video')}
                                                >
                                                    Reintentar
                                                </button>
                                                <button
                                                    className="adm-btn"
                                                    style={{ padding: '6px 12px', background: 'var(--adm-danger)', color: 'white', border: 'none' }}
                                                    onClick={() => handleCancel(v.id, v?.content?.slug || 'video')}
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Error Modal for Failed Jobs */}
            {errorModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                }} onClick={() => setErrorModal(null)}>
                    <div style={{
                        background: '#111', width: '100%', maxWidth: 500, borderRadius: 12,
                        border: '1px solid #333', display: 'flex', flexDirection: 'column',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid #333', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a',
                            borderTopLeftRadius: 12, borderTopRightRadius: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <AlertCircle size={18} color="var(--adm-danger)" />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Motivo del Error</h3>
                            </div>
                            <button
                                onClick={() => setErrorModal(null)}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.5, color: '#ccc' }}>
                                El procesamiento de <strong>{getVideoName(errorModal)}</strong> ha fallado.
                            </p>
                            <div style={{
                                padding: 16, background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
                                borderRadius: 8, color: '#f43f5e', fontSize: '0.9rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap'
                            }}>
                                {errorModal.errorMessage || 'Error desconocido (no hay detalles guardados).'}
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 8, fontSize: '0.9rem', color: '#aaa', lineHeight: 1.5 }}>
                                <strong style={{ color: 'white' }}>¿Qué debes hacer?</strong>
                                <ul style={{ margin: '8px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <li>Si dice <strong>"Archivo corrompido"</strong>, <strong>"moov atom not found"</strong> o <strong>"Invalid data found"</strong>, significa que el archivo original de video que subiste está dañado, incompleto o no se terminó de subir bien.</li>
                                    <li>Debes <strong>eliminar</strong> este video de tu contenido y <strong>volver a subir el archivo</strong> asegurándote de no cerrar la pestaña hasta que llegue al 100%.</li>
                                    <li>Si dice "Timeout" o "ETIMEDOUT", pudo ser una caída de internet en el servidor. En ese caso, usa el botón "Reintentar".</li>
                                </ul>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                <button
                                    className="adm-btn adm-btn--primary"
                                    onClick={() => setErrorModal(null)}
                                >
                                    Entendido
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
