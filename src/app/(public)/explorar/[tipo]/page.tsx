'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ContentCard from '@/components/catalog/ContentCard';
import { Filter, SlidersHorizontal, Grid3X3, LayoutGrid } from 'lucide-react';

const TIPO_CONFIG: Record<string, { label: string; description: string }> = {
  peliculas: { label: 'Películas', description: 'Todo el catálogo de películas disponible en Nuba.' },
  series: { label: 'Series', description: 'Las mejores series y shows exclusivos en Nuba.' },
  anime: { label: 'Anime', description: 'Disfruta del mejor catálogo de anime legal en Nuba.' },
  documentales: { label: 'Documentales', description: 'Explora el mundo a través de documentales fascinantes.' },
};

const GENRES = ['Todas', 'Acción', 'Comedia', 'Drama', 'Terror', 'Ciencia Ficción', 'Romance', 'Thriller', 'Animación'];

// Mock data — will be replaced by API calls
const MOCK_ITEMS = Array.from({ length: 24 }, (_, i) => ({
  id: String(i + 1),
  title: `Contenido ${i + 1}`,
  imageUrl: `https://images.unsplash.com/photo-${1534809027769 + i * 1000000}?q=80&w=600&auto=format&fit=crop`,
  match: `${85 + Math.floor(Math.random() * 14)}%`,
  year: 2020 + Math.floor(Math.random() * 5),
  quality: ['HD', '4K', 'HDR'][Math.floor(Math.random() * 3)],
}));

// Use known working images for demo
const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1626278664285-f796b9ee7806?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1535016120-3b1a6e3e1eb0?q=80&w=600&auto=format&fit=crop',
];

const ITEMS_WITH_IMAGES = MOCK_ITEMS.map((item, i) => ({
  ...item,
  imageUrl: DEMO_IMAGES[i % DEMO_IMAGES.length],
}));

export default function ExplorePage() {
  const params = useParams();
  const tipo = params.tipo as string;
  const config = TIPO_CONFIG[tipo] || { label: tipo, description: '' };
  const [selectedGenre, setSelectedGenre] = useState('Todas');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  return (
    <main className="min-h-screen pt-20 pb-16">
      {/* Header */}
      <div className="px-[var(--page-padding)] mb-8">
        <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', letterSpacing: '2px' }}>
          {config.label}
        </h1>
        {config.description && (
          <p className="mt-2 text-[var(--color-text-muted)] text-lg max-w-2xl">{config.description}</p>
        )}
      </div>

      {/* Filters Bar */}
      <div className="px-[var(--page-padding)] mb-6 flex items-center gap-3 flex-wrap">
        {/* Genre pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mr-auto">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                ${selectedGenre === genre
                  ? 'bg-white text-black'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-white'
                }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* View toggles */}
        <div className="flex gap-1 bg-[var(--color-surface)] rounded-lg p-1 border border-[var(--color-border)]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-[var(--color-surface-3)] text-white' : 'text-[var(--color-text-dim)]'}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded-md transition ${viewMode === 'compact' ? 'bg-[var(--color-surface-3)] text-white' : 'text-[var(--color-text-dim)]'}`}
            aria-label="Compact view"
          >
            <Grid3X3 size={18} />
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className={`px-[var(--page-padding)] grid gap-3 ${
        viewMode === 'grid'
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
          : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
      }`}>
        {ITEMS_WITH_IMAGES.map((item) => (
          <div key={item.id} className="aspect-[2/3] relative">
            <ContentCard {...item} />
          </div>
        ))}
      </div>
    </main>
  );
}
