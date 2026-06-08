'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, CheckCircle2, Film, Tv, Star, Calendar, AlertTriangle, X } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';

interface TMDBResult {
    id: number;
    title?: string;
    name?: string;
    original_title?: string;
    original_name?: string;
    overview?: string;
    poster_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    media_type?: string;
}

interface TMDBSuggestionsProps {
    title: string;
    contentId: string;
    onApplied: () => void;
}

export default function TMDBSuggestions({ title, contentId, onApplied }: TMDBSuggestionsProps) {
    const [results, setResults] = useState<TMDBResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState(title);
    const [applied, setApplied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const doSearch = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const res = await adminFetch(`${API_ROUTES.TMDB.SEARCH}?query=${encodeURIComponent(query)}&type=multi`);
            const json = await res.json();
            if (json.success && json.data) {
                // Filter to only movies and tv shows
                const filtered = json.data
                    .filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv' || r.title || r.name)
                    .slice(0, 6);
                setResults(filtered);
            } else {
                setResults([]);
            }
        } catch (err) {
            console.error('TMDB search error:', err);
            setError('Error al buscar en TMDB');
        } finally {
            setLoading(false);
        }
    }, []);

    // Auto-search on mount
    useEffect(() => {
        if (title) {
            doSearch(title);
        }
    }, [title, doSearch]);

    const handleApply = async (result: TMDBResult) => {
        const confirmMsg = `¿Importar datos de "${result.title || result.name}"?\n\nEsto reemplazará el título, sinopsis, imágenes, géneros, actores y más.`;
        if (!window.confirm(confirmMsg)) return;

        setApplying(result.id);
        setError(null);

        try {
            const mediaType = result.media_type === 'tv' ? 'tv' :
                result.media_type === 'movie' ? 'movie' :
                    (result.title ? 'movie' : 'tv');

            const res = await adminFetch(API_ROUTES.MEDIA_SCANNER.APPLY_TMDB, {
                method: 'POST',
                body: JSON.stringify({
                    contentId,
                    tmdbId: result.id,
                    type: mediaType
                })
            });

            const json = await res.json();
            if (res.ok && json.success) {
                setApplied(true);
                setTimeout(() => {
                    onApplied();
                }, 1000);
            } else {
                setError(json.error || 'Error al aplicar datos de TMDB');
            }
        } catch (err) {
            console.error('Apply TMDB error:', err);
            setError('Error de conexión');
        } finally {
            setApplying(null);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(searchQuery);
    };

    if (applied) {
        return (
            <div style={{
                background: 'rgba(74, 222, 128, .08)',
                border: '1px solid rgba(74, 222, 128, .25)',
                borderRadius: 16,
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#86efac'
            }}>
                <CheckCircle2 size={22} />
                <div>
                    <strong>Datos de TMDB aplicados correctamente</strong>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 2 }}>Recargando información...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'rgba(250, 204, 21, .04)',
            border: '1px solid rgba(250, 204, 21, .15)',
            borderRadius: 16,
            padding: '20px 24px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Search size={18} style={{ color: '#60a5fa' }} />
                <div>
                    <strong style={{ color: '#93c5fd', fontSize: '0.95rem' }}>Búsqueda en TMDB</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginTop: 2 }}>
                        Selecciona una coincidencia para reemplazar y sincronizar los datos de este contenido.
                    </p>
                </div>
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-muted)' }} />
                    <input
                        type="text"
                        className="adm-input"
                        style={{ paddingLeft: 36 }}
                        placeholder="Buscar otro nombre en TMDB..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <button type="submit" className="adm-btn adm-btn--ghost" disabled={loading}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    Buscar
                </button>
            </form>

            {error && (
                <div style={{
                    background: 'rgba(248, 113, 113, .1)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    color: '#fca5a5',
                    fontSize: '0.8rem',
                    marginBottom: 12
                }}>
                    {error}
                </div>
            )}

            {/* Results */}
            {loading && results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--adm-muted)' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.8rem' }}>Buscando en TMDB...</p>
                </div>
            ) : results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--adm-muted)', fontSize: '0.85rem' }}>
                    No se encontraron resultados. Intenta con otro nombre.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {results.map(result => {
                        const displayTitle = result.title || result.name || 'Sin título';
                        const year = (result.release_date || result.first_air_date || '').split('-')[0];
                        const isMovie = result.media_type === 'movie' || !!result.title;
                        const posterUrl = result.poster_path
                            ? `https://image.tmdb.org/t/p/w92${result.poster_path}`
                            : null;
                        const isApplyingThis = applying === result.id;

                        return (
                            <div
                                key={result.id}
                                style={{
                                    display: 'flex',
                                    gap: 12,
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    cursor: isApplyingThis ? 'wait' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    opacity: applying && !isApplyingThis ? 0.4 : 1
                                }}
                                onClick={() => !applying && handleApply(result)}
                                onMouseEnter={e => {
                                    if (!applying) (e.currentTarget.style.background = 'rgba(255,255,255,0.06)');
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget.style.background = 'rgba(255,255,255,0.03)');
                                }}
                            >
                                {/* Poster */}
                                <div style={{
                                    width: 46,
                                    height: 69,
                                    borderRadius: 8,
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    background: 'rgba(255,255,255,0.05)'
                                }}>
                                    {posterUrl ? (
                                        <img src={posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Film size={16} style={{ color: 'var(--adm-muted)', opacity: 0.3 }} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'white' }}>{displayTitle}</span>
                                        {isApplyingThis && <Loader2 size={14} className="animate-spin" />}
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--adm-muted)', alignItems: 'center' }}>
                                        {isMovie ? <Film size={12} /> : <Tv size={12} />}
                                        <span>{isMovie ? 'Película' : 'Serie'}</span>
                                        {year && <><Calendar size={11} /> <span>{year}</span></>}
                                        {result.vote_average ? (
                                            <><Star size={11} style={{ color: '#facc15' }} /> <span>{result.vote_average.toFixed(1)}</span></>
                                        ) : null}
                                    </div>
                                    {result.overview && (
                                        <p style={{
                                            fontSize: '0.7rem',
                                            color: 'var(--adm-muted)',
                                            marginTop: 4,
                                            lineHeight: 1.3,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {result.overview}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
