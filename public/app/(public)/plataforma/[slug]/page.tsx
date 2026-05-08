'use client';

import { useEffect, useState } from 'react';
import ContentRow from '@/components/catalog/ContentRow';
import { API_ROUTES } from '@/lib/api-routes';

interface Platform {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  contents: any[];
}

export default function PlatformPage({ params }: { params: { slug: string } }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_ROUTES.PLATFORMS.DETAIL(params.slug))
      .then(r => r.json())
      .then(data => {
        setPlatform(data.data || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-black text-white">Abriendo portal a plataforma...</div>;
  if (!platform) return <div className="h-screen w-full flex items-center justify-center bg-black text-white text-2xl font-bold">Plataforma no encontrada o no existe.</div>;

  return (
    <main className="pt-32 px-12 md:px-16 min-h-screen bg-black">
      <div className="flex items-center gap-6 mb-16 pb-8 border-b border-[var(--color-border)]">
        {platform.logoUrl ? (
          <img src={platform.logoUrl} alt={platform.name} className="h-24 md:h-32 object-contain filter drop-shadow-2xl" />
        ) : (
          <h1 className="text-5xl font-bold text-white">{platform.name}</h1>
        )}
      </div>

      <div className="pb-20">
        <ContentRow title={`Lo Mejor de ${platform.name}`} items={platform.contents?.map((c: any) => ({
          id: c.id,
          title: c.translations?.[0]?.title || 'Contenido',
          imageUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop',
          match: `${Math.floor(Math.random() * 15 + 85)}%`,
          year: new Date(c.createdAt).getFullYear(),
          quality: 'HD',
          type: c.type
        })) || []} />
      </div>
    </main>
  );
}
