'use client';
import { userFetch } from '@/lib/api-client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import SeriviaGrid from '@/components/catalog/SeriviaGrid';
import { Loader2 } from 'lucide-react';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';

export default function FavoritosPage() {
    const [favorites, setFavorites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFavorites = async () => {
            const accessToken = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');
            if (!accessToken || !profileId) {
                // If not logged in, fetch from localStorage
                const localFavorites = JSON.parse(localStorage.getItem('local_favorites') || '[]');
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
                const res = await userFetch(API_ROUTES.FAVORITES.BASE, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'X-Profile-Id': profileId
                    }
                });
                const resJson = await res.json();
                if (resJson.success && resJson.data) {
                    setFavorites(resJson.data || []);
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
        <PublicLayout>
            <div className="flex-1 bg-[var(--bg-main)] text-white pb-16 relative w-full !px-4 sm:!px-[6vw] pt-12">
                <div className="relative max-w-[1600px] mx-auto w-full">
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
                        <div className="mt-8">
                            <SeriviaGrid items={favorites} />
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
        </PublicLayout>
    );
}
