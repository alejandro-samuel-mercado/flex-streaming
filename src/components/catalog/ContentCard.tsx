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
}

export default function ContentCard({
  id, title, imageUrl, match, type, year, quality, isLarge = false
}: ContentCardProps) {
  return (
    <Link
      href={`/film/${id}`}
      className={`poster-card block ${isLarge ? 'col-span-2 row-span-2' : ''}`}
    >
      <img src={imageUrl} alt={title} className="poster-img" loading="lazy" />

      <div className="poster-info">
        <span className="poster-title">{title}</span>
        <div className="poster-meta">
          {match && <span className="match-score">{match}</span>}
          {year && <span>{year}</span>}
          {quality && <span className="badge-quality">{quality}</span>}
          {type && <span className="text-gray-400">{type}</span>}
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="w-7 h-7 rounded-full border border-white/40 flex items-center justify-center hover:border-white transition bg-black/40"
            aria-label="Reproducir"
          >
            <Play size={12} fill="white" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="w-7 h-7 rounded-full border border-white/40 flex items-center justify-center hover:border-white transition bg-black/40"
            aria-label="Mi lista"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="w-7 h-7 rounded-full border border-white/40 flex items-center justify-center hover:border-white transition bg-black/40 ml-auto"
            aria-label="Más info"
          >
            <Info size={12} />
          </button>
        </div>
      </div>
    </Link>
  );
}
