'use client';

import Link from 'next/link';
import { Play, Plus, Info } from 'lucide-react';

interface ContentCardProps {
  id: string;
  title: string;
  imageUrl: string;
  match?: string;
  type?: string;
  year?: number;
  quality?: string;
  isLarge?: boolean;
  rating?: number;
  duration?: number;
  genres?: string[];
}

export default function ContentCard({
  id, title, imageUrl, match, type, year, quality, isLarge = false, rating, duration, genres
}: ContentCardProps) {
  return (
    <Link
      href={`/film/${id}`}
      className={`poster-card block ${isLarge ? 'col-span-2 row-span-2' : ''}`}
    >
      <img src={imageUrl} alt={title} className="poster-img" />

      <div className="poster-info">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="poster-title truncate flex-1">{title}</span>
          {rating && (
            <div className="flex items-center gap-1 text-[10px] font-black text-[var(--color-primary)] bg-[var(--color-primary-glow)] px-1.5 py-0.5 rounded">
              ★ {rating.toFixed(1)}
            </div>
          )}
        </div>
        
        <div className="poster-meta flex-wrap">
          {match && <span className="match-score">{match}</span>}
          {year && <span>{year}</span>}
          {duration && <span>{duration} min</span>}
          {quality && <span className="badge-quality text-[9px] py-0.5 px-1.5">{quality}</span>}
          {type && <span className="text-white/40 uppercase text-[9px] font-bold">{type}</span>}
        </div>

        {genres && genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {genres.slice(0, 2).map(g => (
              <span key={g} className="text-[9px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Quick action buttons - Spaced and Premium */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-gray-200 transition-all active:scale-90"
            aria-label="Reproducir"
          >
            <Play size={18} fill="currentColor" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center hover:border-white hover:bg-white/10 transition-all text-white active:scale-90"
            aria-label="Mi lista"
          >
            <Plus size={22} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="w-10 h-10 rounded-full border-2 border-white/20 bg-white/5 backdrop-blur-md flex items-center justify-center hover:border-white hover:bg-white/10 transition-all text-white active:scale-90 ml-auto"
            aria-label="Más info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>
    </Link>
  );
}
