'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';
import { Loader2, Check, X, FileWarning } from 'lucide-react';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await adminFetch(API_ROUTES.REQUESTS.ADMIN_LIST);
            const data = await res.json();
            if (data.success) {
                setRequests(data.data.requests || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

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

            {loading ? (
                <div className="adm-page flex items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin" size={40} style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : (
                <div className="adm-table-card">
                    <div className="adm-table-wrapper">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
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
                                            <span className={`adm-badge adm-badge--${req.type === 'REQUEST' ? 'blue' : 'red'}`}>
                                                {req.type === 'REQUEST' ? 'SOLICITUD' : 'REPORTE'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="adm-table-process">{req.user?.name || req.user?.username}</div>
                                            <div className="adm-table-muted">{new Date(req.createdAt).toLocaleDateString()}</div>
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
                                            <div className="adm-table-muted" style={{ maxWidth: '250px', whiteSpace: 'normal', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={req.message}>{req.message || '-'}</div>
                                        </td>
                                        <td>
                                            <span className={`adm-badge adm-badge--${req.status === 'RESOLVED' ? 'green' : req.status === 'REJECTED' ? 'red' : 'yellow'}`}>{req.status}</span>
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
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center" style={{ padding: '3rem', color: 'var(--adm-muted)' }}>
                                            No hay solicitudes ni reportes registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
