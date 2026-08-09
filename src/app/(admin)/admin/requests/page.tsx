'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';
import { Loader2, Check, X, FileWarning, Trash2, Settings, ChevronLeft, ChevronRight, Save } from 'lucide-react';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'REQUEST' | 'REPORT'>('REQUEST');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    
    const [dailyLimit, setDailyLimit] = useState(5);
    const [savingLimit, setSavingLimit] = useState(false);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await adminFetch(`${API_ROUTES.REQUESTS.ADMIN_LIST}?type=${activeTab}&page=${page}&limit=20`);
            const data = await res.json();
            if (data.success) {
                setRequests(data.data.requests || []);
                const total = data.data.total || 0;
                setTotalPages(Math.ceil(total / 20) || 1);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const res = await adminFetch(API_ROUTES.REQUESTS.ADMIN_SETTINGS);
            const data = await res.json();
            if (data.success) {
                setDailyLimit(data.data.dailyLimit);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        loadRequests();
    }, [activeTab, page]);

    const updateStatus = async (id: string, status: string) => {
        try {
            await adminFetch(API_ROUTES.REQUESTS.ADMIN_STATUS(id), {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            loadRequests();
        } catch (e) {
            console.error(e);
        }
    };

    const deleteRequest = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este registro permanentemente?')) return;
        try {
            await adminFetch(API_ROUTES.REQUESTS.ADMIN_DELETE(id), { method: 'DELETE' });
            loadRequests();
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveLimit = async () => {
        setSavingLimit(true);
        try {
            await adminFetch(API_ROUTES.REQUESTS.ADMIN_SETTINGS, {
                method: 'PUT',
                body: JSON.stringify({ dailyLimit: Number(dailyLimit) })
            });
            alert('Límite diario actualizado correctamente.');
        } catch (e) {
            console.error(e);
            alert('Error al actualizar el límite.');
        } finally {
            setSavingLimit(false);
        }
    };

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title flex items-center gap-3">
                        <FileWarning size={32} className="text-yellow-400" style={{ color: '#FFD700', marginRight: '8px', display: 'inline-block' }} />
                        Solicitudes y Reportes
                    </h1>
                    <p className="adm-page-subtitle">Gestiona las solicitudes de contenido y reportes de fallas de los usuarios.</p>
                </div>
            </div>

            {/* Configuración Límite Diario */}
            <div className="adm-card mb-6 p-4 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-2xl flex items-center justify-between" style={{ padding: '20px', marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(0,212,255,0.1)', padding: '12px', borderRadius: '12px' }}>
                        <Settings size={24} color="#00D4FF" />
                    </div>
                    <div>
                        <h3 style={{ color: 'white', fontWeight: 800, margin: 0, fontSize: '16px' }}>Límite Diario Global</h3>
                        <p style={{ color: 'var(--adm-muted)', margin: 0, fontSize: '13px', marginTop: '4px' }}>Máximo de solicitudes o reportes por usuario al día.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input 
                        type="number" 
                        min="1"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="adm-input"
                        style={{ width: '100px', textAlign: 'center', fontWeight: 'bold' }}
                    />
                    <button onClick={handleSaveLimit} disabled={savingLimit} className="adm-btn adm-btn--primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {savingLimit ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Guardar
                    </button>
                </div>
            </div>

            {/* Pestañas */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <button 
                    onClick={() => { setActiveTab('REQUEST'); setPage(1); }}
                    style={{ flex: 1, padding: '16px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        backgroundColor: activeTab === 'REQUEST' ? '#00D4FF' : 'rgba(255,255,255,0.05)',
                        color: activeTab === 'REQUEST' ? '#081026' : 'white',
                        transition: 'all 0.2s'
                    }}
                >
                    <FileWarning size={20} />
                    SOLICITUDES
                </button>
                <button 
                    onClick={() => { setActiveTab('REPORT'); setPage(1); }}
                    style={{ flex: 1, padding: '16px', borderRadius: '12px', fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        backgroundColor: activeTab === 'REPORT' ? '#ff3b30' : 'rgba(255,255,255,0.05)',
                        color: activeTab === 'REPORT' ? 'white' : 'white',
                        transition: 'all 0.2s'
                    }}
                >
                    <X size={20} />
                    REPORTES DE FALLAS
                </button>
            </div>

            {loading ? (
                <div className="adm-page flex items-center justify-center h-[40vh]">
                    <Loader2 className="animate-spin" size={40} style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : (
                <div className="adm-table-card">
                    <div className="adm-table-wrapper">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Referencia</th>
                                    <th>Mensaje</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id}>
                                        <td>
                                            <div className="adm-table-process">{req.user?.name || req.user?.username}</div>
                                            <div className="adm-table-muted">{new Date(req.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {req.tmdbPoster && <img src={resolveImageUrl(req.tmdbPoster)} style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />}
                                                <div>
                                                    <div className="adm-table-process" title={req.tmdbTitle || req.content?.title}>{req.tmdbTitle || req.content?.title || 'N/A'}</div>
                                                    {req.tmdbType && <div className="adm-table-muted" style={{ textTransform: 'uppercase' }}>{req.tmdbType}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="adm-table-muted" style={{ maxWidth: '300px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={req.message}>{req.message || '-'}</div>
                                        </td>
                                        <td>
                                            <span className={`adm-badge adm-badge--${req.status === 'RESOLVED' ? 'green' : req.status === 'REJECTED' ? 'red' : req.status === 'REVIEWED' ? 'blue' : 'yellow'}`}>{req.status}</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {req.status === 'PENDING' && (
                                                    <>
                                                        <button onClick={() => updateStatus(req.id, 'RESOLVED')} className="adm-btn adm-btn--ghost" style={{ padding: '8px', color: '#4ade80' }} title="Marcar Resuelto">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => updateStatus(req.id, 'REJECTED')} className="adm-btn adm-btn--ghost" style={{ padding: '8px', color: '#f87171' }} title="Rechazar">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => deleteRequest(req.id)} className="adm-btn adm-btn--ghost" style={{ padding: '8px', color: '#ef4444' }} title="Eliminar Permanentemente">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center" style={{ padding: '3rem', color: 'var(--adm-muted)' }}>
                                            No hay {activeTab === 'REQUEST' ? 'solicitudes' : 'reportes'} registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button 
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="adm-btn adm-btn--ghost"
                                style={{ opacity: page === 1 ? 0.3 : 1 }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span style={{ color: 'var(--adm-muted)', fontWeight: 600, fontSize: '14px' }}>
                                Pág. <strong style={{ color: 'white' }}>{page}</strong> de {totalPages}
                            </span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="adm-btn adm-btn--ghost"
                                style={{ opacity: page === totalPages ? 0.3 : 1 }}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
