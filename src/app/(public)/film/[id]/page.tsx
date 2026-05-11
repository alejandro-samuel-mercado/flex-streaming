'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';
import { Play, Plus, ThumbsUp, Star, ArrowLeft, MonitorPlay, Clock, Globe, Calendar, DollarSign, Users, Clapperboard, ChevronDown } from 'lucide-react';
import FilmRow from '@/components/catalog/FilmRow';
import FilmComments from '@/components/film/FilmComments';
import TrailerModal from '@/components/film/TrailerModal';
import Link from 'next/link';
import { getContentTypeLabel } from '@/lib/content-types';
import { useAuth } from '@/context/AuthContext';
import { Check } from 'lucide-react';

// Types that have seasons/episodes
const SERIES_TYPES = ['SERIES', 'ANIME', 'NOVELA', 'REALITY_SHOW', 'TALK_SHOW', 'VARIETY_SHOW', 'EDUCATIONAL', 'KIDS', 'FAMILY', 'DOCUDRAMA'];

// Friendly type labels
const TYPE_LABELS: Record<string, string> = {
    // We'll use the central getContentTypeLabel instead
};

export default function FilmDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [content, setContent] = useState<any>(null);
    const [related, setRelated] = useState<any[]>([]);
    const [trending, setTrending] = useState<any[]>([]);
    const [recommended, setRecommended] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(0);
    const { user: authUser } = useAuth();
    const [isFavorited, setIsFavorited] = useState(false);
    const [isLiked, setIsLiked] = useState(false); // Visual feedback only

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch(`${API_ROUTES.CONTENT.BASE}/${id}`, { cache: 'no-store' });
                const resJson = await res.json();
                if (resJson.success && resJson.data) setContent(resJson.data);

                const [relatedRes, trendingRes, recommendedRes] = await Promise.all([
                    fetch(`${API_ROUTES.CONTENT.BASE}/${id}/related`),
                    fetch(`${API_ROUTES.CONTENT.TRENDING}`),
                    fetch(`${API_ROUTES.CONTENT.FEATURED}`)
                ]);

                const [relatedJson, trendingJson, recommendedJson] = await Promise.all([
                    relatedRes.json(),
                    trendingRes.json(),
                    recommendedRes.json()
                ]);

                if (relatedJson.success && relatedJson.data) setRelated(relatedJson.data);
                if (trendingJson.success && trendingJson.data) setTrending(trendingJson.data.filter((item: any) => item.id !== id));
                if (recommendedJson.success && recommendedJson.data) setRecommended(recommendedJson.data.filter((item: any) => item.id !== id));
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchContent();
    }, [id]);

    useEffect(() => {
        const checkFav = async () => {
            const token = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');
            if (!token || !profileId) return;

            try {
                const res = await fetch(`${API_ROUTES.FAVORITES.BASE}/check/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-profile-id': profileId
                    }
                });
                const json = await res.json();
                if (json.success) setIsFavorited(json.data.isFavorited);
            } catch (err) { console.error(err); }
        };
        if (authUser) checkFav();
    }, [id, authUser]);

    useEffect(() => {
        const checkLike = async () => {
            const token = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');
            if (!token || !profileId) return;

            try {
                const res = await fetch(API_ROUTES.LIKES.CHECK(id), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'x-profile-id': profileId
                    }
                });
                const json = await res.json();
                if (json.success) setIsLiked(json.data.isLiked);
            } catch (err) { console.error(err); }
        };
        if (authUser) checkLike();
    }, [id, authUser]);

    const handleToggleFavorite = async () => {
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

        try {
            const res = await fetch(API_ROUTES.FAVORITES.TOGGLE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-profile-id': profileId
                },
                body: JSON.stringify({ contentId: id })
            });
            const json = await res.json();
            if (json.success) setIsFavorited(json.data.favorited);
        } catch (err) { console.error(err); }
    };

    const handleToggleLike = async () => {
        const token = localStorage.getItem('accessToken');
        const profileId = localStorage.getItem('profileId');
        if (!token) {
            alert('Debes iniciar sesión para dar me gusta.');
            return;
        }
        if (!profileId) {
            alert('Por favor, selecciona un perfil primero.');
            return;
        }

        try {
            const res = await fetch(API_ROUTES.LIKES.TOGGLE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-profile-id': profileId
                },
                body: JSON.stringify({ contentId: id })
            });
            const json = await res.json();
            if (json.success) setIsLiked(json.data.liked);
        } catch (err) { console.error(err); }
    };

    if (loading) return <div style={{ minHeight: '100vh', background: '#030612', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Cargando...</div>;
    if (!content) return <div style={{ minHeight: '100vh', background: '#030612', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>No encontrado</div>;

    const translation = content.translations?.[0] || { title: 'Sin título', description: '' };
    const thumbnails = content.thumbnails || [];
    const poster = thumbnails.find((t: any) => t.type === 'POSTER')?.url;
    const backdrop = thumbnails.find((t: any) => t.type === 'BACKDROP')?.url || poster;
    const genres = (content.genres || []).map((g: any) => g.genre);
    const directors = (content.directors || []).map((d: any) => d.director);
    const cast = (content.actors || []).slice(0, 15);
    const isSeries = SERIES_TYPES.includes(content.type);
    const seasons = content.seasons || [];
    const currentSeason = seasons[selectedSeason];

    const backdropUrl = resolveImageUrl(backdrop);
    const posterUrl = resolveImageUrl(poster);
    const hasEpisodesWithVideo = seasons.some((s: any) =>
        s.episodes?.some((e: any) =>
            e.videoFiles && e.videoFiles.some((v: any) => v.status === 'COMPLETED')
        )
    );
    const hasDirectVideo = content.videoFiles && content.videoFiles.some((v: any) => v.status === 'COMPLETED');
    const canPlay = (content.status === 'READY' || content.status === 'ACTIVE') && (hasEpisodesWithVideo || hasDirectVideo);
    const formatMoney = (n: any) => {
        if (!n || n === '0' || n === 0) return null;
        const num = Number(n);
        if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
        if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
        return `$${num}`;
    };

    return (
        <main style={{ minHeight: '100vh', background: '#030612', color: 'white', position: 'relative' }}>
            <style dangerouslySetInnerHTML={{ __html: `
                .film-hero-content { padding: 180px 7% 100px 7% !important; gap: 24px !important; }
                .film-section { padding: 40px 7% 0 !important; }
                .film-meta-bar { display: flex !important; align-items: center !important; gap: 20px !important; margin-bottom: 32px !important; }
                .film-action-buttons { display: flex !important; align-items: center !important; gap: 16px !important; flex-wrap: wrap !important; }
                .film-detail-grid { display: grid !important; grid-template-columns: 220px 1fr !important; gap: 48px !important; margin-bottom: 64px !important; }
                .film-info-item { padding: 16px 20px !important; margin-bottom: 6px !important; }
                .adm-page, .adm-card, .adm-header { padding: 24px !important; gap: 24px !important; margin-bottom: 24px !important; }
                .episode-card:hover { background: rgba(255,255,255,0.06) !important; border-color: rgba(0,229,255,0.2) !important; transform: translateX(4px) !important; }
                @media (max-width: 768px) {
                    .film-hero-content { padding: 140px 4% 80px 4% !important; }
                    .film-section { padding: 24px 4% 0 !important; }
                    .film-detail-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
                    .film-action-buttons a, .film-action-buttons button:not([style*="width: 56"]) { 
                        flex: 1 !important; min-width: 120px !important; justify-content: center !important; padding: 12px 20px !important; font-size: 14px !important;
                    }
                }
                @media (max-width: 640px) {
                    .film-hero-content { padding: 120px 16px 60px !important; }
                    .film-section { padding: 20px 16px 0 !important; }
                }
            `}} />
            <TrailerModal url={content.trailerUrl || ''} isOpen={isTrailerOpen} onClose={() => setIsTrailerOpen(false)} />

            {/* ═══ HERO BANNER ═══ */}
            <section style={{ position: 'relative', minHeight: '85vh', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {backdropUrl && <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${backdropUrl})`, backgroundSize: 'cover', backgroundPosition: 'center 15%', transform: 'scale(1.05)' }} />}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #030612 0%, rgba(3,6,18,0.7) 50%, transparent 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #030612 0%, rgba(3,6,18,0.3) 50%, transparent 100%)' }} />

                {/* Back */}
                <div style={{ position: 'absolute', top: 74, left: '7%', zIndex: 50 }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: 'rgba(3,6,18,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,229,255,0.2)', color: 'white', textDecoration: 'none', transition: 'all 0.3s' }}>
                        <ArrowLeft size={24} />
                    </Link>
                </div>

                {/* Hero Content */}
                <div className="film-hero-content" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', paddingLeft: '7%', paddingRight: '7%', paddingBottom: 100, paddingTop: 180, flex: 1, justifyContent: 'flex-end' }}>
                    <div style={{ maxWidth: '900px' }}>
                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }} className="film-action-buttons">
                            {content.featured && (
                                <span style={{ background: 'linear-gradient(135deg, #FF6B00, #FF0055)', color: 'white', padding: '4px 12px', fontSize: 11, fontWeight: 900, borderRadius: 4, letterSpacing: 2, textTransform: 'uppercase' }}>TOP 10</span>
                            )}
                            <span style={{ background: 'rgba(15,21,50,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,229,255,0.3)', color: 'white', padding: '4px 12px', fontSize: 11, fontWeight: 900, borderRadius: 4, letterSpacing: 2, textTransform: 'uppercase' }}>
                                {getContentTypeLabel(content.type)}
                            </span>
                            {content.isAdult && (
                                <span style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', padding: '4px 10px', fontSize: 11, fontWeight: 800, borderRadius: 4 }}>+18</span>
                            )}
                        </div>

                        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, marginBottom: 24, textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 0.95, textShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
                            {translation.title}
                        </h1>

                        {/* Meta bar */}
                        <div className="film-meta-bar" style={{ display: 'flex', alignItems: 'center', gap: 20, color: '#d1d5db', fontSize: 15, fontWeight: 700, marginBottom: 32, flexWrap: 'wrap' }}>
                            {content.releaseYear && <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 10px', borderRadius: 4, color: 'white' }}>{content.releaseYear}</span>}
                            {content.ageRating && <span style={{ border: '2px solid rgba(255,255,255,0.4)', padding: '2px 8px', borderRadius: 4, fontSize: 12, color: 'white' }}>{content.ageRating.code}</span>}
                            {content.duration && !isSeries && <span>{content.duration} min</span>}
                            {isSeries && seasons.length > 0 && <span>{seasons.length} temporada{seasons.length > 1 ? 's' : ''}</span>}
                            {content.rating > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(245,197,24,0.1)', padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(245,197,24,0.2)' }}>
                                    <Star size={16} fill="#f5c518" style={{ color: '#f5c518' }} />
                                    <span style={{ color: 'white', fontWeight: 900 }}>{content.rating}</span>
                                </div>
                            )}
                        </div>

                        {/* Synopsis */}
                        <div style={{ 
                            maxHeight: '200px', 
                            overflowY: 'auto', 
                            marginBottom: 32, 
                            paddingRight: 10,
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgba(0,229,255,0.3) transparent'
                        }} className="custom-scrollbar">
                            <p style={{ color: '#e5e7eb', fontSize: 'clamp(0.9rem, 1.5vw, 1.15rem)', lineHeight: 1.7, margin: 0, fontWeight: 500, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                {translation.description}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="film-action-buttons" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                            {canPlay ? (
                                <Link href={`/watch/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 48px', background: 'linear-gradient(135deg, #00E5FF, #0099AA)', color: 'black', fontWeight: 900, borderRadius: 12, textDecoration: 'none', fontSize: 15, boxShadow: '0 10px 30px rgba(0,229,255,0.4)', transition: 'all 0.3s' }}>
                                    <Play size={22} fill="black" /> REPRODUCIR
                                </Link>
                            ) : (
                                <button disabled style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 48px', background: 'rgba(107,114,128,0.5)', color: 'rgba(255,255,255,0.5)', fontWeight: 900, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', cursor: 'not-allowed', fontSize: 15 }}>
                                    <Play size={22} fill="currentColor" /> PRÓXIMAMENTE
                                </button>
                            )}
                            {content.trailerUrl && (
                                <button onClick={() => setIsTrailerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 40px', background: 'rgba(8,13,36,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(0,229,255,0.3)', color: 'white', fontWeight: 700, borderRadius: 12, cursor: 'pointer', fontSize: 15, transition: 'all 0.3s' }}>
                                    <MonitorPlay size={22} /> TRÁILER
                                </button>
                            )}
                            <button
                                onClick={handleToggleFavorite}
                                style={{ width: 56, height: 56, borderRadius: '50%', border: isFavorited ? '1px solid #00E5FF' : '1px solid rgba(0,229,255,0.3)', background: isFavorited ? 'rgba(0,229,255,0.1)' : 'rgba(8,13,36,0.6)', backdropFilter: 'blur(20px)', color: isFavorited ? '#00E5FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                                title={isFavorited ? "Quitar de mi lista" : "Añadir a mi lista"}
                            >
                                {isFavorited ? <Check size={26} /> : <Plus size={26} />}
                            </button>
                             <button
                                onClick={handleToggleLike}
                                style={{ width: 56, height: 56, borderRadius: '50%', border: isLiked ? '1px solid #00E5FF' : '1px solid rgba(0,229,255,0.3)', background: isLiked ? 'rgba(0,229,255,0.1)' : 'rgba(8,13,36,0.6)', backdropFilter: 'blur(20px)', color: isLiked ? '#00E5FF' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}
                                title="Me gusta"
                            >
                                <ThumbsUp size={22} fill={isLiked ? "currentColor" : "none"} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ SEASONS & EPISODES (Moved Higher) ═══ */}
            {isSeries && seasons.length > 0 && (
                <section style={{ padding: '40px 7% 0', position: 'relative', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 4, color: 'rgba(0,229,255,0.8)', textTransform: 'uppercase', margin: 0 }}>
                            Temporadas
                        </h3>
                        {seasons.length > 1 && (
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={selectedSeason}
                                    onChange={e => setSelectedSeason(Number(e.target.value))}
                                    style={{ appearance: 'none', background: 'rgba(15,21,50,0.8)', border: '1px solid rgba(0,229,255,0.3)', color: 'white', padding: '8px 36px 8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                                >
                                    {seasons.map((s: any, i: number) => (
                                        <option key={s.id} value={i} style={{ background: '#0f1532' }}>
                                            Temporada {s.number} {s.translations?.[0]?.title ? `— ${s.translations[0].title}` : ''}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown size={16} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#00E5FF' }} />
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {(currentSeason?.episodes || []).map((ep: any) => {
                            const epTitle = ep.translations?.[0]?.title || `Episodio ${ep.number}`;
                            const epDesc = ep.translations?.[0]?.description || '';
                            const epThumb = ep.thumbnails?.[0]?.url;
                            const epReady = ep.videoFiles?.some((v: any) => v.status === 'COMPLETED');
                            return (
                                <Link
                                    href={`/watch/${id}?episodeId=${ep.id}`}
                                    key={ep.id}
                                    className="episode-card"
                                    style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, borderRadius: 16, textDecoration: 'none', transition: 'all 0.3s', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}
                                >
                                    <div style={{ position: 'relative', width: 120, aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                                        {epThumb ? <img src={resolveImageUrl(epThumb)} alt={epTitle} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }} /> : <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.03)' }} />}
                                        {epReady && (
                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,229,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Play size={16} fill="black" style={{ color: 'black', marginLeft: 2 }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h5 style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 2 }}>
                                            <span style={{ color: '#00E5FF', marginRight: 6 }}>{ep.number}.</span>
                                            {epTitle}
                                        </h5>
                                        {epDesc && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{epDesc}</p>}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* ═══ MAIN CONTENT AREA ═══ */}
            <section className="film-section" style={{ padding: '60px 7% 0', position: 'relative', zIndex: 10 }}>

                {/* ── Info Grid: Poster + Details ── */}
                <div className="film-detail-grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 48, marginBottom: 64 }}>
                    {/* Poster */}
                    {posterUrl && (
                        <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)', aspectRatio: '2/3' }}>
                            <img src={posterUrl} alt={translation.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    )}

                    {/* Details Grid */}
                    <div>
                        {/* Technical Details */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20, marginBottom: 36 }}>
                            {directors.length > 0 && (
                                <DetailItem icon={<Clapperboard size={16} />} label="Director" value={directors.map((d: any) => d.name).join(', ')} />
                            )}
                            {content.originalLanguage && (
                                <DetailItem icon={<Globe size={16} />} label="Idioma Original" value={content.originalLanguage.toUpperCase()} />
                            )}
                            {content.releaseYear && (
                                <DetailItem icon={<Calendar size={16} />} label="Año" value={String(content.releaseYear)} />
                            )}
                            {content.duration && !isSeries && (
                                <DetailItem icon={<Clock size={16} />} label="Duración" value={`${Math.floor(content.duration / 60)}h ${content.duration % 60}m`} />
                            )}
                            {content.country && (
                                <DetailItem icon={<Globe size={16} />} label="País" value={content.country} />
                            )}
                            {content.platform && (
                                <DetailItem icon={<MonitorPlay size={16} />} label="Plataforma" value={content.platform.name} />
                            )}
                            {formatMoney(content.budget) && (
                                <DetailItem icon={<DollarSign size={16} />} label="Presupuesto" value={formatMoney(content.budget)!} />
                            )}
                            {formatMoney(content.revenue) && (
                                <DetailItem icon={<DollarSign size={16} />} label="Ingresos" value={formatMoney(content.revenue)!} />
                            )}
                        </div>

                        {/* Genres */}
                        {genres.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
                                {genres.map((g: any) => (
                                    <Link href={`/explorar?genreId=${g.id}`} key={g.id} style={{ padding: '6px 16px', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 20, fontSize: 12, fontWeight: 800, color: '#4DEDFF', textDecoration: 'none', letterSpacing: 1.5, textTransform: 'uppercase', transition: 'all 0.3s' }}>
                                        {g.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Tags */}
                        {content.tags?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
                                {content.tags.map((t: any) => (
                                    <Link href={`/explorar?tagId=${t.tag.id}`} key={t.tag.id} style={{ padding: '4px 12px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#c084fc', textDecoration: 'none' }}>
                                        #{t.tag.name}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Cast Section ── */}
                {cast.length > 0 && (
                    <div style={{ marginBottom: 64 }}>
                        <h3 style={{ fontSize: 13, fontWeight: 900, letterSpacing: 4, color: 'rgba(0,229,255,0.8)', textTransform: 'uppercase', marginBottom: 24 }}>
                            <Users size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
                            Reparto Principal
                        </h3>
                        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12 }}>
                            {cast.map((a: any, i: number) => (
                                <div key={i} style={{ flexShrink: 0, width: 120, textAlign: 'center' }}>
                                    <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 10px', border: '2px solid rgba(0,229,255,0.15)', background: 'rgba(255,255,255,0.05)' }}>
                                        {a.actor.photoUrl ? (
                                            <img src={a.actor.photoUrl} alt={a.actor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 28, fontWeight: 900 }}>
                                                {a.actor.name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 2, lineHeight: 1.3 }}>{a.actor.name}</p>
                                    {a.character && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>{a.character}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </section>

            {/* ── Comments ── */}
            {canPlay && (
                <div style={{ padding: '0 4%', position: 'relative', zIndex: 10 }}>
                    <FilmComments contentId={id as string} />
                </div>
            )}

            {/* ── Related Content Rows ── */}
            <div style={{ padding: '48px 4% 80px', position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '48px' }}>
                {related.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(0,229,255,0.1)', paddingTop: 48 }}>
                        <FilmRow
                            title="Contenido Relacionado"
                            items={related.map(item => ({
                                id: item.id,
                                title: item.translations?.[0]?.title || item.slug,
                                posterUrl: resolveImageUrl(item.thumbnails?.find((th: any) => th.type === 'POSTER')?.url),
                                backdropUrl: resolveImageUrl(item.thumbnails?.find((th: any) => th.type === 'BACKDROP')?.url),
                                rating: item.rating,
                                year: item.releaseYear,
                                type: item.type
                            }))}
                        />
                    </div>
                )}

                {recommended.length > 0 && (
                    <FilmRow
                        title="Te Puede Gustar"
                        subtitle="Recomendaciones basadas en nuestro contenido destacado"
                        items={recommended.map(item => ({
                            id: item.id,
                            title: item.translations?.[0]?.title || item.slug,
                            posterUrl: resolveImageUrl(item.thumbnails?.find((th: any) => th.type === 'POSTER')?.url),
                            backdropUrl: resolveImageUrl(item.thumbnails?.find((th: any) => th.type === 'BACKDROP')?.url),
                            rating: item.rating,
                            year: item.releaseYear,
                            type: item.type
                        }))}
                    />
                )}

                {trending.length > 0 && (
                    <FilmRow
                        title="Tendencias Actuales"
                        subtitle="Lo más visto en la plataforma"
                        variant="numbered"
                        items={trending.map(item => ({
                            id: item.id,
                            title: item.translations?.[0]?.title || item.slug,
                            posterUrl: resolveImageUrl(item.thumbnails?.find((th: any) => th.type === 'POSTER')?.url),
                            backdropUrl: resolveImageUrl(item.thumbnails?.find((th: any) => th.type === 'BACKDROP')?.url),
                            rating: item.rating,
                            year: item.releaseYear,
                            type: item.type
                        }))}
                    />
                )}
            </div>
        </main>
    );
}

// ── Small helper component ──
function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ color: 'rgba(0,229,255,0.6)' }}>{icon}</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase' }}>{label}</span>
            </div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{value}</p>
        </div>
    );
}
