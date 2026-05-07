'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import HeroCarousel from '@/components/catalog/HeroBanner';
import PlatformMarquee from '@/components/catalog/PlatformMarquee';
import FilmRow from '@/components/catalog/FilmRow';
import PlanCards from '@/components/catalog/PlanCards';
import CollageSection from '@/components/catalog/CollageSection';
import FAQSection from '@/components/catalog/FAQSection';
import Footer from '@/components/layout/Footer';
import ParticlesBackground from '@/components/layout/ParticlesBackground';
import { API_ROUTES, API_ORIGIN, resolveImageUrl } from '@/lib/api-routes';

// ─── Mock data for when DB is empty ──────────────────────────────────────────
const MOCK_FILMS = [
    { id: 'm1', title: 'Oppenheimer', description: 'La historia del padre de la bomba atómica y cómo su invento cambió el mundo para siempre.', backdropUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop', posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600', rating: 8.5, year: 2023, duration: 180, type: 'MOVIE', genres: ['Drama', 'Historia'] },
    { id: 'm2', title: 'Dune: Parte Dos', description: 'Paul Atreides se une a los Fremen en un viaje espiritual y político mientras lucha por vengar la traición a su familia.', backdropUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=2070&auto=format&fit=crop', posterUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=600', rating: 8.8, year: 2024, duration: 166, type: 'MOVIE', genres: ['Ciencia Ficción', 'Aventura'] },
    { id: 'm3', title: 'The Last of Us', description: 'En un mundo post-apocalíptico, un contrabandista endurecido debe escoltar a una adolescente a través de un Estados Unidos devastado.', backdropUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2070&auto=format&fit=crop', posterUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=600', rating: 9.0, year: 2023, duration: null, type: 'SERIES', genres: ['Drama', 'Acción'] },
    { id: 'm4', title: 'Spider-Man: Across the Spider-Verse', description: 'Miles Morales regresa para la siguiente aventura del multiverso, enfrentándose a un nuevo equipo de Spider-People.', backdropUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=2070&auto=format&fit=crop', posterUrl: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600', rating: 8.7, year: 2023, duration: 140, type: 'MOVIE', genres: ['Animación', 'Acción'] },
    { id: 'm5', title: 'Succession', description: 'La familia Roy, dueña del conglomerado mediático y de entretenimiento más grande del mundo, lucha por el control.', backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2070&auto=format&fit=crop', posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600', rating: 8.9, year: 2023, duration: null, type: 'SERIES', genres: ['Drama'] },
    { id: 'm6', title: 'Killers of the Flower Moon', description: 'La historia real de una serie de asesinatos en la nación Osage en la década de 1920, dirigida por Martin Scorsese.', backdropUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070&auto=format&fit=crop', posterUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=600', rating: 7.8, year: 2023, duration: 206, type: 'MOVIE', genres: ['Drama', 'Crimen'] },
    { id: 'm7', title: 'Attack on Titan: The Final Season', description: 'La batalla final por la humanidad llega a su épica conclusión mientras Eren desata su poder definitivo.', backdropUrl: 'https://images.unsplash.com/photo-1607604276583-c1d87e93f9e0?q=80&w=2070&auto=format&fit=crop', posterUrl: 'https://images.unsplash.com/photo-1607604276583-c1d87e93f9e0?q=80&w=600', rating: 9.1, year: 2024, duration: null, type: 'ANIME', genres: ['Acción', 'Drama'] },
    { id: 'm8', title: 'Poor Things', description: 'La increíble historia de Bella Baxter, una mujer joven traída de vuelta a la vida por un científico brillante.', backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop', posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600', rating: 8.3, year: 2024, duration: 141, type: 'MOVIE', genres: ['Comedia', 'Drama'] },
];

const MOCK_PLATFORMS = [
    { id: 'p1', name: 'Netflix', slug: 'netflix', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg', contents: [] },
    { id: 'p2', name: 'HBO Max', slug: 'hbo-max', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg', contents: [] },
    { id: 'p3', name: 'Disney+', slug: 'disney-plus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg', contents: [] },
    { id: 'p4', name: 'Prime Video', slug: 'prime-video', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg', contents: [] },
    { id: 'p5', name: 'Paramount+', slug: 'paramount-plus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Paramount_Plus.svg', contents: [] },
    { id: 'p6', name: 'Apple TV+', slug: 'apple-tv', logoUrl: null, contents: [] },
    { id: 'p7', name: 'Crunchyroll', slug: 'crunchyroll', logoUrl: null, contents: [] },
    { id: 'p8', name: 'Star+', slug: 'star-plus', logoUrl: null, contents: [] },
];

const MOCK_GENRES = [
    { id: 'g1', name: 'Acción', slug: 'accion' },
    { id: 'g2', name: 'Comedia', slug: 'comedia' },
    { id: 'g3', name: 'Drama', slug: 'drama' },
    { id: 'g4', name: 'Terror', slug: 'terror' },
    { id: 'g5', name: 'Ciencia Ficción', slug: 'ciencia-ficcion' },
    { id: 'g6', name: 'Romance', slug: 'romance' },
    { id: 'g7', name: 'Animación', slug: 'animacion' },
    { id: 'g8', name: 'Suspenso', slug: 'suspenso' },
];

const MOCK_CONTENT_TYPES = [
    { type: 'MOVIE', count: 245 },
    { type: 'SERIES', count: 89 },
    { type: 'ANIME', count: 56 },
    { type: 'DOCUMENTARY', count: 34 },
    { type: 'NOVELA', count: 12 },
];

const MOCK_PLANS = [
    { id: 'plan1', name: 'Básico', description: 'Perfecto para empezar', price: '4.99', durationDays: 30, maxDevices: 1, hasHd: true, has4k: false, allowDownload: false, noAds: false },
    { id: 'plan2', name: 'Premium', description: 'La mejor experiencia', price: '9.99', durationDays: 30, maxDevices: 3, hasHd: true, has4k: true, allowDownload: true, noAds: true },
    { id: 'plan3', name: 'Familiar', description: 'Para toda la familia', price: '14.99', durationDays: 30, maxDevices: 5, hasHd: true, has4k: true, allowDownload: true, noAds: true },
];

const MOCK_FAQ = [
    { question: '¿Cómo puedo suscribirme a FlexStreaming?', answer: 'Puedes elegir el plan que más te convenga en la sección de planes y contactarnos por WhatsApp. Te crearemos una cuenta y podrás empezar a disfrutar de todo el contenido.' },
    { question: '¿Qué métodos de pago aceptan?', answer: 'Aceptamos transferencias bancarias, Mercado Pago, PayPal y pagos en efectivo. Contáctanos por WhatsApp para más detalles.' },
    { question: '¿Puedo ver contenido gratis?', answer: 'Sí, tenemos una selección de contenido gratuito disponible para todos. Solo necesitas crear una cuenta gratuita para empezar a disfrutarlo.' },
    { question: '¿En cuántos dispositivos puedo ver?', answer: 'Depende del plan que elijas. El plan Básico permite 1 dispositivo, el Premium hasta 3 y el Familiar hasta 5 dispositivos simultáneos.' },
    { question: '¿Puedo cancelar mi suscripción en cualquier momento?', answer: 'Sí, puedes cancelar tu suscripción cuando lo desees sin penalizaciones. Tu acceso continuará hasta el final del período pagado.' },
    { question: '¿El contenido tiene subtítulos?', answer: 'Sí, la gran mayoría de nuestro contenido cuenta con subtítulos en español y otros idiomas. Además, muchos títulos están disponibles en audio latino.' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface HomepageData {
    featured: any[];
    trending: any[];
    recent: any[];
    freeContent: any[];
    platforms: any[];
    genres: any[];
    contentTypes: { type: string; count: number }[];
    plans: any[];
    faq: { question: string; answer: string }[];
    config: Record<string, string>;
}

const DEMO_BACKDROP = 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2574&auto=format&fit=crop';

function mapContentToFilm(c: any) {
    const title = c.translations?.[0]?.title || c.slug || 'Sin título';
    const desc = c.translations?.[0]?.description || '';

    const poster = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
    const backdrop = resolveImageUrl(c.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url);
    const genreNames = c.genres?.map((g: any) => g.genre?.name).filter(Boolean) || [];

    return {
        id: c.id,
        title,
        description: desc,
        posterUrl: poster || backdrop || null,
        backdropUrl: backdrop || poster || null,
        rating: c.rating,
        year: c.releaseYear,
        duration: c.duration,
        type: c.type,
        genres: genreNames,
        ageRating: c.ageRating?.code,
    };
}

export default function HomePage() {
    const [data, setData] = useState<HomepageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [useMock, setUseMock] = useState(false);

    // Auth state and Continue Watching
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [continueWatching, setContinueWatching] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const profileId = localStorage.getItem('currentProfileId');

        if (token && profileId) {
            setIsLoggedIn(true);

            // Sync Favorites
            const localFavorites = JSON.parse(localStorage.getItem('localFavorites') || '[]');
            if (localFavorites.length > 0) {
                fetch(`${API_ROUTES.FAVORITES.BASE}/sync`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-Profile-Id': profileId
                    },
                    body: JSON.stringify({ contentIds: localFavorites })
                }).then(res => res.json()).then(resJson => {
                    if (resJson.success) {
                        localStorage.removeItem('localFavorites');
                    }
                }).catch(console.error);
            }

            // Fetch Continue Watching
            fetch(`${API_ROUTES.HISTORY.BASE}/continue`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Profile-Id': profileId
                }
            })
                .then(res => res.json())
                .then(resJson => {
                    if (resJson.success && resJson.data) {
                        setContinueWatching(resJson.data.map((h: any) => {
                            const film = mapContentToFilm(h.content);
                            return {
                                ...film,
                                episodeId: h.episodeId,
                                progress: h.progress,
                                duration: h.duration,
                                // Enlace directo al reproductor para "Continuar viendo"
                                customLink: `/watch/${film.id}${h.episodeId ? `?episodeId=${h.episodeId}` : ''}`
                            };
                        }));
                    }
                })
                .catch(console.error);
        }

        fetch(API_ROUTES.HOMEPAGE.DATA, { cache: 'no-store' })
            .then(r => r.json())
            .then(res => {
                if (res.success && res.data) {
                    const d = res.data;
                    // If DB is empty, use mocks
                    const hasContent = (d.featured?.length > 0) || (d.trending?.length > 0) || (d.recent?.length > 0);
                    if (!hasContent) {
                        setUseMock(true);
                    } else {
                        setData(d);
                    }
                } else {
                    setUseMock(true);
                }
                setLoading(false);
            })
            .catch(() => {
                setUseMock(true);
                setLoading(false);
            });
    }, []);

    // Decide data source
    const featured = useMock ? MOCK_FILMS.slice(0, 5) : (data?.featured || []).map(mapContentToFilm);
    const trending = useMock ? MOCK_FILMS : (data?.trending || []).map(mapContentToFilm);
    const recent = useMock ? [...MOCK_FILMS].reverse() : (data?.recent || []).map(mapContentToFilm);
    const freeContent = useMock ? MOCK_FILMS.slice(2, 7) : (data?.freeContent || []).map(mapContentToFilm);
    const platforms = useMock ? MOCK_PLATFORMS : (data?.platforms || []);
    const genres = useMock ? MOCK_GENRES : (data?.genres || []);
    const contentTypes = useMock ? MOCK_CONTENT_TYPES : (data?.contentTypes || []);
    const plans = useMock ? MOCK_PLANS : (data?.plans || []);
    const faq = useMock ? MOCK_FAQ : (data?.faq || []);
    const config = data?.config || {};
    const whatsappNumber = config['whatsapp_number'] || '';

    // Hero slides
    const heroSlides = featured.map((f: any) => ({
        id: f.id,
        title: f.title,
        description: f.description || '',
        backdropUrl: f.backdropUrl || f.posterUrl || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2574&auto=format&fit=crop',
        rating: f.rating,
        year: f.year,
        duration: f.duration,
        ageRating: f.ageRating,
        type: f.type,
        genres: f.genres,
    }));

    // Collage items - Deduplicate by ID
    const combinedItems = [...trending, ...recent];
    const uniqueItemsMap = new Map();
    combinedItems.forEach(item => {
        if (!uniqueItemsMap.has(item.id)) {
            uniqueItemsMap.set(item.id, item);
        }
    });

    const allItems = Array.from(uniqueItemsMap.values()).slice(0, 12).map((f: any) => ({
        id: f.id,
        posterUrl: f.posterUrl || f.backdropUrl,
        title: f.title,
    }));

    // Random backdrop for footer
    const footerBackdrop = trending[Math.floor(Math.random() * Math.max(trending.length, 1))]?.backdropUrl || undefined;

    // For now, assume hasPlan is false unless implemented later
    const hasPlan = false;

    if (loading) {
        return (
            <div className="cinematic-loader-container">
                <ParticlesBackground />
                <div className="cinematic-loader-content">
                    <div className="cinematic-loader-logo">
                        <span style={{ color: 'var(--color-primary)' }}>FLEX</span>STREAMING
                    </div>
                    <div className="cinematic-loader-spinner" />
                    <p className="cinematic-loader-text">Preparando tu experiencia cinematográfica...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar
                contentTypes={contentTypes}
                platforms={platforms.map((p: any) => ({ id: p.id, name: p.name, slug: p.slug, logoUrl: p.logoUrl }))}
                genres={genres}
            />


            <main className="homepage-main">
                <ParticlesBackground />

                {/* 1. Hero Carousel with Particles */}
                <HeroCarousel slides={heroSlides} />

                {/* 2. Platform Marquee */}
                <PlatformMarquee platforms={platforms} />

                {/* 2.5 Continue Watching */}
                {continueWatching.length > 0 && (
                    <FilmRow
                        title="⏱️ Continuar viendo"
                        subtitle="Retoma donde lo dejaste"
                        items={continueWatching}
                        variant="large"
                        accentColor="#FF6B00"
                    />
                )}

                {/* 3. Trending */}
                <FilmRow
                    title="En Tendencia"
                    subtitle="Lo más visto en este momento"
                    items={trending}
                    variant="large"
                    accentColor="#FF6B00"
                    exploreUrl="/explorar?sort=popular"
                />

                {/* 4. Recent / New Releases */}
                <FilmRow
                    title="Estrenos"
                    subtitle="Recién llegados al catálogo"
                    items={recent}
                    variant="large"
                    accentColor="#00D4FF"
                    exploreUrl="/explorar?sort=recent"
                />

                {/* 5. Free Content (if user has no plan) */}
                {!hasPlan && freeContent.length > 0 && (
                    <FilmRow
                        title="Contenido Gratis"
                        subtitle="Disfruta sin necesidad de suscripción"
                        items={freeContent}
                        variant="large"
                        accentColor="#46d369"
                        exploreUrl="/explorar?quick=free"
                    />
                )}

                {/* 6. Plans */}
                {!hasPlan && plans.length > 0 && (
                    <PlanCards plans={plans} whatsappNumber={whatsappNumber} />
                )}

                {/* 7. Collage CTA */}
                <CollageSection items={allItems} isLoggedIn={isLoggedIn} hasPlan={hasPlan} />

                {/* 8. FAQ */}
                {faq.length > 0 && <FAQSection items={faq} />}
            </main>

            {/* 9. Footer */}
            <Footer backdropUrl={footerBackdrop} />
        </>
    );
}
