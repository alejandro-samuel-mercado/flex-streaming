'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Loader2 } from 'lucide-react';
import { API_ROUTES, API_ORIGIN, resolveImageUrl } from '@/lib/api-routes';

export default function FavoritosPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');
            if (!accessToken || !profileId) {
                // If not logged in, fetch from localStorage
                const localFavorites = JSON.parse(localStorage.getItem('localFavorites') || '[]');
                if (localFavorites.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch all specific content details for local favorites
                try {
                    const fetchedDetails = await Promise.all(localFavorites.map(async (id: string) => {
                        const res = await fetch(`${API_ROUTES.CONTENT.BASE}/${id}`);
                        const resJson = await res.json();
                        return resJson.data;
                    }));
                    setFavorites(fetchedDetails.filter(Boolean));
                } catch (e) { }

                setLoading(false);
                return;
            }

            try {
                const res = await fetch(API_ROUTES.FAVORITES.BASE, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Profile-Id': profileId
                    }
                });
                const resJson = await res.json();
                if (resJson.success && resJson.data) {
                    setFavorites(resJson.data.data || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchFavorites();
    }, []);

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#0A0A0F] text-white pb-16 relative">
                <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/10 via-[#0A0A0F]/80 to-[#0A0A0F] pointer-events-none" />

                <div className="relative !pt-24 max-w-[1600px] mx-auto w-full !px-4 sm:!px-[6vw] !pb-[20vh]">
                    <div className="!mb-8 md:!mb-12">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                            Mis Favoritos
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm max-w-lg">
                            Tus títulos guardados para ver más tarde.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center !py-32">
                            <Loader2 className="animate-spin text-[var(--color-primary)]" size={48} />
                        </div>
                    ) : favorites.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
                            {favorites.map((c) => {
                                const poster = c.thumbnails?.find((t: any) => t.type === 'POSTER')?.url || '';

                                return (
                                    <Link href={`/film/${c.id}`} key={c.id} className="block group origin-center transition-transform hover:scale-105 hover:z-10 duration-300 relative">
                                        <div className="relative aspect-[2/3] w-full bg-[#141414] rounded-lg overflow-hidden shadow-xl border border-white/5 group-hover:border-[var(--color-primary)] transition-colors">
                                            <img
                                                src={resolveImageUrl(poster)}
                                                alt={c.translations?.[0]?.title}
                                                className="w-full h-full object-cover group-hover:brightness-110 transition"
                                            />
                                        </div>
                                        <div className="mt-3 flex flex-col !gap-1 !px-1">
                                            <h3 className="font-bold text-sm text-gray-300 line-clamp-1 group-hover:text-white transition-colors">{c.translations?.[0]?.title}</h3>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center !py-32 text-gray-400 border border-gray-800/50 rounded-lg bg-black/20 backdrop-blur-md">
                            <h2 className="text-xl font-medium text-white !mb-2">Aún no agregaste títulos.</h2>
                            <p>Añade películas y series a tu lista para encontrarlas fácilmente después.</p>
                            <Link href="/explorar" className="mt-6 bg-[var(--color-primary)] text-black !px-6 !py-2 rounded font-bold hover:scale-105 transition">
                                Descubrir contenido
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
