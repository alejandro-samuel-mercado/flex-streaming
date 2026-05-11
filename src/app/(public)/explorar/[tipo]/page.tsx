'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ContentCard from '@/components/catalog/ContentCard';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';
import { Loader2, Film, Tv, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

const TIPO_CONFIG: Record<string, { label: string; dbType: string; description: string; icon: React.ReactNode }> = {
    peliculas: {
        label: 'Películas',
        dbType: 'MOVIE',
        description: 'Todo el catálogo cinematográfico de películas disponible en Nuba.',
        icon: <Film className="text-[var(--color-primary)]" size={32} />
    },
    series: {
        label: 'Series',
        dbType: 'SERIES',
        description: 'Las mejores series, temporadas y shows exclusivos en Nuba.',
        icon: <Tv className="text-[var(--color-primary)]" size={32} />
    },
    anime: {
        label: 'Anime',
        dbType: 'ANIME',
        description: 'Disfruta de lo último del anime japonés y contenido de animación premium en Nuba.',
        icon: <Sparkles className="text-[var(--color-primary)]" size={32} />
    },
    documentales: {
        label: 'Documentales',
        dbType: 'DOCUMENTARY',
        description: 'Explora y comprende el mundo real a través de documentales fascinantes.',
        icon: <BookOpen className="text-[var(--color-primary)]" size={32} />
    },
};

export default function ExploreTypePage() {
    const params = useParams();
    const router = useRouter();
    const tipo = params.tipo as string;
    const config = TIPO_CONFIG[tipo];

    const [content, setContent] = useState<any[]>([]);
    const [filteredContent, setFilteredContent] = useState<any[]>([]);
    const [genres, setGenres] = useState<any[]>([]);
    const [selectedGenreId, setSelectedGenreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!config) {
            setError('Categoría no encontrada');
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch Content by type
                const contentRes = await fetch(`${API_ROUTES.CONTENT.LIST}?type=${config.dbType}&limit=100`);
                const contentJson = await contentRes.json();

                // Fetch Genres
                const genresRes = await fetch(API_ROUTES.CATEGORIES.GENRES);
                const genresJson = await genresRes.json();

                if (contentJson.success) {
                    setContent(contentJson.data || []);
                    setFilteredContent(contentJson.data || []);
                } else {
                    throw new Error('No se pudo cargar el contenido');
                }

                if (genresJson.success) {
                    // Filter genres that actually belong to some content in this type if possible, 
                    // or just show all genres.
                    setGenres(genresJson.data || []);
                }
            } catch (err: any) {
                console.error('Error fetching dynamic explore data:', err);
                setError('Ocurrió un error al cargar el catálogo de contenido.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tipo]);

    // Handle Genre Filter Change
    useEffect(() => {
        if (!selectedGenreId) {
            setFilteredContent(content);
        } else {
            const filtered = content.filter((item: any) =>
                item.genres?.some((g: any) => g.genre?.id === selectedGenreId)
            );
            setFilteredContent(filtered);
        }
    }, [selectedGenreId, content]);

    if (!config && !loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-[#02040A] text-white flex flex-col items-center justify-center p-6 text-center">
                    <AlertCircle size={64} className="text-red-500 mb-6" />
                    <h1 className="text-3xl font-bold mb-4">Categoría no encontrada</h1>
                    <p className="text-gray-400 mb-8">La sección "{tipo}" no existe o ha sido removida.</p>
                    <button onClick={() => router.push('/')} className="px-8 py-3 bg-[var(--color-primary)] text-black font-bold rounded-md hover:scale-105 transition">
                        Volver al inicio
                    </button>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="!min-h-screen !bg-[#02040A] !text-white !pt-36 md:!pt-24 !pb-24 !px-4 sm:!px-[6vw]">
                {/* Header Hero Section */}
                <div className="!relative !mb-12 !rounded-[30px] !overflow-hidden !bg-gradient-to-br !from-[#0A0F24] !to-[#02040A] !border !border-white/5 !p-8 md:!p-10
Compressing project files and uploading to EAS Build. Learn more
✔ Compressed project files 1s (456 KB)
✔ Uploaded to EAS 1s
⌛️ Computing the project fingerprint is taking longer than expected...
⏩ To skip this step, set the environment variable: EAS_SKIP_AUTO_FINGERPRINT=1
✔ Computed project fingerprint

See logs: https://expo.dev/accounts/ale181021aa/projects/nuba-streaming/builds/00c8883a-8ab6-4695-a4f8-7100c6a60e0b

Waiting for build to complete. You can press Ctrl+C to exit.
✔ Build finished

🤖 Android app:
https://expo.dev/artifacts/eas/6BoWFTJxo6ahi9DJPJEra.apk

✔ Install and run the Android build on an emulator? … yes


✔ Successfully downloaded app 21s
adb executable doesn't seem to work. Please make sure Android Studio is installed on your device and ANDROID_HOME or ANDROID_SDK_ROOT env variables are set.
spawn adb ENOENT
    Error: build command failed.
 !shadow-2xl">
                    <div className="!absolute !top-0 !right-0 !w-64 !h-64 !bg-[var(--color-primary)] !opacity-5 !blur-[120px] !-mr-32 !-mt-32"></div>

                    <div className="!flex !flex-col md:!flex-row !items-center md:!items-start !gap-6 !relative !z-10">
                        <div className="!w-16 !h-16 !rounded-2xl !bg-white/5 !border !border-white/10 !flex !items-center !justify-center !shadow-lg !flex-shrink-0">
                            {config?.icon}
                        </div>
                        <div className="!flex-1 !text-center md:!text-left">
                            <h1 className="!text-4xl md:!text-5xl !font-black !uppercase !tracking-tight !mb-3" style={{ fontFamily: 'var(--font-display)' }}>
                                {config?.label}
                            </h1>
                            <p className="!text-gray-400 !text-base md:!text-lg !max-w-3xl !leading-relaxed">
                                {config?.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dynamic Filters Bar */}
                {!loading && genres.length > 0 && (
                    <div className="!mb-10 !flex !flex-col !gap-4">
                        <h3 className="!text-xs !font-black !uppercase !tracking-widest !text-[var(--color-primary)] !opacity-80">
                            Filtrar por género
                        </h3>
                        <div className="!flex !gap-2 !overflow-x-auto !hide-scrollbar !pb-3 !-mx-4 !px-4 sm:!mx-0 sm:!px-0">
                            <button
                                onClick={() => setSelectedGenreId(null)}
                                className={`!px-4 !py-2.5 !rounded-full !text-xs !font-black !uppercase !tracking-widest !border !transition-all !duration-300 !flex-shrink-0
                  ${!selectedGenreId
                                        ? '!bg-[var(--color-primary)] !border-[var(--color-primary)] !text-black !shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                                        : '!bg-white/5 !border-white/5 !text-gray-400 hover:!bg-white/10 hover:!text-white'
                                    }`}
                            >
                                Todos
                            </button>
                            {genres.map((g) => (
                                <button
                                    key={g.id}
                                    onClick={() => setSelectedGenreId(g.id)}
                                    className={`!px-4 !py-2.5 !rounded-full !text-xs !font-black !uppercase !tracking-widest !border !transition-all !duration-300 !flex-shrink-0
                    ${selectedGenreId === g.id
                                            ? '!bg-[var(--color-primary)] !border-[var(--color-primary)] !text-black !shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                                            : '!bg-white/5 !border-white/5 !text-gray-400 hover:!bg-white/10 hover:!text-white'
                                        }`}
                                >
                                    {g.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Content Section */}
                {loading ? (
                    <div className="!flex !flex-col !items-center !justify-center !py-40">
                        <Loader2 className="!animate-spin !text-[var(--color-primary)] !mb-4" size={48} />
                        <p className="!text-gray-400 !font-medium">Buscando en la base de datos...</p>
                    </div>
                ) : filteredContent.length > 0 ? (
                    <div className="!grid !grid-cols-2 sm:!grid-cols-3 md:!grid-cols-4 lg:!grid-cols-5 xl:!grid-cols-6 !gap-x-4 !gap-y-10">
                        {filteredContent.map((item) => {
                            const poster = resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);
                            const backdrop = resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url);
                            const genreNames = item.genres?.map((g: any) => g.genre?.name).filter(Boolean) || [];

                            return (
                                <div key={item.id} className="!aspect-[2/3]">
                                    <ContentCard
                                        id={item.id}
                                        title={item.translations?.[0]?.title || item.slug || ''}
                                        imageUrl={poster || backdrop || 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=800&auto=format&fit=crop'}
                                        rating={item.rating}
                                        year={item.releaseYear}
                                        type={item.type}
                                        duration={item.duration}
                                        genres={genreNames}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="!flex !flex-col !items-center !justify-center !py-32 !text-gray-400 !border !border-white/5 !rounded-3xl !bg-white/[0.01] !backdrop-blur-md !px-6 !text-center">
                        <h2 className="!text-xl !font-bold !text-white !mb-2">No hay títulos disponibles</h2>
                        <p className="!max-w-md">No se encontró contenido para esta selección en este momento. Intenta cambiar de género.</p>
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
