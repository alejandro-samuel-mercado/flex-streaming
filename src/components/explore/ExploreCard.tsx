'use client';

import Link from 'next/link';
import { Play, Star, Clock, Info } from 'lucide-react';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';
import { getContentTypeLabel } from '@/lib/content-types';

interface ExploreCardProps {
    content: any;
}

export default function ExploreCard({ content }: ExploreCardProps) {
    const title = content.translations[0]?.title || 'Sin título';
    const year = content.releaseYear;
    const rating = content.rating;
    const duration = content.duration;
    const type = content.type;
    const genres = content.genres?.map((g: any) => g.genre?.name).filter(Boolean) || [];
    const platform = content.platform;

    const imageUrl = resolveImageUrl(content.thumbnails?.find((t: any) => t.type === 'POSTER')?.url || content.thumbnails?.[0]?.url);

    return (
        <div className="explore-card-group">
            <Link href={`/film/${content.id}`} className="explore-card">
                <div className="explore-card-image-wrap">
                    <img src={imageUrl} alt={title} className="explore-card-img" loading="lazy" />

                    {/* Platform Badge Overlay */}
                    {platform?.logoUrl && (
                        <div className="explore-card-platform">
                            <img src={platform.logoUrl} alt={platform.name} />
                        </div>
                    )}

                    {/* Hover Actions */}
                    <div className="explore-card-actions">
                        <button className="action-btn-play">
                            <Play size={20} fill="black" />
                        </button>

                    </div>

                    {/* Quality Badge */}
                    <div className="explore-card-quality">4K</div>
                </div>

                <div className="explore-card-info">
                    <h3 className="explore-card-title truncate">{title}</h3>
                    <div className="explore-card-meta">
                        <div className="flex items-center gap-1 text-[var(--color-primary)]">
                            <Star size={12} fill="currentColor" />
                            <span className="font-black">{rating ? rating.toFixed(1) : '8.0'}</span>
                        </div>
                        <span className="dot"></span>
                        <span>{year || '2024'}</span>
                        <span className="dot"></span>
                        <span className="uppercase text-[10px] font-bold opacity-40">{getContentTypeLabel(type)}</span>
                    </div>

                    {genres.length > 0 && (
                        <div className="explore-card-genres">
                            {genres.slice(0, 2).map((g: string) => (
                                <span key={g}>{g}</span>
                            ))}
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
}
