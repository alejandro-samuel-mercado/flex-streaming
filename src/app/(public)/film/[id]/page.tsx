'use client';
import '@/app/homepage.css';

import FilmComments from '@/components/film/FilmComments';
import TrailerModal from '@/components/film/TrailerModal';
import PublicLayout from '@/components/layout/PublicLayout';
import { useAuth } from '@/context/AuthContext';
import { userFetch } from '@/lib/api-client';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';
import { getContentTypeLabel } from '@/lib/content-types';
import { ArrowLeft, ChevronDown, Download, Heart, MonitorPlay, Play, Star, Tag } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const SERIES_TYPES = ['SERIES', 'ANIME', 'NOVELA', 'REALITY_SHOW', 'TALK_SHOW', 'VARIETY_SHOW', 'EDUCATIONAL', 'KIDS', 'FAMILY', 'DOCUDRAMA'];

export default function FilmDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const { user: authUser } = useAuth();
    const isReseller = authUser?.role === 'RESELLER';
    const [content, setContent] = useState<any>(null);
    const [related, setRelated] = useState<any[]>([]);
    const [recommended, setRecommended] = useState<any[]>([]);
    const [trending, setTrending] = useState<any[]>([]);
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isTrailerOpen, setIsTrailerOpen] = useState(false);
    const [selectedSeason, setSelectedSeason] = useState(0);
    
    const [isFavorited, setIsFavorited] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    
    const favToggledRef = useRef(false);

    // Initial Profile Sync
    useEffect(() => {
        if (!authUser) return;
        const syncProfileId = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) return;
            try {
                const res = await userFetch(API_ROUTES.PROFILES.LIST, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const json = await res.json();
                const profiles: any[] = json?.data ?? [];
                if (profiles.length > 0) {
                    const stored = localStorage.getItem('profileId');
                    const isValid = profiles.some((p: any) => p.id === stored);
                    if (!isValid) localStorage.setItem('profileId', profiles[0].id);
                }
            } catch (e) { console.error('[profileSync]', e); }
        };
        syncProfileId();
    }, [authUser]);

    // Check Favorites & Likes
    useEffect(() => {
        if (!content?.id) return;
        
        // 1. Check local storage first (for guests)
        try {
            const localFavs = JSON.parse(localStorage.getItem('local_favorites') || '[]');
            if (localFavs.includes(content.id)) setIsFavorited(true);
        } catch (err) {}

        // 2. Check API if logged in
        if (!authUser) return;
        const token = localStorage.getItem('accessToken');
        const profileId = localStorage.getItem('profileId');
        if (!token || !profileId) return;

        const checkData = async () => {
            try {
                const favRes = await userFetch(`${API_ROUTES.FAVORITES.BASE}/${content.id}/check`);
                const favJson = await favRes.json();
                
                if (favJson.success && !favToggledRef.current) setIsFavorited(favJson.data.inList);
            } catch (err) { console.error(err); }
        };
        checkData();
    }, [content?.id, authUser]);

    // Main Content Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`${API_ROUTES.CONTENT.BASE}/${id}`, { cache: 'no-store' });
                const resJson = await res.json();
                if (resJson.success && resJson.data) setContent(resJson.data);

                const [relatedRes, recommendedRes, trendingRes] = await Promise.all([
                    fetch(`${API_ROUTES.CONTENT.BASE}/${id}/related`),
                    fetch(API_ROUTES.CONTENT.FEATURED),
                    fetch(API_ROUTES.HOMEPAGE.DATA)
                ]);

                const relatedJson = await relatedRes.json();
                const recommendedJson = await recommendedRes.json();
                const trendingJson = await trendingRes.json();

                if (relatedJson.success && relatedJson.data && relatedJson.data.length > 0) {
                    setRelated(relatedJson.data);
                } else if (trendingJson.success && trendingJson.data?.estrenos) {
                    setRelated(trendingJson.data.estrenos.filter((item: any) => item.id !== id));
                }
                
                if (recommendedJson.success && recommendedJson.data) setRecommended(recommendedJson.data.filter((item: any) => item.id !== id));
                if (trendingJson.success && trendingJson.data) {
                    if (trendingJson.data.trending) setTrending(trendingJson.data.trending.filter((item: any) => item.id !== id));
                    if (trendingJson.data.recent) setRecent(trendingJson.data.recent.filter((item: any) => item.id !== id));
                }
            } catch (err) { 
                console.error(err); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchData();
    }, [id]);

    const handleToggleFavorite = async (e?: any) => {
        e?.preventDefault();
        
        favToggledRef.current = true;
        const prev = isFavorited;
        setIsFavorited(!prev);

        const token = localStorage.getItem('accessToken');
        const profileId = localStorage.getItem('profileId');
        
        // If guest, save in local storage
        if (!token || !profileId) {
            try {
                let localFavs = JSON.parse(localStorage.getItem('local_favorites') || '[]');
                if (!prev) {
                    if (!localFavs.includes(content?.id)) localFavs.push(content?.id);
                } else {
                    localFavs = localFavs.filter((id: string) => id !== content?.id);
                }
                localStorage.setItem('local_favorites', JSON.stringify(localFavs));
            } catch (err) {}
            return;
        }

        try {
            const method = prev ? 'DELETE' : 'POST';
            const res = await userFetch(`${API_ROUTES.FAVORITES.BASE}/${content?.id}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json();
            if (json.success) setIsFavorited(!prev);
            else setIsFavorited(prev);
        } catch { setIsFavorited(prev); }
    };

    const handleDownload = async () => {
        if (!content) return;
        setIsDownloading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');
            if (!token) {
                alert('Debes iniciar sesión para descargar');
                setIsDownloading(false);
                return;
            }

            const res = await userFetch(`${API_ROUTES.CONTENT.BASE}/${content.id}/download`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    ...(profileId ? { 'X-Profile-Id': profileId } : {}),
                }
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => null);
                throw new Error(errJson?.error || 'No se pudo obtener el enlace de descarga.');
            }
            
            const json = await res.json();
            if (json.success && json.data?.downloadUrl) {
                // Trigger download
                const link = document.createElement('a');
                link.href = json.data.downloadUrl;
                link.setAttribute('download', `${content.title}.mp4`);
                link.setAttribute('target', '_blank'); // Prevent cross-origin navigation
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                throw new Error('El enlace no está disponible.');
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleEpisodeDownload = async (ep: any, epTitle: string) => {
        const token = localStorage.getItem('accessToken');
        if (!token) { alert('Debes iniciar sesión para descargar'); return; }
        try {
            const profileId = localStorage.getItem('profileId');
            const res = await userFetch(
                `${API_ROUTES.CONTENT.BASE}/${content.id}/download?episodeId=${ep.id}`,
                { headers: { 'Authorization': `Bearer ${token}`, ...(profileId ? { 'X-Profile-Id': profileId } : {}) } }
            );
            if (!res.ok) { const e = await res.json().catch(() => null); throw new Error(e?.error || 'Error al descargar'); }
            const json = await res.json();
            if (json.success && json.data?.downloadUrl) {
                const link = document.createElement('a');
                link.href = json.data.downloadUrl;
                link.setAttribute('download', `${epTitle}.mp4`);
                link.setAttribute('target', '_blank'); // Prevent cross-origin navigation
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else { throw new Error('Enlace no disponible'); }
        } catch (err: any) { alert(err.message); }
    };

    if (loading) return (
        <PublicLayout hideSidebar={true}>
            <div className="flex w-full min-h-[60vh] items-center justify-center">
                <div className="adm-spin w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full" />
            </div>
        </PublicLayout>
    );

    if (!content) return (
        <PublicLayout hideSidebar={true}>
            <div className="w-full flex min-h-[60vh] items-center justify-center text-[var(--text-muted)] font-bold text-lg uppercase tracking-widest">
                Contenido no encontrado
            </div>
        </PublicLayout>
    );

    // Data Extraction
    const t = content.translations?.[0] || { title: content.title || content.slug, description: content.description || '' };
    const posterUrl = resolveImageUrl(content.posterUrl);
    const backdropUrl = content.backdropUrl ? resolveImageUrl(content.backdropUrl) : posterUrl;
    
    const isSeries = SERIES_TYPES.includes(content.type);
    const typeLabel = getContentTypeLabel ? getContentTypeLabel(content.type) : content.type;
    const seasons = content.seasons || [];
    const currentSeason = seasons[selectedSeason];
    
    const genres = (content.genres || []).filter((g: any) => g.name);
    const tags = (content.tags || []).filter((t: any) => t.name);
    const directors = (content.directors || []).map((d: any) => d.name).filter(Boolean);
    const cast = (content.actors || []).map((a: any) => a.name).filter(Boolean).slice(0, 5); // Max 5 actors for hero
    
    const hasEpisodesWithVideo = seasons.some((s: any) => s.episodes?.some((e: any) => e.videoFiles && e.videoFiles.some((v: any) => v.status === 'COMPLETED')));
    const hasDirectVideo = content.videoFiles && content.videoFiles.some((v: any) => v.status === 'COMPLETED');
    const canPlay = content.status === 'READY' || content.status === 'ACTIVE';

    return (
        <PublicLayout hideSidebar={true}>
            <div className="page-container flex flex-col gap-12 pb-18 text-[var(--text-main)] ">
                <TrailerModal url={content.trailerUrl || ''} isOpen={isTrailerOpen} onClose={() => setIsTrailerOpen(false)} />

                {/* ═══ 1. SUPER HERO (Data-Rich, No Details Cards) ═══ */}
                <div className="serivia-hero-root relative w-[85%] mx-auto h-auto min-h-[75vh] md:min-h-[85vh] rounded-[32px] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-[var(--border-subtle)] flex items-center -mt-6 md:-mt-18 pt-10 pb-14">
                    
                    {/* Back button moved to end of hero */}

                    {/* Background */}
                    {backdropUrl && (
                        <img 
                            src={backdropUrl} 
                            alt={t.title}
                            className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111218]/90 via-transparent to-transparent pointer-events-none"></div>

                    {/* Content inside Hero */}
                    <div className="relative z-10 p-6 md:px-12 lg:px-16 flex flex-col justify-center w-full max-w-4xl h-full pt-16 pb-8">
                                  {/* Title */}
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-4 text-white drop-shadow-2xl leading-[1.1] tracking-tight">
                            {t.title}
                        </h1>

                        {/* Text Metadata (Replaces Detail Cards) */}
                        <div className="flex flex-col gap-2 mb-6">
                            {t.description && (
                                <p className="text-white/80 font-normal text-sm md:text-base leading-relaxed max-w-3xl my-1">
                                    {t.description}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                            {authUser ? (
                                <>
                                    {canPlay ? (
                                        <Link href={`/film/${id}/watch`} className="serivia-btn-play bg-white text-black hover:bg-gray-200 shadow-xl px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 text-sm md:text-base">
                                            <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                                                <Play size={14} className="text-white fill-white ml-0.5" />
                                            </div>
                                            <span className="tracking-wide">REPRODUCIR</span>
                                        </Link>
                                    ) : (
                                        <button disabled className="serivia-btn-play bg-white/10 text-white/50 border border-white/20 shadow-xl px-6 py-3 rounded-full font-bold cursor-not-allowed tracking-wide text-sm md:text-base">
                                            PRÓXIMAMENTE
                                        </button>
                                    )}

                                    {isReseller && !isSeries && content.downloadAllowed && (
                                        <button onClick={handleDownload} disabled={isDownloading} className="px-6 py-3 rounded-full border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/30 flex items-center gap-2 transition-all text-sm md:text-base">
                                            <Download size={18} /> {isDownloading ? 'Iniciando...' : 'Descargar MP4'}
                                        </button>
                                    )}

                                    {!isReseller && !isSeries && (
                                        <button onClick={handleDownload} disabled={isDownloading} className="px-6 py-3 rounded-full border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/30 flex items-center gap-2 transition-all text-sm md:text-base">
                                            <Download size={18} /> {isDownloading ? 'Iniciando...' : 'Descargar Offline'}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <Link href="/login" className="serivia-btn-play bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/80 shadow-xl px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-transform hover:scale-105 text-sm md:text-base">
                                    <Star size={18} className="fill-black" />
                                    <span className="tracking-wide">SUSCRIBIRSE</span>
                                </Link>
                            )}
                            {content.trailerUrl && (
                                <button onClick={() => setIsTrailerOpen(true)} className="px-6 py-3 rounded-full border border-white/20 bg-white/10 text-white font-bold hover:bg-white/20 flex items-center gap-2 transition-all text-sm md:text-base">
                                    <MonitorPlay size={18} /> Tráiler
                                </button>
                            )}
                            
                            <button onClick={handleToggleFavorite} className="w-12 h-12 rounded-full border border-[var(--border-strong)] bg-[var(--bg-panel)] flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--bg-hover-strong)] transition ml-auto md:ml-3">
                                <Heart size={20} className={isFavorited ? "text-[var(--color-primary)] fill-[var(--color-primary)]" : ""} />
                            </button>
                        </div>
                    </div>
                    {/* Back Button (Inside Hero) - Rendered last for highest interaction priority */}
                    <button onClick={() => router.back()} className="absolute top-8 left-6 md:top-14 md:left-10 z-[100] inline-flex items-center justify-center w-12 h-12 rounded-full bg-black/40 border border-white/20 text-white hover:bg-white hover:text-black transition-all shadow-2xl cursor-pointer">
                        <ArrowLeft size={24} />
                    </button>
                </div>
                
                {/* ═══ EMERGING DATA BAR ═══ */}
                <div className="relative z-20 w-full max-w-4xl mx-auto -translate-y-30 md:-translate-y-30 px-4" style={{ zoom: 0.95 }}>
                    <div className="bg-[var(--bg-solid)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-[24px] p-5 shadow-2xl flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center justify-between">
                        
                        {/* Primary Tags */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="bg-white/10 text-white text-sm px-4 py-1.5 rounded-full font-bold border border-white/20 uppercase tracking-wider">
                                {typeLabel}
                            </span>
                            <span className="bg-[var(--color-primary)] text-black text-sm px-4 py-1.5 rounded-full font-bold flex items-center gap-1">
                                <Star size={16} className="fill-black" /> {content.rating ? content.rating.toFixed(1) : '8.5'}
                            </span>
                            {content.featured && <span className="bg-red-600 text-white font-black uppercase tracking-wider text-xs px-3 py-1.5 rounded-full">Destacado</span>}
                            {content.releaseYear && <span className="bg-[var(--bg-main)] text-[var(--text-main)] text-sm px-4 py-1.5 rounded-full font-semibold border border-[var(--border-subtle)]">{content.releaseYear}</span>}
                            {content.ageRating && <span className="bg-[var(--bg-main)] text-[var(--text-main)] text-sm px-4 py-1.5 rounded-full font-semibold border border-[var(--border-subtle)]">{content.ageRating.code || content.ageRating}</span>}
                            {typeof content.duration === 'number' && content.duration > 0 && !isSeries && <span className="bg-[var(--bg-main)] text-[var(--text-main)] text-sm px-4 py-1.5 rounded-full font-semibold border border-[var(--border-subtle)]">{Math.floor(content.duration/60)}h {content.duration%60}m</span>}
                            {isSeries && <span className="bg-[var(--bg-main)] text-[var(--text-main)] text-sm px-4 py-1.5 rounded-full font-semibold border border-[var(--border-subtle)]">{seasons.length} Temp.</span>}
                        </div>

                        {/* Credits & Genres */}
                        <div className="flex flex-col gap-3 flex-1">
                            {genres.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[var(--color-primary)] font-bold text-sm uppercase tracking-wider">Géneros:</span>
                                    {genres.map((g: any, i: number) => {
                                        const genreName = g.name || g.genre?.name;
                                        if (!genreName) return null;
                                        return (
                                            <Link key={i} href={`/explorar?genreId=${g.id || g.genre?.id}`} className="text-[var(--text-main)] hover:text-[var(--color-primary)] text-sm font-medium hover:underline transition-colors">
                                                {genreName}{i < genres.length - 1 ? ',' : ''}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                            
                            {directors.length > 0 && (
                                <div className="text-sm text-[var(--text-muted)]">
                                    <span className="font-bold text-[var(--text-main)] mr-2 uppercase tracking-wider text-xs">Dirección:</span>
                                    {directors.join(', ')}
                                </div>
                            )}

                            {cast.length > 0 && (
                                <div className="text-sm text-[var(--text-muted)]">
                                    <span className="font-bold text-[var(--text-main)] mr-2 uppercase tracking-wider text-xs">Reparto:</span>
                                    {cast.join(', ')}{content.actors?.length > 5 ? ' y más.' : ''}
                                </div>
                            )}
                            
                            {tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {tags.map((tag: any, i: number) => (
                                        <span key={i} className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded-md">
                                            <Tag size={10} /> {tag.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ 2. LOWER SECTIONS ═══ */}
                
                {/* Episodes Section (If Series) */}
                {isSeries && seasons.length > 0 && (
                    <div className="w-full flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <h2 className="text-3xl font-black text-[var(--text-main)]">Episodios</h2>
                            {seasons.length > 1 && (
                                <div className="relative w-full md:w-auto">
                                    <select
                                        value={selectedSeason}
                                        onChange={e => setSelectedSeason(Number(e.target.value))}
                                        className="w-full appearance-none bg-[var(--bg-panel)] border border-[var(--border-subtle)] text-[var(--text-main)] px-6 py-3 pr-12 rounded-xl font-bold cursor-pointer hover:bg-[var(--bg-hover)] outline-none backdrop-blur-md"
                                    >
                                        <option value="" disabled className="bg-white dark:bg-[#111218] text-black dark:text-white">Selecciona una temporada</option>
                                        {seasons.map((s: any, i: number) => {
                                            const sTitle = s.title || s.translations?.[0]?.title;
                                            const isDefaultSeason = sTitle?.toLowerCase() === `temporada ${s.number}`;
                                            return (
                                                <option key={s.id} value={i} className="bg-white dark:bg-[#111218] text-black dark:text-white">
                                                    Temporada {s.number} {sTitle && !isDefaultSeason ? `— ${sTitle}` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]" />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {(currentSeason?.episodes || []).map((ep: any) => {
                                const epTitle = ep.title || ep.translations?.[0]?.title || `Episodio ${ep.number}`;
                                const epDesc = ep.description || ep.translations?.[0]?.description;
                                const isValidDesc = epDesc && epDesc.toLowerCase() !== 'descripción no disponible' && epDesc.toLowerCase() !== 'description not available';
                                const epThumb = ep.thumbnailUrl || ep.thumbnails?.[0]?.url;
                                const epReady = ep.hasVideo || ep.videoFiles?.some((v: any) => v.status === 'COMPLETED');
                                
                                return (
                                    <Link
                                        href={`/film/${id}/watch?episodeId=${ep.id}`}
                                        key={ep.id}
                                        className="group flex flex-col gap-2 p-3 rounded-[20px] bg-[var(--bg-panel)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:border-[var(--color-primary)] transition-all"
                                    >
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shrink-0 bg-[var(--input-bg)] shadow-sm">
                                            {epThumb ? (
                                                <img src={resolveImageUrl(epThumb)} alt={epTitle} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[var(--border-strong)]">
                                                    <Play size={24} />
                                                </div>
                                            )}
                                            
                                            {epReady ? (
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                        <Play size={16} className="text-black fill-black ml-1" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="absolute top-1.5 right-1.5 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-amber-500 border border-amber-500/30">
                                                    PROX
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col w-full pt-2 px-1">
                                            <h3 className="font-bold text-sm text-[var(--text-main)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 mb-1">
                                                {epTitle}
                                            </h3>
                                            
                                            {isValidDesc && (
                                                <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">
                                                    {epDesc}
                                                </p>
                                            )}
                                            
                                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-[var(--border-subtle)]">
                                                {authUser ? (
                                                    <>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-full hover:bg-[var(--color-primary)]/20 transition-colors">
                                                                <Play size={14} fill="currentColor" /> Reproducir
                                                            </div>
                                                            {ep.duration && (
                                                                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                                                    {Math.floor(ep.duration/60)}m
                                                                </span>
                                                            )}
                                                        </div>
                                                        
                                                        {epReady && (
                                                            <button
                                                                onClick={e => { e.preventDefault(); e.stopPropagation(); handleEpisodeDownload(ep, epTitle); }}
                                                                title={`Descargar ${epTitle}`}
                                                                className="flex items-center justify-center p-2 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all border border-emerald-500/20"
                                                            >
                                                                <Download size={16} strokeWidth={2.5} />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div className="flex items-center justify-center w-full">
                                                        <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-4 py-1.5 rounded-full uppercase tracking-wider text-center flex-1">
                                                            Suscribirse para ver
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Comments Section */}
                <div className="w-full">
                    <h2 className="text-3xl font-black text-[var(--text-main)] mb-6">Comentarios</h2>
                    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-[32px] p-8 md:p-10 shadow-sm backdrop-blur-xl">
                        {canPlay ? (
                            <FilmComments contentId={id as string} />
                        ) : (
                            <div className="text-center py-12">
                                <h4 className="text-xl font-bold text-[var(--text-main)] mb-2">¡Próximamente!</h4>
                                <p className="text-[var(--text-muted)]">Los comentarios estarán disponibles cuando el contenido se estrene.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Serivia Style Carousels */}
                <div className="w-full flex flex-col gap-12 mt-12">
                    {related.length > 0 && <SeriviaPosterRow title="Contenido Relacionado" items={related} />}
                    {trending.length > 0 && <SeriviaPosterRow title="Tendencias" items={trending} />}
                    {recent.length > 0 && <SeriviaPosterRow title="Recién Agregados" items={recent} />}
                    {recommended.length > 0 && <SeriviaPosterRow title="Te Puede Gustar" items={recommended} />}
                </div>
                
            </div>
        </PublicLayout>
    );
}

// ── Native Home Page Style Row ──
function SeriviaPosterRow({ title, items }: { title: string, items: any[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const amount = scrollRef.current.clientWidth * 0.75;
        scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 20);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, []);

    if (!items || items.length === 0) return null;
    
    return (
        <div className="w-full relative group">
            <h2 className="text-2xl font-black text-white mb-6 px-2">{title}</h2>
            <div className="serivia-row-container -mt-2 relative">
                
                {/* Left Arrow */}
                {showLeft && (
                    <button 
                        onClick={(e) => { e.preventDefault(); scroll('left'); }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -mt-4 z-20 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-primary)] hover:text-black shadow-xl"
                        aria-label="Scroll left"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                )}

                {/* Scrollable Track */}
                <div ref={scrollRef} onScroll={handleScroll} className="serivia-row-track py-8 px-4 -mx-4 overflow-x-auto hide-scrollbar custom-scrollbar flex gap-4 relative">
                    {items.map((item: any, idx: number) => {
                        const itemTitle = item.translations?.[0]?.title || item.title || item.slug;
                        const posterUrl = item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url || item.posterUrl;
                        const resolvedImage = posterUrl 
                            ? (posterUrl.startsWith('http') ? posterUrl : `https://api-streamflex.unixxtech.online/api/${posterUrl.replace(/^\//, '')}`)
                            : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=600';

                        return (
                            <Link href={`/film/${item.slug || item.id}`} key={item.id || idx} className="block group/card flex-shrink-0 w-[140px] md:w-[160px]" style={{ textDecoration: 'none' }}>
                                <div className="serivia-poster overflow-hidden rounded-[16px] mb-3 shadow-[0_8px_20px_rgba(0,0,0,0.4)] relative">
                                    <img 
                                        src={resolvedImage} 
                                        alt={itemTitle} 
                                        className="w-full aspect-[2/3] object-cover transition-transform duration-500 group-hover/card:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/card:bg-black/20 transition-colors duration-300"></div>
                                </div>
                                <div className="serivia-poster-info px-1">
                                    <h3 className="text-white font-bold text-[0.95rem] mb-1 truncate">{itemTitle}</h3>
                                    <div className="flex items-center text-[0.8rem] text-gray-400 gap-2">
                                        <span>{item.releaseYear || item.year || '2024'}</span>
                                        <span>•</span>
                                        <span className="flex items-center text-[#FFD700] font-bold">
                                            ★ {item.rating ? item.rating.toFixed(1) : '8.5'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Right Arrow */}
                {showRight && (
                    <button 
                        onClick={(e) => { e.preventDefault(); scroll('right'); }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mt-4 z-20 w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--color-primary)] hover:text-black shadow-xl"
                        aria-label="Scroll right"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                )}

            </div>
        </div>
    );
}
