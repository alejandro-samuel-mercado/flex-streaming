'use client';

import { userFetch } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/api-routes';
import { getContentTypeLabel } from '@/lib/content-types';
import { Check, ChevronLeft, ChevronRight, Play, Plus, Star } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

interface FilmItem {
    id: string;
    title: string;
    posterUrl: string | null;
    backdropUrl: string | null;
    rating?: number | null;
    year?: number | null;
    type?: string;
    duration?: number | null;
    genres?: string[];
    customLink?: string;
    progress?: number;
}

interface FilmRowProps {
    title: string;
    subtitle?: string;
    items: FilmItem[];
    variant?: 'default' | 'large' | 'numbered';
    accentColor?: string;
    exploreUrl?: string;
}

export default function FilmRow({ title, subtitle, items, variant = 'default', accentColor, exploreUrl }: FilmRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.clientWidth * 0.75;
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -amount : amount,
            behavior: 'smooth',
        });
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 20);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
    };

    if (items.length === 0) return null;

    const typeLabel = (type?: string) => {
        return getContentTypeLabel(type);
    };

    return (
        <section className="film-row-section" id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            <div className="film-row-header">
                <div>
                    <h2 className="film-row-title" style={accentColor ? { '--row-accent': accentColor } as React.CSSProperties : undefined}>
                        {title}
                    </h2>
                    {subtitle && <p className="film-row-subtitle">{subtitle}</p>}
                </div>
                {exploreUrl && (
                    <Link href={exploreUrl} className="film-row-more-btn flex flex-row items-center gap-4 my-4!">
                        Ver todo
                        <ChevronRight size={16} />
                    </Link>
                )}
            </div>

            <div className="film-row-wrapper">
                {/* Left Arrow */}
                {showLeft && (
                    <button className="film-row-arrow film-row-arrow--left" onClick={() => scroll('left')} aria-label="Anterior">
                        <ChevronLeft size={24} />
                    </button>
                )}

                {/* Scrollable row */}
                <div ref={scrollRef} className={`film-row-track film-row-track--${variant}`} onScroll={handleScroll}>
                    {items.map((item, index) => (
                        <Link key={item.id} href={item.customLink || `/film/${item.id}`} className={`film-card film-card--${variant}`}>
                            {/* Number for numbered variant */}
                            {variant === 'numbered' && (
                                <span className="film-card-number">{index + 1}</span>
                            )}

                            {/* Image */}
                            <div className="film-card-img-wrap">
                                <img
                                    src={item.posterUrl || item.backdropUrl || 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=800&auto=format&fit=crop'}
                                    alt={item.title}
                                    className="film-card-img"
                                />
                                <div className="film-card-overlay" />

                                {/* Hover buttons */}
                                <div className="film-card-hover-actions">
                                    <button className="film-card-action-btn film-card-action-play" aria-label="Reproducir" onClick={(e) => e.preventDefault()}>
                                        <Play size={16} fill="white" />
                                    </button>
                                    <FavoriteCardButton contentId={item.id} />
                                </div>

                                {/* Progress bar for "Continue Watching" */}
                                {item.progress !== undefined && item.duration && (
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.2)', zIndex: 5 }}>
                                        <div style={{ width: `${Math.min(100, (item.progress / item.duration) * 100)}%`, height: '100%', background: 'var(--color-primary)', boxShadow: '0 0 10px var(--color-primary)' }} />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="film-card-info">
                                <span className="film-card-title">{item.title}</span>
                                <div className="film-card-meta">
                                    {item.rating && item.rating > 0 && (
                                        <span className="film-card-rating">
                                            <Star size={10} fill="#f5c518" stroke="#f5c518" />
                                            {item.rating.toFixed(1)}
                                        </span>
                                    )}
                                    {item.year && <span>{item.year}</span>}
                                    {item.type && <span className="film-card-type">{typeLabel(item.type)}</span>}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Right Arrow */}
                {showRight && (
                    <button className="film-row-arrow film-row-arrow--right" onClick={() => scroll('right')} aria-label="Siguiente">
                        <ChevronRight size={24} />
                    </button>
                )}
            </div>
        </section>
    );
}

// ── Favorite button for cards ──────────────────────────────────────────────────
function FavoriteCardButton({ contentId }: { contentId: string }) {
    const [favorited, setFavorited] = useState(false);
    const [loading, setLoading] = useState(false);
    const fetchedRef = useRef(false);

    useEffect(() => {
        const checkInitialState = async () => {
            if (fetchedRef.current) return;
            const token = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');
            if (!token || !profileId) return;

            try {
                const res = await userFetch(`${API_ROUTES.FAVORITES.BASE}/check/${contentId}`);
                const json = await res.json();
                if (json.success) {
                    setFavorited(json.data.isFavorited);
                    fetchedRef.current = true;
                }
            } catch (e) {
                console.error('Error checking favorite:', e);
            }
        };
        checkInitialState();
    }, [contentId]);

    const handleClick = useCallback(async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem('accessToken');
        const profileId = localStorage.getItem('profileId');

        if (!token) {
            alert('Debes iniciar sesión para guardar favoritos.');
            return;
        }
        if (!profileId) {
            alert('Por favor, selecciona un perfil primero.');
            return;
        }

        if (loading) return;
        setLoading(true);
        const prev = favorited;
        setFavorited(!prev);

        try {
            const res = await userFetch(API_ROUTES.FAVORITES.TOGGLE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ contentId }),
            });
            const json = await res.json();
            
            if (json.success && json.data?.error === 'invalid_reference') {
                console.warn('[FilmRow] invalid_reference detected, attempting to fix profileId...');
                try {
                    const profilesRes = await userFetch(API_ROUTES.PROFILES.LIST, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const profilesJson = await profilesRes.json();
                    const firstProfile = profilesJson?.data?.[0] || profilesJson?.data?.profiles?.[0];
                    if (firstProfile?.id) {
                        console.log('[FilmRow] fixed profileId from', profileId, 'to', firstProfile.id);
                        localStorage.setItem('profileId', firstProfile.id);
                        
                        const retryRes = await userFetch(API_ROUTES.FAVORITES.TOGGLE, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'x-profile-id': firstProfile.id },
                            body: JSON.stringify({ contentId }),
                        });
                        const retryJson = await retryRes.json();
                        if (retryJson.success && !retryJson.data?.error) {
                            setFavorited(retryJson.data.favorited);
                        } else {
                            console.error('[FilmRow] retry failed:', retryJson);
                            setFavorited(prev);
                        }
                    } else {
                        console.error('[FilmRow] no valid profiles found during retry');
                        setFavorited(prev);
                    }
                } catch (retryErr) {
                    console.error('[FilmRow] retry exception:', retryErr);
                    setFavorited(prev);
                }
            } else if (json.success && !json.data?.error) {
                setFavorited(json.data.favorited);
            } else {
                console.error('[FilmRow] normal toggle failed:', json);
                setFavorited(prev);
            }
        } catch (err) {
            console.error('[FilmRow] toggle exception:', err);
            setFavorited(prev);
        } finally {
            setLoading(false);
        }
    }, [contentId, favorited, loading]);

    return (
        <button
            className="film-card-action-btn"
            aria-label={favorited ? 'Quitar de mi lista' : 'Agregar a mi lista'}
            onClick={handleClick}
            style={{ color: favorited ? 'var(--color-primary)' : 'white', borderColor: favorited ? 'var(--color-primary)' : undefined }}
        >
            {favorited ? <Check size={16} /> : <Plus size={16} />}
        </button>
    );
}
