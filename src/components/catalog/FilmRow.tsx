'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Star } from 'lucide-react';
import Link from 'next/link';

interface FilmItem {
  id: string;
  title: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating?: number | null;
  year?: number | null;
  type?: string;
  duration?: number | null;
  genres?: string[];
}

interface FilmRowProps {
  title: string;
  subtitle?: string;
  items: FilmItem[];
  variant?: 'default' | 'large' | 'numbered';
  accentColor?: string;
  exploreUrl?: string;
}

export default function FilmRow({ title, subtitle, items, variant = 'default', accentColor, exploreUrl }: FilmRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 20);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 20);
  };

  if (items.length === 0) return null;

  const typeLabel = (type?: string) => {
    const map: Record<string, string> = {
      MOVIE: 'Película', SERIES: 'Serie', DOCUMENTARY: 'Documental',
      ANIME: 'Anime', NOVELA: 'Novela', SHORT: 'Corto', BIOGRAPHY: 'Biografía',
    };
    return map[type || ''] || '';
  };

  return (
    <section className="film-row-section" id={`section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="film-row-header">
        <div>
          <h2 className="film-row-title" style={accentColor ? { '--row-accent': accentColor } as React.CSSProperties : undefined}>
            {title}
          </h2>
          {subtitle && <p className="film-row-subtitle">{subtitle}</p>}
        </div>
        {exploreUrl && (
          <Link href={exploreUrl} className="film-row-more-btn">
            Ver todo
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      <div className="film-row-wrapper">
        {/* Left Arrow */}
        {showLeft && (
          <button className="film-row-arrow film-row-arrow--left" onClick={() => scroll('left')} aria-label="Anterior">
            <ChevronLeft size={24} />
          </button>
        )}

        {/* Scrollable row */}
        <div ref={scrollRef} className={`film-row-track film-row-track--${variant}`} onScroll={handleScroll}>
          {items.map((item, index) => (
            <Link key={item.id} href={`/film/${item.id}`} className={`film-card film-card--${variant}`}>
              {/* Number for numbered variant */}
              {variant === 'numbered' && (
                <span className="film-card-number">{index + 1}</span>
              )}

              {/* Image */}
              <div className="film-card-img-wrap">
                <img
                  src={item.posterUrl || item.backdropUrl || 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=800&auto=format&fit=crop'}
                  alt={item.title}
                  className="film-card-img"
                  loading="lazy"
                />
                <div className="film-card-overlay" />

                {/* Hover buttons */}
                <div className="film-card-hover-actions">
                  <button className="film-card-action-btn film-card-action-play" aria-label="Reproducir" onClick={(e) => e.preventDefault()}>
                    <Play size={16} fill="white" />
                  </button>
                  <button className="film-card-action-btn" aria-label="Agregar a lista" onClick={(e) => e.preventDefault()}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="film-card-info">
                <span className="film-card-title">{item.title}</span>
                <div className="film-card-meta">
                  {item.rating && item.rating > 0 && (
                    <span className="film-card-rating">
                      <Star size={10} fill="#f5c518" stroke="#f5c518" />
                      {item.rating.toFixed(1)}
                    </span>
                  )}
                  {item.year && <span>{item.year}</span>}
                  {item.type && <span className="film-card-type">{typeLabel(item.type)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right Arrow */}
        {showRight && (
          <button className="film-row-arrow film-row-arrow--right" onClick={() => scroll('right')} aria-label="Siguiente">
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </section>
  );
}
