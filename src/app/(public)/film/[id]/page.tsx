'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_ROUTES } from '@/lib/api-routes';
import { Play, Plus, ThumbsUp, Share2, ChevronDown, Star } from 'lucide-react';
import ContentRow from '@/components/catalog/ContentRow';
import Link from 'next/link';

const DEMO_BACKDROP = 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2574&auto=format&fit=crop';

const MOCK_RELATED = Array.from({ length: 8 }, (_, i) => ({
  id: String(i + 100),
  title: `Título relacionado ${i + 1}`,
  imageUrl: [
    'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=600',
    'https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?q=80&w=600',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600',
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600',
    'https://images.unsplash.com/photo-1626278664285-f796b9ee7806?q=80&w=600',
    'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=600',
    'https://images.unsplash.com/photo-1535016120-3b1a6e3e1eb0?q=80&w=600',
  ][i],
  match: `${88 + Math.floor(Math.random() * 11)}%`,
  year: 2022 + Math.floor(Math.random() * 3),
  quality: ['HD', '4K'][Math.floor(Math.random() * 2)],
}));
export default function FilmDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'episodes' | 'related' | 'details'>('related');
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${API_ROUTES.CONTENT.BASE}/${id}`);
        if (res.ok) {
          const data = await res.json();
          setContent(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [id]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white">Cargando...</div>;
  if (!content) return <div className="h-screen bg-black flex items-center justify-center text-white">No encontrado</div>;

  const translation = content.translations?.[0] || { title: 'Sin título', description: '' };
  const poster = content.thumbnails?.find((t: any) => t.type === 'POSTER')?.url || DEMO_BACKDROP;
  const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000';
  const posterUrl = poster.startsWith('http') ? poster : `${backendUrl}${poster}`;

  return (
    <main className="min-h-screen">
      {/* Hero — Full bleed backdrop */}
      <section className="relative h-[70vh] min-h-[500px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${posterUrl})` }}
        />
        {/* Vignette overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/40 to-transparent" />

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-[var(--page-padding)] pb-12 z-10">
          <div className="max-w-2xl animate-fadeSlideUp">
            <div className="flex items-center gap-3 mb-3">
              {content.featured && <span className="badge badge-trending">TOP 10</span>}
              <span className="badge badge-new">NUEVO</span>
            </div>

            <h1 className="text-6xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)', lineHeight: 0.9, letterSpacing: '2px' }}>
              {translation.title.toUpperCase()}
            </h1>

            <div className="flex items-center gap-3 text-[var(--color-text-muted)] text-sm font-semibold mb-4">
              <span className="text-[var(--color-success)] font-bold text-base">97% para ti</span>
              <span>{content.releaseYear}</span>
              <span className="rating-badge">16+</span>
              <span>{content.duration} min</span>
              <span className="quality-badge">HD</span>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} fill="currentColor" />
                <span>{content.rating || '8.5'}</span>
              </div>
            </div>

            <p className="text-[var(--color-text-secondary)] text-base leading-relaxed mb-6 max-w-xl">
              {translation.description}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/watch/${id}`} className="btn-play">
                <Play size={22} fill="black" />
                Reproducir
              </Link>

              <button className="w-11 h-11 rounded-full border-2 border-white/40 flex items-center justify-center
                                hover:border-white transition bg-black/30 backdrop-blur-sm">
                <Plus size={22} />
              </button>

              <button className="w-11 h-11 rounded-full border-2 border-white/40 flex items-center justify-center
                                hover:border-white transition bg-black/30 backdrop-blur-sm">
                <ThumbsUp size={20} />
              </button>

              <button className="w-11 h-11 rounded-full border-2 border-white/40 flex items-center justify-center
                                hover:border-white transition bg-black/30 backdrop-blur-sm">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section className="px-[var(--page-padding)] py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column — More info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-6 border-b border-[var(--color-border)]">
              {(['related', 'episodes', 'details'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 text-sm font-semibold uppercase tracking-wider transition border-b-2
                    ${activeTab === tab
                      ? 'border-[var(--color-primary)] text-white'
                      : 'border-transparent text-[var(--color-text-muted)] hover:text-white'
                    }`}
                >
                  {tab === 'related' ? 'Más como esto' : tab === 'episodes' ? 'Episodios' : 'Detalles'}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'related' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MOCK_RELATED.map(item => (
                  <Link key={item.id} href={`/film/${item.id}`} className="group">
                    <div className="aspect-video rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface)] mb-2
                                    transition-transform group-hover:scale-105">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-secondary)] group-hover:text-white transition">
                      {item.title}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="space-y-4">
                <div>
                  <span className="text-[var(--color-text-muted)] text-sm">Director:</span>
                  <span className="ml-2 text-white">Denis Villeneuve</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] text-sm">Elenco:</span>
                  <span className="ml-2 text-white">Timothée Chalamet, Zendaya, Austin Butler, Florence Pugh</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] text-sm">Géneros:</span>
                  <span className="ml-2 text-white">Ciencia ficción, Aventura, Drama</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] text-sm">Audio:</span>
                  <span className="ml-2 text-white">Español Latino, English, Português</span>
                </div>
                <div>
                  <span className="text-[var(--color-text-muted)] text-sm">Subtítulos:</span>
                  <span className="ml-2 text-white">Español, English, Português</span>
                </div>
              </div>
            )}

            {activeTab === 'episodes' && (
              <div className="text-[var(--color-text-muted)] py-8 text-center">
                Este contenido no tiene episodios disponibles.
              </div>
            )}
          </div>

          {/* Right Column — Metadata sidebar */}
          <div className="space-y-6">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 space-y-4">
              <h3 className="text-lg font-bold">Información</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Tipo</span>
                  <span>Película</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Año</span>
                  <span>2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Duración</span>
                  <span>2h 35min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star size={14} fill="#f5c518" className="text-yellow-400" />
                    <span>8.7/10</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">País</span>
                  <span>USA</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6">
              <h3 className="text-lg font-bold mb-3">Géneros</h3>
              <div className="flex flex-wrap gap-2">
                {['Ciencia ficción', 'Aventura', 'Drama', 'Acción'].map(g => (
                  <span key={g} className="px-3 py-1.5 bg-[var(--color-surface-2)] rounded-full text-xs font-medium text-[var(--color-text-muted)]">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Content Row */}
      <div className="catalog-container mt-4">
        <ContentRow title="Porque viste esto" items={MOCK_RELATED} />
      </div>
    </main>
  );
}
