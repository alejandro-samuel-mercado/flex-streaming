'use client';

import SeriviaGrid from '@/components/catalog/SeriviaGrid';
import PublicLayout from '@/components/layout/PublicLayout';
import CustomSelect from '@/components/ui/CustomSelect';
import { API_ROUTES } from '@/lib/api-routes';
import { CONTENT_TYPES_LIST, getContentTypeIcon, getContentTypeLabel } from '@/lib/content-types';
import { Globe, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';

function ExploreContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [content, setContent] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    const [genres, setGenres] = useState<any[]>([]);
    const [platforms, setPlatforms] = useState<any[]>([]);

    // URL parameters
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || null;
    const genreId = searchParams.get('genreId') || null;
    const sortParam = searchParams.get('sort') || null;
    const quick = searchParams.get('quick') || null;

    const observerTarget = useRef<HTMLDivElement>(null);

    // Filter update helper
    const updateFilters = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) params.set(key, value);
        else params.delete(key);
        
        // Reset state on filter change
        setContent([]);
        setPage(1);
        setHasMore(true);
        setLoading(true);
        router.replace(`/explorar?${params.toString()}`, { scroll: false });
    };

    // Metadata fetch
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [gRes] = await Promise.all([
                    fetch(API_ROUTES.CATEGORIES.GENRES)
                ]);
                const gJson = await gRes.json();
                if (gJson.success) setGenres(gJson.data);
            } catch (err) {
                console.error('Error fetching metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    // Content fetch effect based on filters AND page
    const fetchContent = useCallback(async (currentPage: number, isNewFilter: boolean) => {
        try {
            if (isNewFilter) setLoading(true);
            else setLoadingMore(true);

            const queryParams = new URLSearchParams({
                page: currentPage.toString(),
                limit: '30',
                ...(search && { search }),
                ...(type && { type }),
                ...(genreId && { genreId }),
                ...(quick === 'recommended' && { featured: 'true' }),
                ...(quick === 'premieres' && { minYear: new Date().getFullYear().toString() }),
            });

            if (sortParam) {
                queryParams.set('sort', sortParam);
            } else if (quick === 'trending') {
                queryParams.set('sort', 'popular');
            } else if (!quick || quick === 'latest') {
                queryParams.set('sort', 'recent');
            }

            const res = await fetch(`${API_ROUTES.CONTENT.LIST}?${queryParams.toString()}`);
            const result = await res.json();

            if (result.success) {
                let newItems = [];
                if (Array.isArray(result.data)) {
                    newItems = result.data;
                } else if (result.data && Array.isArray(result.data.items)) {
                    newItems = result.data.items;
                } else if (result.data && Array.isArray(result.data.content)) {
                    newItems = result.data.content;
                }

                setContent(prev => isNewFilter ? newItems : [...prev, ...newItems]);
                
                const totalItems = result.meta?.total || result.pagination?.total || 0;
                const currentTotal = isNewFilter ? newItems.length : content.length + newItems.length;
                setHasMore(currentTotal < totalItems && newItems.length > 0);
            }
        } catch (err) {
            console.error('Error fetching content:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [search, type, genreId, sortParam, quick, content.length]);

    // Initial load and filter change trigger
    useEffect(() => {
        fetchContent(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, type, genreId, sortParam, quick]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    fetchContent(nextPage, false);
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, loading, loadingMore, page, fetchContent]);

    return (
        <PublicLayout>
            <div className="flex-1 min-h-screen text-[var(--text-main)] flex flex-col pb-24">
                
                {/* Filters Bar */}
                <div className="w-full border-b border-[var(--border-subtle)] py-4 px-4 sm:px-[2vw]">
                    <div className="flex flex-col gap-4 w-full mx-auto">
                        
                        {/* Types & Platforms Row */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-50">
                            
                            {/* Content Types */}
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest hidden xl:block">Tipo:</span>
                                <div className="w-48 lg:w-56">
                                    <CustomSelect 
                                        options={[
                                            { id: '', name: 'Todos los tipos' },
                                            ...CONTENT_TYPES_LIST.map(t => ({
                                                id: t,
                                                name: getContentTypeLabel(t),
                                            }))
                                        ]}
                                        value={type || ''}
                                        onChange={(val) => updateFilters('type', val ? String(val) : null)}
                                        placeholder="Todos los tipos"
                                    />
                                </div>
                            </div>

                            {/* Sort Select */}
                            <div className="flex items-center gap-3 pt-1 pb-1">
                                <span className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest hidden md:block mr-2">Ordenar:</span>
                                <div className="w-48 lg:w-56">
                                    <CustomSelect 
                                        options={[
                                            { id: 'recent', name: 'Últimos agregados' },
                                            { id: 'popular', name: 'Populares' },
                                            { id: 'rating', name: 'Mejor Valorados' },
                                            { id: 'az', name: 'Alfabético (A-Z)' },
                                            { id: 'za', name: 'Alfabético (Z-A)' },
                                            { id: 'releaseYear', name: 'Año Lanzamiento' },
                                        ]}
                                        value={sortParam || (quick === 'trending' ? 'popular' : 'recent')}
                                        onChange={(val) => updateFilters('sort', String(val))}
                                        placeholder="Ordenar por..."
                                    />
                                </div>
                            </div>
                        </div>


                        {/* Genres Row (Wrapped) */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
                            <button onClick={() => updateFilters('genreId', null)} className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${!genreId ? 'bg-[var(--color-primary)] text-black border-transparent shadow-[0_0_15px_rgba(255,179,0,0.3)]' : 'bg-[var(--bg-panel)] text-[var(--text-main)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'}`}>
                                Todos los géneros
                            </button>
                            {genres.map(g => (
                                <button key={g.id} onClick={() => updateFilters('genreId', g.id)} className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${genreId === g.id ? 'bg-[var(--color-primary)] text-black border-transparent shadow-[0_0_15px_rgba(255,179,0,0.3)]' : 'bg-[var(--bg-panel)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-main)] hover:border-[var(--text-main)]'}`}>
                                    {g.name}
                                </button>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Grid Area */}
                <main className="flex-1 w-full mx-auto px-4 sm:px-[2vw] mt-8">
                    {loading && content.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-[var(--text-faint)]">
                            <Loader2 size={48} className="animate-spin text-[var(--color-primary)] mb-4" />
                            <p className="text-xl font-bold uppercase tracking-widest">Cargando catálogo...</p>
                        </div>
                    ) : content.length === 0 && !loading ? (
                        <div className="text-center py-32 text-[var(--text-faint)]">
                            <Globe size={64} className="mx-auto mb-6 opacity-30" />
                            <h2 className="text-3xl font-black mb-2 text-[var(--text-main)]">Sin resultados</h2>
                            <p className="text-xl">Intenta ajustar tus filtros para descubrir más contenido.</p>
                            <button onClick={() => router.push('/explorar')} className="mt-8 px-8 py-3 bg-[var(--text-main)] text-[var(--bg-main)] font-bold rounded-full hover:scale-105 transition">Limpiar filtros</button>
                        </div>
                    ) : (
                        <>
                            <SeriviaGrid items={content} />
                            
                            {/* Infinite Scroll Trigger */}
                            <div ref={observerTarget} className="w-full h-24 flex items-center justify-center mt-12">
                                {loadingMore && (
                                    <div className="flex items-center gap-3 text-[var(--color-primary)]">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="font-bold text-sm tracking-widest uppercase">Cargando más...</span>
                                    </div>
                                )}
                                {!hasMore && content.length > 0 && (
                                    <p className="text-[var(--text-faint)] font-bold text-sm uppercase tracking-widest">Has llegado al final del catálogo</p>
                                )}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </PublicLayout>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" size={48} /></div>}>
            <ExploreContent />
        </Suspense>
    );
}
