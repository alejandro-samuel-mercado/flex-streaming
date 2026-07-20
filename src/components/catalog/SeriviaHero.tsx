'use client';

import { userFetch } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/api-routes';
import { ChevronLeft, ChevronRight, Heart, Play } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

const resolveImageUrl = (url?: string) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `https://api-streamflex.unixxtech.online/api/${url.replace(/^\//, '')}`;
};

export default function SeriviaHero({ content, contentList }: { content?: any, contentList?: any[] }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);

    // We need at least 3 items for the stacked effect
    const heroList = contentList && contentList.length >= 3 
        ? contentList.slice(0, 15) 
        : (content ? [content, content, content] : []);

    if (heroList.length === 0) return null;

    const mainItem = heroList[activeIndex];

    const nextSlide = () => setActiveIndex((prev) => (prev + 1) % heroList.length);
    const prevSlide = () => setActiveIndex((prev) => (prev - 1 + heroList.length) % heroList.length);

    // Auto-play every 10 seconds
    useEffect(() => {
        if (heroList.length <= 1) return;
        const timer = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % heroList.length);
        }, 10000);
        return () => clearInterval(timer);
    }, [heroList.length]);

    // Check favorite status of the active main item
    useEffect(() => {
        if (!mainItem?.id) return;
        
        const checkFav = async () => {
            const token = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');

            if (!token || !profileId) {
                // Guest / Not logged in: check localStorage
                const localFavorites = JSON.parse(localStorage.getItem('localFavorites') || '[]');
                setIsFavorited(localFavorites.includes(mainItem.id));
                return;
            }

            try {
                const res = await userFetch(`${API_ROUTES.FAVORITES.BASE}/check/${mainItem.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Profile-Id': profileId
                    }
                });
                const json = await res.json();
                if (json.success) {
                    setIsFavorited(json.data.isFavorited);
                }
            } catch (err) {
                console.error(err);
            }
        };

        checkFav();
    }, [mainItem?.id, activeIndex]);

    const handleToggleFavorite = async (e: React.MouseEvent, item: any) => {
        e.preventDefault();
        e.stopPropagation();

        if (!item?.id) return;

        const token = localStorage.getItem('accessToken');
        const profileId = localStorage.getItem('profileId');

        if (!token || !profileId) {
            // Guest / Not logged in: toggle in localStorage
            const localFavorites = JSON.parse(localStorage.getItem('localFavorites') || '[]');
            let newFavs = [...localFavorites];
            if (newFavs.includes(item.id)) {
                newFavs = newFavs.filter((id: string) => id !== item.id);
                setIsFavorited(false);
            } else {
                newFavs.push(item.id);
                setIsFavorited(true);
            }
            localStorage.setItem('localFavorites', JSON.stringify(newFavs));
            return;
        }

        // Authenticated user: toggle via API
        const prev = isFavorited;
        setIsFavorited(!prev);

        try {
            const res = await userFetch(API_ROUTES.FAVORITES.TOGGLE, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Profile-Id': profileId
                },
                body: JSON.stringify({ contentId: item.id })
            });
            const json = await res.json();
            if (json.success && !json.data?.error) {
                setIsFavorited(json.data.favorited);
            } else {
                setIsFavorited(prev);
            }
        } catch (err) {
            console.error(err);
            setIsFavorited(prev);
        }
    };

    const getPoster = (item: any) => resolveImageUrl(item?.thumbnails?.find((t: any) => t.type === 'BACKDROP')?.url || item?.thumbnails?.find((t: any) => t.type === 'POSTER')?.url);

    return (
        <div className="serivia-hero-root relative w-full h-[60vh] md:h-[70vh] mb-8 flex items-center perspective-1000 group">
            {heroList.map((item, idx) => {
                const diff = (idx - activeIndex + heroList.length) % heroList.length;
                
                let cardClass = "absolute top-0 left-0 w-full max-w-[90%] md:max-w-[75%] h-full rounded-[32px] overflow-hidden transition-all duration-1000 ease-in-out ";
                let style = {};

                if (diff === 0) {
                    // Active Main Card (Center)
                    cardClass += "z-30 opacity-100 shadow-[0_30px_60px_rgba(0,0,0,0.8)] pointer-events-auto";
                    style = { transform: 'translateX(0%) scale(1)' };
                } else if (diff === 1) {
                    // Next Card (Stacked on Right)
                    cardClass += "z-20 opacity-50 cursor-pointer hover:opacity-80";
                    style = { transform: 'translateX(25%) scale(0.9)' };
                } else if (diff === heroList.length - 1) {
                    // Previous Card (Sliding out to Left)
                    cardClass += "z-40 opacity-0 pointer-events-none";
                    style = { transform: 'translateX(-40%) scale(1.05)' };
                } else {
                    // Far future cards (Hidden offscreen to the right, waiting their turn)
                    cardClass += "z-10 opacity-0 pointer-events-none";
                    style = { transform: 'translateX(40%) scale(0.8)' };
                }

                return (
                    <div 
                        key={item.id || idx} 
                        className={cardClass} 
                        style={style}
                        onClick={() => diff !== 0 && setActiveIndex(idx)}
                    >
                        <img 
                            src={item.backdropUrl || item.posterUrl || resolveImageUrl(item.thumbnails?.find((t: any) => t.type === 'BACKDROP' || t.type === 'POSTER')?.url) || 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2070'} 
                            alt={item.title || item.slug}
                            className="w-full h-full object-cover"
                        />
                        
                        {diff !== 0 && <div className={`absolute inset-0 bg-black/${diff === 1 ? '30' : '50'}`}></div>}

                        {/* Main Card Content overlays */}
                        <div className={`absolute inset-0 transition-opacity duration-500 ${diff === 0 ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#1c1d26]/90 via-[#1c1d26]/80 to-transparent backdrop-blur-[4px] [mask-image:linear-gradient(to_right,black_50%,transparent)]"></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1c1d26]/90 via-transparent to-transparent"></div>

                            <div className="absolute inset-0 p-8 md:p-14 flex flex-col justify-end w-full md:max-w-[70%]">
                                <div className="flex flex-wrap items-center gap-2 mb-4">
                                 
                                    {item.genres?.[0] && <span className="serivia-badge bg-white/20 text-white">{item.genres[0].name || item.genres[0].genre?.name}</span>}
                                    {item.type && <span className="serivia-badge">{item.type === 'MOVIE' ? 'Película' : 'Serie'}</span>}
                                    {item.releaseYear && <span className="serivia-badge">{item.releaseYear}</span>}
                                    {item.ageRating?.code && <span className="serivia-badge">{item.ageRating.code}</span>}
                                </div>

                                <h1 className="text-3xl md:text-5xl font-black text-white mb-8 drop-shadow-xl tracking-tight max-w-2xl leading-[1.1]">
                                    {item.translations?.[0]?.title || item.title || item.slug || 'Título Desconocido'}
                                </h1>

                                <div className="flex items-center gap-4">
                                    <Link href={`/film/${item.slug}`} className="serivia-btn-play bg-white text-black hover:bg-gray-200" onClick={(e) => diff !== 0 && e.preventDefault()}>
                                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                                            <Play size={16} className="text-white fill-white ml-0.5" />
                                        </div>
                                        REPRODUCIR
                                    </Link>
                                    <button 
                                        onClick={(e) => handleToggleFavorite(e, item)}
                                        className="w-14 h-14 rounded-full border-2 border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition"
                                    >
                                        <Heart 
                                            size={24} 
                                            className={isFavorited ? "text-red-500 fill-current" : ""} 
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
                
                {/* Pagination Dots */}
                <div className="absolute top-8 right-8 flex gap-2 z-40">
                    {heroList.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-colors ${activeIndex === idx ? 'bg-white' : 'bg-gray-600 hover:bg-gray-400'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            
            {/* Quick Navigation Buttons for Main Card */}
            <button onClick={prevSlide} className="absolute left-[2%] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                <ChevronLeft size={24} />
            </button>
            <button onClick={nextSlide} className="absolute right-[2%] top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10">
                <ChevronRight size={24} />
            </button>
        </div>
    );
}
