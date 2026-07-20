'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';

interface Genre {
    id: string;
    name: string;
}

interface SeriviaFiltersProps {
    genres: Genre[];
    activeGenreId: string | null;
    onSelectGenre: (id: string | null) => void;
}

export default function SeriviaFilters({ genres, activeGenreId, onSelectGenre }: SeriviaFiltersProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const amount = 300;
            scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
        }
    };

    if (!genres) genres = [];

    return (
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar flex-1 pr-8" ref={scrollRef}>
                <button 
                    className={`serivia-filter-pill flex-shrink-0 ${!activeGenreId ? 'active' : ''}`}
                    onClick={() => onSelectGenre(null)}
                >
                    Tendencias
                </button>
                {genres.map(g => (
                    <button 
                        key={g.id}
                        className={`serivia-filter-pill flex-shrink-0 ${activeGenreId === g.id ? 'active' : ''}`}
                        onClick={() => onSelectGenre(g.id)}
                    >
                        {g.name}
                    </button>
                ))}
            </div>
            
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <button 
                    onClick={() => scroll('left')}
                    className="w-10 h-10 rounded-full bg-[#1A1B23] border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition shadow-inner"
                >
                    <ChevronLeft size={20} />
                </button>
                <button 
                    onClick={() => scroll('right')}
                    className="w-10 h-10 rounded-full bg-[#1A1B23] border border-white/5 flex items-center justify-center text-white hover:bg-white/10 transition shadow-inner"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
