'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, ChevronRight, Play, LayoutGrid, X } from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import { API_ROUTES, API_ORIGIN, resolveImageUrl } from '@/lib/api-routes';

interface ContentData {
    id: string;
    type: string;
    status?: string;
    translations: { title: string; description: string }[];
    seasons?: any[];
    videoFiles: {
        id: string;
        masterPlaylist: string;
        status: string;
        subtitleTracks?: any[];
    }[];
}

const backendUrl = API_ORIGIN;

export default function WatchPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = params.id as string;
    const episodeId = searchParams.get('episodeId');

    const [content, setContent] = useState<ContentData | null>(null);
    const [currentEpisode, setCurrentEpisode] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [initialTime, setInitialTime] = useState<number>(0);
    const [streamSrc, setStreamSrc] = useState<string | null>(null);
    const [showEpisodes, setShowEpisodes] = useState(false);

    // 1. Fetch content metadata
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await fetch(`${API_ROUTES.CONTENT.BASE}/${id}`, { cache: 'no-store' });
                if (!res.ok) throw new Error('No se pudo cargar el contenido');
                const resJson = await res.json();

                if (!resJson.success || !resJson.data) {
                    throw new Error('No se pudo cargar el contenido');
                }

                const data = resJson.data;
                setContent(data);

                // Handle Episodic Content
                if (episodeId && data.seasons) {
                    let foundEp = null;
                    for (const s of data.seasons) {
                        foundEp = s.episodes?.find((e: any) => e.id === episodeId);
                        if (foundEp) {
                            foundEp.seasonNumber = s.number;
                            break;
                        }
                    }
                    if (foundEp) setCurrentEpisode(foundEp);
                } else if (data.type !== 'MOVIE') {
                    const firstEp = data.seasons?.[0]?.episodes?.[0];
                    if (firstEp) {
                        firstEp.seasonNumber = data.seasons[0].number;
                        setCurrentEpisode(firstEp);
                        router.replace(`/watch/${id}?episodeId=${firstEp.id}`, { scroll: false });
                    }
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, [id, episodeId]);

    // 2. Request a signed streaming token
    useEffect(() => {
        if (!content) return;

        const targetVideoFiles = currentEpisode ? currentEpisode.videoFiles : content.videoFiles;
        if (!targetVideoFiles || targetVideoFiles.length === 0) {
            if (content.type === 'MOVIE') setStreamSrc(null);
            return;
        }

        const requestAccess = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const profileId = localStorage.getItem('profileId');

                if (!token) {
                    setError('Debes iniciar sesión para ver este contenido.');
                    return;
                }

                const res = await fetch(API_ROUTES.STREAM.REQUEST_ACCESS, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        ...(profileId ? { 'X-Profile-Id': profileId } : {}),
                    },
                    body: JSON.stringify({
                        contentId: content.id,
                        episodeId: currentEpisode?.id
                    }),
                });

                if (!res.ok) throw new Error('No se pudo obtener acceso al video.');
                const resJson = await res.json();
                if (!resJson.success) throw new Error(resJson.error || 'Acceso denegado.');

                const { token: signedToken, videoFileId } = resJson.data;
                const hlsUrl = `${backendUrl}/api/stream/hls/${videoFileId}/master.m3u8?token=${signedToken}`;
                setStreamSrc(hlsUrl);
            } catch (err: any) {
                setError(err.message);
            }
        };

        requestAccess();
    }, [content, currentEpisode]);

    // 3. Restore watch progress
    useEffect(() => {
        if (!content) return;
        const watchId = currentEpisode ? currentEpisode.id : content.id;

        const fetchHistory = async () => {
            try {
                const localProgress = localStorage.getItem(`watch_progress_${watchId}`);
                if (localProgress) setInitialTime(parseInt(localProgress));

                const token = localStorage.getItem('accessToken');
                const profileId = localStorage.getItem('profileId');
                if (!token || !profileId) return;

                const res = await fetch(`${API_ROUTES.HISTORY.BASE}/${watchId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Profile-Id': profileId,
                    },
                });

                if (res.ok) {
                    const resJson = await res.json();
                    if (resJson.success && resJson.data?.progress) {
                        if (!localProgress || resJson.data.progress > parseInt(localProgress) + 5) {
                            setInitialTime(resJson.data.progress);
                        }
                    }
                }
            } catch (e) {
                console.error('History fetch error:', e);
            }
        };

        fetchHistory();
    }, [content?.id, currentEpisode?.id]);

    // 4. Progress saving
    const handleProgressUpdate = async (currentTime: number, duration: number) => {
        if (!content || duration === 0) return;
        const watchId = currentEpisode ? currentEpisode.id : content.id;

        localStorage.setItem(`watch_progress_${watchId}`, Math.floor(currentTime).toString());

        try {
            const token = localStorage.getItem('accessToken');
            const profileId = localStorage.getItem('profileId');
            if (!token || !profileId) return;

            await fetch(API_ROUTES.HISTORY.PROGRESS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Profile-Id': profileId,
                },
                body: JSON.stringify({
                    contentId: content.id,
                    episodeId: currentEpisode?.id,
                    progress: Math.floor(currentTime),
                    duration: Math.floor(duration),
                }),
            });
        } catch (e) {
            console.error('Error saving progress:', e);
        }
    };

    const handleNextEpisode = () => {
        if (!content?.seasons || !currentEpisode) return;
        let foundCurrent = false;
        for (const s of content.seasons) {
            for (const e of s.episodes || []) {
                if (foundCurrent) {
                    router.push(`/watch/${id}?episodeId=${e.id}`);
                    return;
                }
                if (e.id === currentEpisode.id) foundCurrent = true;
            }
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin mb-4" size={48} color="var(--color-primary)" />
                <p className="text-xl font-medium">Preparando tu función...</p>
            </div>
        );
    }

    if (error || !content) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-6 text-center">
                <AlertCircle size={64} className="text-primary mb-6" />
                <h1 className="text-3xl font-bold mb-4">¡Ups! Algo salió mal</h1>
                <p className="text-gray-400 mb-8 max-w-md">{error || 'No se encontró el video.'}</p>
                <button onClick={() => router.back()} className="px-8 py-3 bg-white text-black font-bold rounded-md hover:bg-gray-200 transition">Volver atrás</button>
            </div>
        );
    }

    if (!streamSrc) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin mb-4" size={48} color="var(--color-primary)" />
                <p className="text-xl font-medium">Cargando contenido
                    ...</p>
            </div>
        );
    }

    const targetVideos = currentEpisode ? currentEpisode.videoFiles : content.videoFiles;
    const videoFile = targetVideos?.find((v: any) => v.status === 'COMPLETED') || targetVideos?.[0];
    const subtitles = videoFile?.subtitleTracks?.map((s: any) => ({
        url: s.url.startsWith('http') ? s.url : `${backendUrl}${s.url.startsWith('/') ? '' : '/'}${s.url}`,
        language: s.language,
        label: s.label,
    })) || [];

    return (
        <div className="h-screen w-full bg-black relative overflow-hidden group">
            <VideoPlayer
                src={streamSrc}
                title={currentEpisode ? `${content.translations[0]?.title} - T${currentEpisode.seasonNumber}E${currentEpisode.number}` : content.translations[0]?.title}
                initialTime={initialTime}
                externalSubtitles={subtitles}
                onProgressUpdate={handleProgressUpdate}
                onEnded={handleNextEpisode}
            />

            {/* Navigation Overlay */}
            <div className="absolute top-8 left-8 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-white/70 hover:text-white font-bold transition-all">
                    <ChevronRight size={24} className="rotate-180" /> {content.translations[0]?.title}
                </button>
            </div>

            {/* Episodes Toggle */}
            {content.seasons && content.seasons.length > 0 && (
                <div className="absolute bottom-28 right-8 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                        onClick={() => setShowEpisodes(!showEpisodes)}
                        className="flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-full text-white hover:bg-primary/20 hover:border-primary/50 transition-all shadow-2xl"
                        title="Episodios"
                    >
                        <LayoutGrid size={28} />
                    </button>
                </div>
            )}

            {/* Episode Sidebar Panel */}
            {showEpisodes && (
                <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-black/90 backdrop-blur-2xl border-l border-white/10 z-[100] p-8 overflow-y-auto animate-in slide-in-from-right duration-300 shadow-[-20px_0_40px_rgba(0,0,0,0.8)]">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Episodios</h2>
                        <button onClick={() => setShowEpisodes(false)} className="text-white/40 hover:text-white p-2">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex flex-col gap-6">
                        {content.seasons?.map((s: any) => (
                            <div key={s.id}>
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4 opacity-80 border-b border-primary/20 pb-2">Temporada {s.number}</h3>
                                <div className="flex flex-col gap-3">
                                    {s.episodes?.map((e: any) => (
                                        <button
                                            key={e.id}
                                            onClick={() => {
                                                setShowEpisodes(false);
                                                router.push(`/watch/${id}?episodeId=${e.id}`);
                                            }}
                                            className={`flex items-center gap-4 p-3 rounded-2xl transition-all text-left group/ep ${e.id === currentEpisode?.id ? 'bg-primary/20 ring-1 ring-primary/40' : 'hover:bg-white/5'}`}
                                        >
                                            <div className="relative w-28 aspect-video rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                                                {e.thumbnails?.[0]?.url ? (
                                                    <img src={resolveImageUrl(e.thumbnails[0].url)} className="w-full h-full object-cover opacity-50 group-hover/ep:opacity-80 transition-opacity" alt="" />
                                                ) : null}
                                                {e.id === currentEpisode?.id ? (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                                                            <Play size={14} fill="white" className="text-white ml-1" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/ep:opacity-100 transition-opacity bg-black/40">
                                                        <Play size={16} fill="white" className="text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold truncate ${e.id === currentEpisode?.id ? 'text-primary' : 'text-white'}`}>
                                                    {e.number}. {e.translations?.[0]?.title || `Episodio ${e.number}`}
                                                </p>
                                                <p className="text-[10px] text-white/30 uppercase font-black mt-1">{e.duration || '??'} MIN</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
