'use client';

import { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Check, X, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

export default function AdminCommentsPage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('PENDING');

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_ROUTES.ADMIN.BASE}/reviews?status=${filter}`, {
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            const json = await res.json();
            if (json.success) setReviews(json.data.reviews || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const updateStatus = async (id: string, status: string) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_ROUTES.ADMIN.BASE}/reviews/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchReviews();
        } catch (err) {
            console.error(err);
        }
    };

    const deleteReview = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este comentario?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_ROUTES.ADMIN.BASE}/reviews/${id}`, {
                method: 'DELETE',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
            });
            if (res.ok) fetchReviews();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Moderación de Comentarios</h1>
                    <p className="adm-page-subtitle">Gestiona reseñas y comentarios de los usuarios</p>
                </div>
            </div>

            <div className="adm-table-card">
                <div className="adm-table-card-header" style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => setFilter('PENDING')} 
                        className={`adm-btn ${filter === 'PENDING' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    >
                        Pendientes
                    </button>
                    <button 
                        onClick={() => setFilter('APPROVED')} 
                        className={`adm-btn ${filter === 'APPROVED' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    >
                        Aprobados
                    </button>
                    <button 
                        onClick={() => setFilter('REJECTED')} 
                        className={`adm-btn ${filter === 'REJECTED' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    >
                        Rechazados
                    </button>
                </div>

                <div style={{ padding: '20px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Loader2 className="animate-spin text-[var(--adm-muted)]" size={32} />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--adm-muted)' }}>
                            <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                            <p>No hay comentarios en esta categoría</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {reviews.map(r => (
                                <div key={r.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--adm-border)', borderRadius: '8px', padding: '16px', display: 'flex', gap: '16px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <strong>{r.profile?.name}</strong>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)' }}>en <em>{r.content?.slug}</em></span>
                                            {r.rating && (
                                                <span className="adm-badge adm-badge--blue" style={{ marginLeft: 'auto' }}>⭐ {r.rating}/10</span>
                                            )}
                                        </div>
                                        {r.title && <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'white' }}>{r.title}</h4>}
                                        <p style={{ margin: 0, color: 'var(--adm-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>{r.body}</p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                                        {filter !== 'APPROVED' && (
                                            <button className="adm-btn adm-btn--primary" style={{ padding: '6px 12px' }} onClick={() => updateStatus(r.id, 'APPROVED')} title="Aprobar">
                                                <Check size={16} />
                                            </button>
                                        )}
                                        {filter !== 'REJECTED' && (
                                            <button className="adm-btn" style={{ background: '#f59e0b', color: 'black', padding: '6px 12px', border: 'none' }} onClick={() => updateStatus(r.id, 'REJECTED')} title="Rechazar">
                                                <AlertCircle size={16} />
                                            </button>
                                        )}
                                        <button className="adm-btn" style={{ background: 'var(--adm-danger)', color: 'white', padding: '6px 12px', border: 'none' }} onClick={() => deleteReview(r.id)} title="Eliminar permanentemente">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
