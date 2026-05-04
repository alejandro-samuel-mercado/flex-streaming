'use client';

import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import { MessageSquare, Loader2, Trash2, Eye, ExternalLink, Calendar, Star } from 'lucide-react';
import Link from 'next/link';


export default function AdminCommentsPage() {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const fetchComments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '20' });
            const res = await adminFetch(`${API_ROUTES.ADMIN.BASE}/reviews?${params}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.data.reviews || []);
                setTotalPages(Math.ceil((data.data.total || 0) / 20));
            }
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [page]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este comentario? Esta acción no se puede deshacer.')) return;
        setDeletingId(id);
        try {
            const res = await adminFetch(`${API_ROUTES.ADMIN.BASE}/reviews/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setComments(comments.filter(c => c.id !== id));
            } else {
                alert('No se pudo eliminar el comentario.');
            }
        } catch (err) {
            console.error('Error al eliminar:', err);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Moderación de Comentarios</h1>
                    <p className="adm-page-subtitle">Gestiona las reseñas y comentarios de los usuarios</p>
                </div>
            </div>

            <div className="adm-table-card">
                {loading ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--adm-muted)' }}>
                        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px' }} />
                        <p>Cargando comentarios...</p>
                    </div>
                ) : (
                    <div className="adm-table-wrapper">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Contenido / Rating</th>
                                    <th>Mensaje</th>
                                    <th>Fecha</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comments.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No hay comentarios en la plataforma.</td></tr>
                                ) : comments.map(comment => (
                                    <tr key={comment.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--adm-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {comment.profile?.name ? comment.profile.name.charAt(0).toUpperCase() : <MessageSquare size={16} />}
                                                </div>
                                                <div style={{ fontWeight: 600, color: 'white', fontSize: '.9rem' }}>
                                                    {comment.profile?.name || 'Usuario Desconocido'}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                {comment.content ? (
                                                    <Link href={`/film/${comment.content.slug}`} target="_blank" style={{ color: 'var(--color-primary)', fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                                                        {comment.content.slug.substring(0, 20)}... <ExternalLink size={12} />
                                                    </Link>
                                                ) : <span style={{ color: 'var(--adm-muted)' }}>Sin contenido</span>}

                                                {comment.rating !== null && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: '.85rem' }}>
                                                        <Star size={12} fill="currentColor" /> {comment.rating}/10
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: 300 }}>
                                            <div style={{
                                                fontSize: '.85rem',
                                                color: 'var(--adm-text)',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                background: 'rgba(255,255,255,0.03)',
                                                padding: '6px 10px',
                                                borderRadius: 6
                                            }} title={comment.body}>
                                                {comment.body}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '.85rem', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Calendar size={14} />
                                                {new Date(comment.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="adm-icon-btn adm-icon-btn--danger"
                                                onClick={() => handleDelete(comment.id)}
                                                disabled={deletingId === comment.id}
                                                title="Eliminar comentario"
                                            >
                                                {deletingId === comment.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'center', gap: 8 }}>
                        <button
                            className="adm-btn adm-btn--ghost adm-btn--sm"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            Anterior
                        </button>
                        <span style={{ padding: '4px 12px', fontSize: '.9rem', color: 'var(--adm-muted)' }}>Página {page} de {totalPages}</span>
                        <button
                            className="adm-btn adm-btn--ghost adm-btn--sm"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
