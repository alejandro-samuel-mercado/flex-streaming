'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { resolveImageUrl } from '@/lib/api-routes';

interface SeriviaGridProps {
    items: any[];
}

export default function SeriviaGrid({ items }: SeriviaGridProps) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return (
            <div className="py-20 text-center text-[var(--text-faint)]">
                No hay resultados disponibles.
            </div>
        );
    }

    return (
        <div className="serivia-grid">
            {items.map(item => {
                const title = item.title || item.translations?.[0]?.title || item.slug || 'Sin título';
                const posterUrl = item.posterUrl || item.thumbnails?.find((t: any) => t.type === 'POSTER')?.url || 
                                  item.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url;
                
                // Fallback image if real one is missing
                const resolvedImage = posterUrl 
                    ? resolveImageUrl(posterUrl)
                    : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=600';

                return (
                    <Link href={`/film/${item.id}`} key={item.id} className="block group" style={{ textDecoration: 'none' }}>
                        <div className="serivia-poster">
                            <img src={resolvedImage} alt={title} />
                        </div>
                        <div className="serivia-poster-info">
                            <h3 className="serivia-poster-title">{title}</h3>
                            <div className="serivia-poster-meta">
                                <span>{item.releaseYear || '2024'}</span>
                                <span className="flex items-center gap-1 text-[var(--color-primary)] font-bold">
                                    <Star size={12} fill="currentColor" />
                                    {item.rating ? item.rating.toFixed(1) : '8.5'}
                                </span>
                            </div>
                        </div>
                    </Link>
                );
            })}
        </div>
    );
}
