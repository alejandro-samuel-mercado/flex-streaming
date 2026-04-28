'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HeroBanner from '@/components/catalog/HeroBanner';
import ContentRow from '@/components/catalog/ContentRow';
import { API_ROUTES } from '@/lib/api-routes';

// Placeholder catalog — will be replaced when API is connected
const PLACEHOLDER_BACKDROP = 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2574&auto=format&fit=crop';

interface ContentItem {
    id: string;
    type: string;
    status: string;
    viewCount: number;
    rating: number | null;
    createdAt: string;
    translations?: { title: string, description: string }[];
}

interface PlatformItem {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
}

export default function HomePage() {
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [platforms, setPlatforms] = useState<PlatformItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/content` : 'http://localhost:4000/api/content').then(r => r.json()),
            fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/platforms` : 'http://localhost:4000/api/platforms').then(r => r.json())
        ])
            .then(([contentData, platformData]) => {
                setContents(contentData.data || []);

                // MagisTV placeholder mock just for preview if DB is empty:
                setPlatforms(platformData.data?.length > 0 ? platformData.data : [
                    { id: '1', name: 'Netflix', slug: 'netflix', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
                    { id: '2', name: 'HBO Max', slug: 'hbo-max', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg' },
                    { id: '3', name: 'Disney+', slug: 'disney-plus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
                    { id: '4', name: 'Prime Video', slug: 'prime-video', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg' },
                ]);

                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const heroItem = contents[0];

    return (
        <main className='px-5'>
            {/* Hero Section */}
            {loading ? (
                <div className="h-[80vh] w-full flex items-center justify-center text-white bg-black/50 px-5">Cargando catálogo premium...</div>
            ) : contents.length === 0 ? (
                <div className="h-[80vh] w-full flex items-center justify-center text-center text-white bg-black/50 px-5">
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Catálogo Vacío</h2>
                        <p className="text-[var(--color-text-muted)]">Ve al Panel de Administrador e inicia una subida de videos para arrancar.</p>
                    </div>
                </div>
            ) : (
                <>
                    <HeroBanner
                        id={heroItem?.id}
                        title={heroItem?.translations?.[0]?.title || 'Nuevo Contenido'}
                        description={heroItem?.translations?.[0]?.description || 'Una experiencia cinemática épica disponible en múltiples calidades con HLS.'}
                        backdropUrl={PLACEHOLDER_BACKDROP}
                        match={`${Math.floor(Math.random() * 15 + 85)}%`} // Simulated match score
                        year={new Date(heroItem?.createdAt || Date.now()).getFullYear().toString()}
                        ageRating="16+"
                        duration="1h 45min"
                        quality="HD"
                        type={heroItem?.type === 'MOVIE' ? 'Película' : 'Serie'}
                    />

                    {/* Content Rows */}
                    <div className="relative z-10 -mt-24 pb-20 space-y-12 ">

                        {/* PLATFORM TILES (MAGISTV STYLE) */}
                        <div className="px-[var(--page-padding)] mb-8">
                            <h2 className="text-xl font-bold mb-4">Explorar por Plataforma</h2>
                            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -ml-2 pl-2">
                                {platforms.map(p => (
                                    <Link
                                        key={p.id}
                                        href={`/plataforma/${p.slug}`}
                                        className="flex-shrink-0 w-48 h-28 bg-gradient-to-br from-[var(--color-surface)] to-[#111] border border-[var(--color-border)] rounded-xl flex items-center justify-center p-6 hover:scale-105 hover:border-[var(--color-primary)] transition-all shadow-lg hover:shadow-[var(--color-primary-glow)]"
                                    >
                                        {p.logoUrl ? (
                                            <img src={p.logoUrl} alt={p.name} className="max-w-full max-h-full object-contain filter drop-shadow-md" />
                                        ) : (
                                            <span className="font-bold text-lg">{p.name}</span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <ContentRow title="Añadidos Recientemente" items={contents.map(c => ({
                            id: c.id,
                            title: c.translations?.[0]?.title || 'Contenido',
                            imageUrl: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=800&auto=format&fit=crop',
                            match: '98%',
                            year: new Date(c.createdAt).getFullYear(),
                            quality: 'HD',
                            type: c.type
                        }))} />
                    </div>
                </>
            )
            }
        </main >
    );
}
