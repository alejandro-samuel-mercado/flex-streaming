'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ContentCard from './ContentCard';

interface ContentItem {
  id: string;
  title: string;
  imageUrl: string;
  match?: string;
  type?: string;
  year?: number;
  quality?: string;
}

interface ContentRowProps {
  title: string;
  items: ContentItem[];
  showIndex?: boolean;
}

export default function ContentRow({ title, items, showIndex = false }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
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

  return (
    <div className="catalog-row group/row">
      <h2 className="catalog-row-title">{title}</h2>

      <div className="relative">
        {/* Left Arrow */}
        {showLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center
                       bg-gradient-to-r from-black/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label="Scroll left"
          >
            <ChevronLeft size={32} className="text-white drop-shadow-lg" />
          </button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="row-posters"
          onScroll={handleScroll}
        >
          {items.map((item, index) => (
            <div key={item.id} className="relative">
              {showIndex && (
                <span className="absolute -left-1 bottom-2 z-10 text-[5rem] font-black text-white/10 pointer-events-none select-none"
                      style={{ fontFamily: 'var(--font-display)' }}>
                  {index + 1}
                </span>
              )}
              <ContentCard {...item} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        {showRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-20 w-12 flex items-center justify-center
                       bg-gradient-to-l from-black/80 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
            aria-label="Scroll right"
          >
            <ChevronRight size={32} className="text-white drop-shadow-lg" />
          </button>
        )}
      </div>
    </div>
  );
}
