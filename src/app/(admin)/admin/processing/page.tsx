'use client';
import { adminFetch } from '@/lib/admin-api';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Activity, Clock, CheckCircle2, AlertCircle, PlayCircle, Loader2, X, Terminal, Search, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import { API_ROUTES, API_ORIGIN } from '@/lib/api-routes';

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
    const [viewingLogs, setViewingLogs] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [totalStats, setTotalStats] = useState({
        completed: 0,
        failed: 0,
        processing: 0,
        queued: 0
    });

    // Filters state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [dateFilter, setDateFilter] = useState<string>('');

    useEffect(() => {
        // 1. Initial fetch
        const fetchStatus = async () => {
            try {
                const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
                const res = await adminFetch(API_ROUTES.ADMIN.VIDEOS_STATUS, {
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setVideos(data.data?.videos || []);
                    if (data.data?.stats) {
                        setTotalStats({
                            completed: data.data.stats.totalCompleted,
                            failed: data.data.stats.totalFailed,
                            processing: data.data.stats.totalProcessing,
                            queued: data.data.stats.totalQueued
                        });
                    }
                }
            } catch (err) {
                console.error('Error fetching video status:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
        // Auto-refresco cada 8s para mantener el progreso actualizado al entrar a la página
        const pollInterval = setInterval(fetchStatus, 8000);

        // 2. Setup Sockets
        let socketUrl = API_ORIGIN;
        if (process.env.NEXT_PUBLIC_API_URL) {
            try {
                const url = new URL(process.env.NEXT_PUBLIC_API_URL);
                socketUrl = url.origin;
            } catch (e) {
                socketUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
            }
        }
        const s = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        s.on('video-progress', ({ jobId, progress }) => {
            setVideos(prev => prev.map(v => {
                if (v.processingJobId === jobId) {
                    // Progress should never go backwards
                    const currentProgress = v.progress || 0;
                    return { ...v, progress: Math.max(currentProgress, progress), status: 'PROCESSING' };
                }
                return v;
            }));

            // If we are viewing logs for this job, we should probably auto-refresh them but polling is better
        });

        s.on('video-status', ({ jobId, status }) => {
            // If a job finishes or fails, we refresh the whole list to get updated metadata
            fetchStatus();
        });

        setSocket(s);
        return () => { s.disconnect(); clearInterval(pollInterval); };
    }, []);

    // Poll logs every 2 seconds if modal is open
    useEffect(() => {
        if (!viewingLogs) return;

        let isMounted = true;
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
                const res = await adminFetch(API_ROUTES.ADMIN.JOB_LOGS(viewingLogs), {
                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                });
                if (res.ok && isMounted) {
                    const data = await res.json();
                    if (data.data && data.data.logs) {
                        setLogs(data.data.logs);
                    }
                }
            } catch (err) {
                console.error('Error fetching logs:', err);
            } finally {
                if (isMounted) setLogsLoading(false);
            }
        };

        setLogsLoading(true);
        fetchLogs();
        const interval = setInterval(fetchLogs, 2000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [viewingLogs]);

    const handleCancel = async (id: string, slug: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas cancelar la subida de "${slug}"?`)) return;

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
                setVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'QUEUED', progress: 0 } : v));
            } else {
                const err = await res.json();
                alert(`Error al reintentar: ${err.error || 'No se pudo reintentar'}`);
            }
        } catch (err) {
            console.error('Retry error:', err);
            alert('Error de conexión al intentar reintentar');
        }
    };

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
                // Refresh list
                const resStatus = await adminFetch(API_ROUTES.ADMIN.VIDEOS_STATUS, {
                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                });
                if (resStatus.ok) {
                    const data = await resStatus.json();
                    setVideos(data.data?.videos || []);
                }
                alert('Todos los videos fallidos han sido reenviados a la cola.');
            } else {
                const err = await res.json();
                alert(`Error al reintentar todos: ${err.error || 'No se pudo completar la operación'}`);
            }
        } catch (err) {
            console.error('Retry all error:', err);
            alert('Error de conexión al intentar reintentar todos');
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

    // Filter logic
    const filteredVideos = videos.filter(v => {
        const matchesSearch = (v.content?.slug || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
        const matchesDate = !dateFilter || new Date(v.createdAt).toISOString().split('T')[0] === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
    });

    const sortedVideos = [...filteredVideos].sort((a, b) => {
        const priority: Record<string, number> = {
            'PROCESSING': 0,
            'QUEUED': 1,
            'PENDING': 2,
            'FAILED': 3,
            'COMPLETED': 4
        };

        if (priority[a.status] !== priority[b.status]) {
            return priority[a.status] - priority[b.status];
        }

        if (a.status === 'PROCESSING') {
            return (b.progress || 0) - (a.progress || 0);
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

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

            {/* Stats Grid - Moved to top with better design */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
                gap: 20, 
                marginBottom: 24 
            }}>
                <div className="adm-table-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--adm-primary)', color: 'white', padding: 12, borderRadius: 16, boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)' }}>
                            <Activity size={24} className="animate-pulse" />
                        </div>
                        <div>
                            <div style={{ fontSize: '.8rem', color: 'var(--adm-muted)', fontWeight: 700, letterSpacing: '1px' }}>PROCESANDO</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{totalStats.processing}</div>
                        </div>
                    </div>
                </div>

                <div className="adm-table-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(245, 197, 24, 0.1) 0%, rgba(245, 197, 24, 0.05) 100%)', border: '1px solid rgba(245, 197, 24, 0.2)' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--adm-yellow)', color: 'black', padding: 12, borderRadius: 16, boxShadow: '0 8px 16px rgba(245, 197, 24, 0.3)' }}>
                            <Clock size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '.8rem', color: 'var(--adm-muted)', fontWeight: 700, letterSpacing: '1px' }}>EN COLA / PENDIENTE</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{totalStats.queued}</div>
                        </div>
                    </div>
                </div>

                <div className="adm-table-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(70, 211, 105, 0.1) 0%, rgba(70, 211, 105, 0.05) 100%)', border: '1px solid rgba(70, 211, 105, 0.2)' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--adm-success)', color: 'white', padding: 12, borderRadius: 16, boxShadow: '0 8px 16px rgba(70, 211, 105, 0.3)' }}>
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '.8rem', color: 'var(--adm-muted)', fontWeight: 700, letterSpacing: '1px' }}>TOTAL COMPLETADOS</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{totalStats.completed}</div>
                        </div>
                    </div>
                </div>

                <div className="adm-table-card" style={{ padding: 24, background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.1) 0%, rgba(229, 9, 20, 0.05) 100%)', border: '1px solid rgba(229, 9, 20, 0.2)' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ background: 'var(--adm-danger)', color: 'white', padding: 12, borderRadius: 16, boxShadow: '0 8px 16px rgba(229, 9, 20, 0.3)' }}>
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '.8rem', color: 'var(--adm-muted)', fontWeight: 700, letterSpacing: '1px' }}>TOTAL FALLIDOS</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{totalStats.failed}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="adm-table-card">
                <div className="adm-table-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <h2 className="adm-table-card-title">Cola de Trabajos Recientes (Historial de 100)</h2>
                    <div style={{ display: 'flex', gap: 12 }}>
                        {(totalStats.failed > 0 || videos.some(v => v.status === 'FAILED' || v.status === 'PENDING')) && (
                            <button 
                                className="adm-btn" 
                                onClick={handleRetryAll}
                                style={{ background: 'var(--adm-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)' }}
                            >
                                Reintentar Todo (Pendientes/Fallidos)
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Bar */}
                <div style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid var(--adm-border)', 
                    display: 'flex', 
                    gap: 16, 
                    flexWrap: 'wrap',
                    background: 'rgba(255,255,255,0.02)'
                }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-muted)' }} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                width: '100%', padding: '10px 12px 10px 38px', 
                                background: 'var(--adm-bg-alt)', border: '1px solid var(--adm-border)',
                                borderRadius: 8, color: 'white', fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150 }}>
                        <Filter size={16} style={{ color: 'var(--adm-muted)' }} />
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ 
                                padding: '10px 12px', background: 'var(--adm-bg-alt)', border: '1px solid var(--adm-border)',
                                borderRadius: 8, color: 'white', fontSize: '0.9rem', cursor: 'pointer'
                            }}
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="PROCESSING">Procesando</option>
                            <option value="QUEUED">En Cola</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="FAILED">Fallido</option>
                            <option value="COMPLETED">Completado</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={16} style={{ color: 'var(--adm-muted)' }} />
                        <input 
                            type="date" 
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={{ 
                                padding: '10px 12px', background: 'var(--adm-bg-alt)', border: '1px solid var(--adm-border)',
                                borderRadius: 8, color: 'white', fontSize: '0.9rem', cursor: 'pointer'
                            }}
                        />
                        {dateFilter && (
                            <button 
                                onClick={() => setDateFilter('')}
                                style={{ background: 'transparent', border: 'none', color: 'var(--adm-danger)', cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--adm-primary)" />
                    </div>
                ) : filteredVideos.length === 0 ? (
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
                                {sortedVideos.map(v => (
                                    <tr key={v.id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: 'white' }}>{v?.content?.slug || 'Sin título'}</div>
                                            <div style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>ID: {v?.id?.slice(-8)}</div>
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
                                            {v.status === 'COMPLETED' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <div className="adm-progress-bar">
                                                        <div className="adm-progress-fill success" style={{ width: '100%' }} />
                                                    </div>
                                                    <div style={{ fontSize: '.7rem', textAlign: 'right', fontWeight: 700 }}>100%</div>
                                                </div>
                                            ) : v.status === 'PROCESSING' ? (
                                                (v.progress && v.progress > 0) ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <div className="adm-progress-bar">
                                                            <div className="adm-progress-fill" style={{ width: `${v.progress}%` }} />
                                                        </div>
                                                        <div style={{ fontSize: '.7rem', textAlign: 'right', fontWeight: 700 }}>{v.progress}%</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a78bfa', fontSize: '.75rem' }}>
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Cargando...
                                                    </div>
                                                )
                                            ) : v.status === 'QUEUED' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--adm-muted)', fontSize: '.75rem' }}>
                                                    <Loader2 size={12} className="animate-spin" />
                                                    En cola...
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
                                                {v.processingJobId ? (
                                                    <button
                                                        className="adm-btn adm-btn--gray"
                                                        style={{ padding: '6px 12px' }}
                                                        onClick={() => setViewingLogs(v.processingJobId)}
                                                    >
                                                        Detalles
                                                    </button>
                                                ) : (
                                                    <Link href={`/admin/content/${v.contentId}`} className="adm-btn adm-btn--gray" style={{ padding: '6px 12px', textDecoration: 'none' }}>Editar</Link>
                                                )}
                                                {v.status === 'FAILED' && (
                                                    <button
                                                        className="adm-btn"
                                                        style={{ padding: '6px 12px', background: 'var(--adm-primary)', color: 'white', border: 'none' }}
                                                        onClick={() => handleRetry(v.id, v?.content?.slug || 'video')}
                                                    >
                                                        Reintentar
                                                    </button>
                                                )}
                                                {v.status !== 'COMPLETED' && (
                                                    <button
                                                        className="adm-btn"
                                                        style={{ padding: '6px 12px', background: 'var(--adm-danger)', color: 'white', border: 'none' }}
                                                        onClick={() => handleCancel(v.id, v?.content?.slug || 'video')}
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


            {/* Terminal Modal for Job Logs */}
            {viewingLogs && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
                    zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
                }}>
                    <div style={{
                        background: '#111', width: '100%', maxWidth: 800, borderRadius: 12,
                        border: '1px solid #333', display: 'flex', flexDirection: 'column', height: '80vh',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid #333', display: 'flex',
                            justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a',
                            borderTopLeftRadius: 12, borderTopRightRadius: 12
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <Terminal size={18} color="var(--adm-primary)" />
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Logs del Proceso (Job #{viewingLogs})</h3>
                                {logsLoading && <Loader2 size={14} className="animate-spin" color="var(--adm-muted)" />}
                            </div>
                            <button
                                onClick={() => { setViewingLogs(null); setLogs([]); }}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{
                            flex: 1, overflowY: 'auto', padding: 20, fontFamily: 'monospace', fontSize: '0.85rem',
                            color: '#ccc', display: 'flex', flexDirection: 'column', gap: 8
                        }}>
                            {logs.length === 0 && !logsLoading ? (
                                <div style={{ color: '#666', fontStyle: 'italic' }}>No hay registros disponibles para este proceso todavía...</div>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12 }}>
                                        <span style={{ color: '#666', userSelect: 'none' }}>[{i + 1}]</span>
                                        <span>{log}</span>
                                    </div>
                                ))
                            )}
                            <div style={{ height: 20 }} /> {/* Bottom padding */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
