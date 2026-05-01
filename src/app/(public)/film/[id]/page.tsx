'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_ROUTES } from '@/lib/api-routes';
import { Play, Plus, ThumbsUp, Share2, ChevronDown, Star, Film, ArrowLeft, MonitorPlay } from 'lucide-react';
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
                const resJson = await res.json();
                if (resJson.success && resJson.data) {
                    setContent(resJson.data);
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

    const translation = content.translations?.[0] || { title: 'Sin título', description: 'Sin descripción disponible.' };

    // Thumbnails
    const thumbnails = content.thumbnails || [];
    const poster = thumbnails.find((t: any) => t.type === 'POSTER')?.url;
    const backdrop = thumbnails.find((t: any) => t.type === 'BACKDROP')?.url || poster || DEMO_BACKDROP;

    const resolveUrl = (url: string) => {
        if (!url) return DEMO_BACKDROP;
        if (url.startsWith('http')) return url;
        try {
            const publicApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
            const backendUrl = new URL(publicApiUrl).origin;
            return `${backendUrl}${url}`;
        } catch (e) {
            return url;
        }
    };

    const backdropUrl = resolveUrl(backdrop);
    const posterUrl = resolveUrl(poster);

    // Metadata strings
    const genres = (content.genres || []).map((g: any) => g.genre?.name).join(', ');
    const director = (content.directors || []).map((d: any) => d.director?.name).join(', ') || 'Desconocido';
    const cast = (content.actors || []).map((a: any) => a.actor?.name).join(', ') || 'No disponible';

    return (
        <main className="min-h-screen bg-[#030612] text-white relative py-10!">
            <div className="fixed inset-0 pointer-events-none opacity-40 mix-blend-screen bg-[radial-gradient(ellipse_at_20%_20%,rgba(0,229,255,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(255,107,0,0.1)_0%,transparent_50%)] z-0" />
            {/* Hero Section — Enhanced Depth */}
            <section className="relative h-[85vh] w-full overflow-hidden">
                {/* Backdrop Image with Parallax-like effect (static but centered) */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] scale-105"
                    style={{ backgroundImage: `url(${backdropUrl})`, backgroundPosition: 'center 15%' }}
                />

                {/* Deep Cinematic Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#030612] via-[#030612]/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030612] via-[#030612]/30 to-transparent" />
                <div className="absolute inset-0 bg-black/10 mix-blend-multiply" />

                {/* Back Button */}
                <div className="absolute top-8 left-[7%] z-50">
                    <Link href="/" className="flex items-center justify-center w-12 h-12 rounded-full bg-[#030612]/50 backdrop-blur-md border border-[#00E5FF]/20 text-white hover:bg-[#00E5FF]/20 hover:border-[#00E5FF] hover:text-[#00E5FF] hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all">
                        <ArrowLeft size={24} />
                    </Link>
                </div>

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end" style={{ paddingLeft: '7%', paddingRight: '7%', paddingBottom: '120px' }}>
                    <div className="max-w-5xl animate-fadeSlideUp relative z-10">
                        {/* Action Badges */}
                        <div className="flex items-center gap-3 flex-wrap mb-6">
                            {content.featured && (
                                <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF0055] text-white px-3 py-1 text-[11px] font-black rounded-sm tracking-[2px] shadow-[0_4px_15px_rgba(255,107,0,0.4)]">
                                    TOP 10
                                </span>
                            )}
                            <span className="bg-[#0f1532]/80 backdrop-blur-xl border border-[#00E5FF]/30 text-white px-3 py-1 text-[11px] font-black rounded-sm tracking-[2px] uppercase shadow-[0_0_10px_rgba(0,229,255,0.2)]">
                                {content.type || 'Película'}
                            </span>
                            <span className="text-[#00E5FF] text-sm md:text-base font-black tracking-tight drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                                98% coincidencia
                            </span>
                        </div>

                        {/* Premium Typography Title */}
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 uppercase tracking-tighter leading-[0.9] drop-shadow-2xl text-wrap" style={{ fontFamily: 'var(--font-display)', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>
                            {translation.title}
                        </h1>

                        {/* Polished Metadata Bar */}
                        <div className="flex items-center gap-6 text-gray-300 text-base font-bold mb-10">
                            <span className="text-white bg-white/10 px-2 py-0.5 rounded">{content.releaseYear}</span>
                            <span className="border-2 border-white/40 px-2 py-0.5 rounded text-xs text-white">16+</span>
                            <span>{content.duration} min</span>
                            <span className="text-gray-400 font-black tracking-widest text-xs">ULTRA HD 4K</span>
                            <div className="flex items-center gap-2 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                                <Star size={18} fill="currentColor" />
                                <span className="text-white font-black">{content.rating || '8.5'}</span>
                            </div>
                        </div>

                        {/* Synopsis with better line height */}
                        <p className="text-gray-200 text-base md:text-xl leading-relaxed mb-10 max-w-3xl font-medium drop-shadow-md line-clamp-3 md:line-clamp-none" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            {translation.description}
                        </p>

                        {/* Massive Action Buttons */}
                        <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                            <Link href={`/watch/${id}`}
                                className="flex items-center gap-3 md:gap-4 px-8 md:px-14 py-4 md:py-5 bg-gradient-to-r from-[#00E5FF] to-[#0099AA] text-black font-black rounded-xl hover:from-[#4DEDFF] hover:to-[#00E5FF] transition-all hover:scale-[1.03] active:scale-95 shadow-[0_10px_30px_rgba(0,229,255,0.4)] text-sm md:text-base">
                                <Play size={24} fill="black" className="md:w-7 md:h-7" />
                                REPRODUCIR
                            </Link>

                            <button className="flex items-center gap-3 px-6 md:px-10 py-4 md:py-5 bg-[#080d24]/60 backdrop-blur-2xl border border-[#00E5FF]/30 text-white font-bold rounded-xl hover:border-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all active:scale-95 shadow-2xl text-sm md:text-base">
                                <MonitorPlay size={24} />
                                TRÁILER
                            </button>

                            <div className="flex items-center gap-4">
                                <button className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full border border-[#00E5FF]/30 bg-[#080d24]/60 backdrop-blur-2xl hover:border-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all active:scale-90 shadow-2xl">
                                    <Plus size={28} />
                                </button>
                                <button className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full border border-[#00E5FF]/30 bg-[#080d24]/60 backdrop-blur-2xl hover:border-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all active:scale-90 shadow-2xl">
                                    <ThumbsUp size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="pt-20 pb-24 relative z-10" style={{ paddingLeft: '7%', paddingRight: '7%' }}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                    {/* Left: Interactive Tabs Content */}
                    <div className="lg:col-span-8 space-y-16">
                        {/* Premium Tab Navigation */}
                        <div className="flex gap-14 border-b border-[#00E5FF]/20 relative">
                            {(['related', 'episodes', 'details'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-8 text-sm font-black uppercase tracking-[0.3em] transition-all relative
                    ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-[#00E5FF]'}`}
                                >
                                    {tab === 'related' ? 'Similares' : tab === 'episodes' ? 'Episodios' : 'Detalles'}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.6)]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Animated Content Panels */}
                        <div className="min-h-[500px] animate-fadeIn">
                            {activeTab === 'related' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                                    {MOCK_RELATED.map(item => (
                                        <Link key={item.id} href={`/film/${item.id}`} className="group block">
                                            <div className="aspect-video rounded-xl overflow-hidden bg-[#080d24] mb-3 ring-1 ring-[#00E5FF]/10 group-hover:ring-[#00E5FF] transition-all shadow-lg group-hover:shadow-[0_8px_25px_rgba(0,229,255,0.3)]">
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 filter brightness-90 group-hover:brightness-110 contrast-125" />
                                            </div>
                                            <span className="text-sm md:text-base font-black text-gray-400 group-hover:text-[#00E5FF] transition line-clamp-1 uppercase tracking-wider drop-shadow-md">
                                                {item.title}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'details' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 py-6">
                                    <div className="space-y-12">
                                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                            <h4 className="text-gray-600 text-[11px] font-black uppercase tracking-[0.4em] mb-4">Director</h4>
                                            <p className="text-3xl text-white font-black tracking-tight">{director}</p>
                                        </div>
                                        <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                                            <h4 className="text-gray-600 text-[11px] font-black uppercase tracking-[0.4em] mb-4">Géneros</h4>
                                            <p className="text-2xl text-white/90 font-bold">{genres}</p>
                                        </div>
                                    </div>
                                    <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[40px]">
                                        <h4 className="text-gray-600 text-[11px] font-black uppercase tracking-[0.4em] mb-6">Elenco Principal</h4>
                                        <p className="text-xl text-gray-400 leading-loose font-medium">{cast}</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'episodes' && (
                                <div className="space-y-4 py-4">
                                    {content.type === 'Serie' ? (
                                        [1, 2, 3, 4, 5].map(ep => (
                                            <div key={ep} className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 rounded-2xl bg-[#080d24]/40 border border-[#00E5FF]/10 hover:border-[#00E5FF]/40 hover:bg-[#080d24]/80 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all cursor-pointer group">
                                                <div className="relative w-full sm:w-48 aspect-video rounded-xl overflow-hidden flex-shrink-0">
                                                    <img src={backdropUrl} alt={`Episode ${ep}`} className="w-full h-full object-cover filter brightness-75 group-hover:brightness-100 transition-all duration-700 group-hover:scale-105" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Play size={28} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-[0_0_10px_rgba(0,229,255,0.8)] transition-all scale-75 group-hover:scale-100" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h5 className="text-lg font-black text-white mb-2 group-hover:text-[#00E5FF] transition-colors">Episodio {ep}</h5>
                                                    <p className="text-sm text-gray-400 line-clamp-2 md:line-clamp-3">Una breve descripción de lo que ocurre en este emocionante episodio donde los personajes enfrentan nuevos desafíos y descubren secretos ocultos.</p>
                                                </div>
                                                <div className="text-[#00E5FF] font-bold text-sm px-2 sm:px-4 shrink-0 hidden sm:block">45 min</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-32 text-[#00E5FF]/30 border-2 border-dashed border-[#00E5FF]/10 rounded-[40px] bg-[#080d24]/30">
                                            <Film size={64} className="mb-6 opacity-40" />
                                            <p className="text-xl font-black tracking-widest uppercase opacity-80 text-center px-6">Esta no es una serie.<br />No hay episodios disponibles.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Premium Information Sidebar */}
                    <div className="lg:col-span-4 relative z-10">
                        <div className="bg-[#0f1532]/60 border border-[#00E5FF]/20 rounded-[40px] p-12 sticky top-24 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_20px_rgba(0,229,255,0.1)_inset]" style={{ padding: "30px" }}>
                            <h3 className="text-[11px] font-black tracking-[5px] text-[#00E5FF] uppercase mb-12 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">Información</h3>

                            <div className="space-y-10">
                                <div className="flex flex-col gap-2 group">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-400 transition">Distribución</span>
                                    <span className="text-2xl font-black text-white/90">{content.platform?.name || 'PELIPLUS ORIGINALS'}</span>
                                </div>

                                <div className="flex flex-col gap-2 group">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-400 transition">Año de Estreno</span>
                                    <span className="text-2xl font-black text-white/90">{content.releaseYear}</span>
                                </div>

                                <div className="flex flex-col gap-2 group">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-400 transition">Tiempo Total</span>
                                    <span className="text-2xl font-black text-white/90">{content.duration} minutos</span>
                                </div>

                                <div className="flex flex-col gap-4 pt-6 group">
                                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-gray-400 transition">Puntuación Global</span>
                                    <div className="flex items-center gap-4">
                                        <Star size={32} fill="#f5c518" className="text-yellow-400 filter drop-shadow-[0_0_10px_rgba(245,197,24,0.3)]" />
                                        <span className="text-5xl font-black text-white">{content.rating || '8.5'}<span className="text-lg text-gray-700 ml-2">/ 10</span></span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-14 pt-10 border-t border-[#00E5FF]/20">
                                <div className="flex flex-wrap gap-3">
                                    {(content.genres || []).map((g: any) => (
                                        <span key={g.genre.id} className="px-5 py-2 bg-[#00E5FF]/5 hover:bg-[#00E5FF]/15 rounded-full text-[10px] font-black text-[#4DEDFF] hover:text-white border border-[#00E5FF]/30 hover:border-[#00E5FF] hover:shadow-[0_0_10px_rgba(0,229,255,0.3)] uppercase tracking-widest transition-all">
                                            {g.genre.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Recommendations Footer — High Spacing */}
            <div className="pb-48 relative z-10" style={{ paddingLeft: '7%', paddingRight: '7%' }}>
                <div className="pt-32 border-t border-[#00E5FF]/10">
                    <ContentRow title="Te puede gustar" items={MOCK_RELATED} />
                </div>
            </div>
        </main>
    );
}
