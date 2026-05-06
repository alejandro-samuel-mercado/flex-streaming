'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ExploreCard from '../../../components/explore/ExploreCard';
import ExploreSidebar from '../../../components/explore/ExploreSidebar';
import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import Link from 'next/link';

function ExploreContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [content, setContent] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [genres, setGenres] = useState([]);
    const [platforms, setPlatforms] = useState([]);
    const [tags, setTags] = useState<any[]>([]);

    // Get filter values from URL
    const page = Number(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || null;
    const genreId = searchParams.get('genreId') || null;
    const platformId = searchParams.get('platformId') || null;
    const tagId = searchParams.get('tagId') || null;
    const quick = searchParams.get('quick') || null;
    const sort = searchParams.get('sort') || 'recent';

    // Helper to update URL
    const updateFilters = (newFilters: any) => {
        const params = new URLSearchParams(searchParams.toString());

        // Reset or set params
        if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
        else params.delete('page');

        if (newFilters.search) params.set('search', newFilters.search);
        else params.delete('search');

        if (newFilters.type) params.set('type', newFilters.type);
        else params.delete('type');

        if (newFilters.genreId) params.set('genreId', newFilters.genreId);
        else params.delete('genreId');

        if (newFilters.platformId) params.set('platformId', newFilters.platformId);
        else params.delete('platformId');

        if (newFilters.tagId) params.set('tagId', newFilters.tagId);
        else params.delete('tagId');

        if (newFilters.quick) params.set('quick', newFilters.quick);
        else params.delete('quick');

        if (newFilters.sort && newFilters.sort !== 'recent') params.set('sort', newFilters.sort);
        else params.delete('sort');

        router.replace(`/explorar?${params.toString()}`, { scroll: false });
    };

    // Fetch Metadata
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const [gRes, pRes, tRes] = await Promise.all([
                    fetch(API_ROUTES.CATEGORIES.GENRES),
                    fetch(API_ROUTES.PLATFORMS.LIST),
                    fetch(API_ROUTES.CATEGORIES.TAGS)
                ]);
                const gJson = await gRes.json();
                const pJson = await pRes.json();
                const tJson = await tRes.json();
                if (gJson.success) setGenres(gJson.data);
                if (pJson.success) setPlatforms(pJson.data);
                if (tJson.success) setTags(tJson.data);
            } catch (err) {
                console.error('Error fetching metadata:', err);
            }
        };
        fetchMetadata();
    }, []);

    // Fetch Content - Listen to all URL primitives
    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            try {
                const queryParams = new URLSearchParams({
                    page: page.toString(),
                    limit: '30',
                    sort,
                    ...(search && { search }),
                    ...(type && { type }),
                    ...(genreId && { genreId }),
                    ...(platformId && { platformId }),
                    ...(tagId && { tagId }),
                    ...(quick === 'free' && { isFree: 'true' }),
                    ...(quick === 'recommended' && { featured: 'true' }),
                    ...(quick === 'premieres' && { minYear: new Date().getFullYear().toString() }),
                    ...(quick === 'latest' && { sort: 'recent' }),
                });

                // If 'latest' is active, override sort parameter
                if (quick === 'latest') {
                    queryParams.set('sort', 'recent');
                }

                const fetchUrl = `${API_ROUTES.CONTENT.LIST}?${queryParams.toString()}`;
                console.log('[Explore] Fetching with params:', Object.fromEntries(queryParams.entries()));
                const res = await fetch(fetchUrl, { cache: 'no-store' });
                const result = await res.json();

                if (result.success) {
                    setContent(result.data);
                    setTotal(result.meta?.total || result.pagination?.total || 0);
                }
            } catch (err) {
                console.error('Error fetching content:', err);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchContent, 200);
        return () => clearTimeout(timeoutId);
    }, [page, search, type, genreId, platformId, tagId, quick, sort]);

    const totalPages = Math.ceil(total / 30);

    return (
        <div className="min-h-screen bg-[#030612] text-white">
            <Navbar />

            <div className="explore-layout">
                <ExploreSidebar
                    genres={genres}
                    platforms={platforms}
                    tags={tags}
                    activeFilters={{ page, search, type, genreId, platformId, tagId, quick, sort }}
                    onFilterChange={updateFilters}
                />

                <main className="explore-main">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-black tracking-tight uppercase italic">
                                Catálogo <span className="text-[var(--color-primary)]">Premium</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
                                {['az'].map((s) => (
                                    <button
                                        key={s}
                                        className={`px-4! py-2! rounded-lg text-xs font-black uppercase transition ${sort === s ? 'bg-[var(--color-primary)] text-black' : 'text-white/40 hover:text-white'}`}
                                        onClick={() => updateFilters({ page, search, type, genreId, platformId, tagId, quick, sort: s })}
                                    >
                                        {s === 'recent' ? 'Recientes' : s === 'popular' ? 'Populares' : 'A-Z'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className={`explore-grid ${loading ? 'opacity-40' : ''}`}>
                        {content.map((item) => (
                            <ExploreCard key={item.id} content={item} />
                        ))}
                    </div>

                    {!loading && content.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-40 gap-4">
                            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                                <ListFilter size={40} />
                            </div>
                            <h2 className="text-xl font-bold">Sin resultados</h2>
                            <p className="text-white/40">Prueba con otros filtros</p>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                className="pagination-btn"
                                disabled={page === 1}
                                onClick={() => updateFilters({ page: page - 1, search, type, genreId, platformId, tagId, quick, sort })}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-bold text-white/40">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                className="pagination-btn"
                                disabled={page === totalPages}
                                onClick={() => updateFilters({ page: page + 1, search, type, genreId, platformId, tagId, quick, sort })}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </main>
            </div>

            <Footer />
        </div>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#030612] flex items-center justify-center">Cargando...</div>}>
            <ExploreContent />
        </Suspense>
    );
}
