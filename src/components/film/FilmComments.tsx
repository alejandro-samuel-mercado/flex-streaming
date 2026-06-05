'use client';

import { useState, useEffect, useCallback } from 'react';
import { Star, MessageSquare, Send, Reply, User } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { useAuth } from '@/context/AuthContext';
import { userFetch } from '@/lib/api-client';

export default function FilmComments({ contentId }: { contentId: string }) {
    const { user: authUser } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [newRating, setNewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [newBody, setNewBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyBody, setReplyBody] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const profileId = typeof window !== 'undefined' ? localStorage.getItem('profileId') : null;

    const fetchReviews = useCallback(async () => {
        try {
            const res = await fetch(API_ROUTES.REVIEWS.BY_CONTENT(contentId));
            const json = await res.json();
            if (json.success) setReviews(json.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [contentId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBody.trim() || newRating === 0) {
            alert('Por favor selecciona una valoración y escribe un comentario.');
            return;
        }

        setSubmitting(true);
        try {
            const profileId = localStorage.getItem('profileId');
            if (!profileId) return;

            const res = await userFetch(API_ROUTES.REVIEWS.CREATE, {
                method: 'POST',
                body: JSON.stringify({
                    contentId,
                    rating: newRating,
                    body: newBody,
                    language: 'es'
                })
            });

            if (res.ok) {
                setNewBody('');
                setNewRating(0);
                fetchReviews();
            } else {
                const json = await res.json();
                alert(json.error || 'Error al publicar el comentario.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReplySubmit = async (parentId: string) => {
        if (!replyBody.trim()) return;

        setSubmittingReply(true);
        try {
            const profileId = localStorage.getItem('profileId');
            if (!profileId) return;

            const res = await userFetch(API_ROUTES.REVIEWS.CREATE, {
                method: 'POST',
                body: JSON.stringify({
                    contentId,
                    body: replyBody,
                    parentId,
                    language: 'es'
                })
            });

            if (res.ok) {
                setReplyBody('');
                setReplyingTo(null);
                fetchReviews();
            } else {
                const json = await res.json();
                alert(json.error || 'Error al publicar respuesta.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmittingReply(false);
        }
    };

    if (loading) return null;

    return (
        <div className="mt-16 pt-10 border-t border-white/10 max-w-5xl !mx-auto" id="comments ">
            <h3 className="text-2xl font-black my-8! flex items-center gap-3">
                <MessageSquare className="text-[#00E5FF]" />
                Comentarios y Valoraciones
            </h3>

            {/* Comment Form */}
            {authUser && profileId ? (
                <div className="bg-white/5 rounded-2xl p-6! !mb-10 border border-white/10 ">
                    <h4 className="font-bold text-lg !mb-4">Deja tu valoración</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-2 !mb-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                                <Star
                                    key={star}
                                    size={24}
                                    className={`cursor-pointer transition-all ${(hoverRating || newRating) >= star
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-white/20'
                                        }`}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setNewRating(star)}
                                />
                            ))}
                            <span className="!ml-2 font-bold text-white/50">{newRating > 0 ? `${newRating}/10` : ''}</span>
                        </div>
                        <textarea
                            className="w-full bg-black/40 border border-white/10 rounded-xl !p-4 text-white focus:outline-none focus:border-[#00E5FF] transition-colors resize-none"
                            rows={3}
                            placeholder="¿Qué te pareció?"
                            value={newBody}
                            onChange={e => setNewBody(e.target.value)}
                        />
                        <div className="!mt-4 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="!px-6 !py-2 bg-[#00E5FF] text-black font-bold rounded-lg hover:bg-[#4DEDFF] transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {submitting ? 'Publicando...' : <><Send size={18} /> Publicar</>}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white/5 rounded-2xl p-8! my-10! border border-white/10 text-center">
                    <MessageSquare size={40} className="mx-auto text-white/20 mb-4" />
                    <h4 className="font-bold text-xl mb-2">Inicia sesión para comentar</h4>
                    <p className="text-white/60">Únete a la comunidad y comparte tu opinión sobre este contenido.</p>
                </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
                {reviews.length === 0 ? (
                    <p className="text-white/40 text-center py-10">Aún no hay comentarios. ¡Sé el primero en opinar!</p>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-white/5 rounded-xl !p-5 border border-white/5">
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#00E5FF]/20 flex items-center justify-center text-[#00E5FF] font-bold overflow-hidden shrink-0">
                                    {review.profile?.avatar ? (
                                        <img src={review.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        review.profile?.name?.substring(0, 2).toUpperCase() || <User size={20} />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 !mb-1">
                                        <span className="font-bold">{review.profile?.name || 'Usuario'}</span>
                                        <span className="text-xs text-white/40">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                        {review.rating && (
                                            <div className="flex items-center gap-1 !ml-auto text-yellow-400 bg-yellow-400/10 !px-2 !py-0.5 rounded text-xs font-bold">
                                                <Star size={12} fill="currentColor" /> {review.rating}/10
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-white/80 leading-relaxed mb-3">{review.body}</p>

                                    {authUser && profileId && (
                                        <button
                                            onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                                            className="text-xs font-bold text-white/40 hover:text-[#00E5FF] transition-colors flex items-center gap-1"
                                        >
                                            <Reply size={14} /> Responder
                                        </button>
                                    )}

                                    {/* Reply Box */}
                                    {replyingTo === review.id && (
                                        <div className="!mt-4 flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 bg-black/40 border border-white/10 rounded-lg !px-3 !py-2 text-sm text-white focus:outline-none focus:border-[#00E5FF]"
                                                placeholder="Escribe una respuesta..."
                                                value={replyBody}
                                                onChange={e => setReplyBody(e.target.value)}
                                            />
                                            <button
                                                onClick={() => handleReplySubmit(review.id)}
                                                disabled={submittingReply}
                                                className="bg-[#00E5FF] text-black !px-4 !py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                                            >
                                                Enviar
                                            </button>
                                        </div>
                                    )}

                                    {/* Replies List */}
                                    {review.replies && review.replies.length > 0 && (
                                        <div className="!mt-4 !pl-4 border-l-2 border-white/10 space-y-4">
                                            {review.replies.map((reply: any) => (
                                                <div key={reply.id} className="flex gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold overflow-hidden shrink-0">
                                                        {reply.profile?.avatar ? (
                                                            <img src={reply.profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            reply.profile?.name?.substring(0, 2).toUpperCase() || <User size={16} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 !mb-1">
                                                            <span className="font-bold text-sm">{reply.profile?.name || 'Usuario'}</span>
                                                            <span className="text-[10px] text-white/40">
                                                                {new Date(reply.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white/70">{reply.body}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
