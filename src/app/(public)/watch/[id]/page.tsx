'use client';
import { userFetch } from '@/lib/api-client';

import VideoPlayer from '@/components/video/VideoPlayer';
import { API_ORIGIN, API_ROUTES } from '@/lib/api-routes';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface ContentData {
    id: string;
    title?: string;
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
    const [showAds, setShowAds] = useState<boolean>(false);
    const [showEpisodes, setShowEpisodes] = useState(false);

    // Flat list of all episodes across all seasons for prev/next navigation
    const allEpisodes = useMemo(() => {
        if (!content?.seasons) return [];
        return content.seasons.flatMap((s: any) =>
            (s.episodes || []).map((e: any) => ({ ...e, seasonNumber: s.number }))
        );
    }, [content?.seasons]);

    const currentEpisodeIndex = useMemo(() => {
        if (!currentEpisode) return -1;
        return allEpisodes.findIndex((e: any) => e.id === currentEpisode.id);
    }, [allEpisodes, currentEpisode]);

    const hasNextEpisode = currentEpisodeIndex >= 0 && currentEpisodeIndex < allEpisodes.length - 1;
    const hasPrevEpisode = currentEpisodeIndex > 0;

    // 1. Fetch content metadata
    useEffect(() => {
        const fetchContent = async () => {
            setInitialTime(0);
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
                        router.replace(`/film/${id}/watch?episodeId=${firstEp.id}`, { scroll: false });
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

        // Episodes might not have direct videoFiles if a fallback content videoFile exists.
        // Let the API decide if the video is available.
        const requestAccess = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const profileId = localStorage.getItem('profileId');

                if (!token) {
                    setError('Debes iniciar sesión para ver este contenido.');
                    return;
                }

                // Always use the content ID; episodeId is a query param
                let watchUrl = `${API_ROUTES.CONTENT.BASE}/${content.id}/watch`;
                if (currentEpisode) {
                    watchUrl += `?episodeId=${currentEpisode.id}`;
                }

                const res = await userFetch(watchUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        ...(profileId ? { 'X-Profile-Id': profileId } : {}),
                    }
                });

                if (!res.ok) {
                    const errJson = await res.json().catch(() => ({}));
                    throw new Error(errJson.error || 'No se pudo obtener acceso al video.');
                }
                const resJson = await res.json();
                if (!resJson.success) throw new Error(resJson.error || 'Acceso denegado.');

                const { masterPlaylist, showAds } = resJson.data;

                if (!masterPlaylist) throw new Error('Video no disponible o no procesado.');
                
                setStreamSrc(masterPlaylist);
                setShowAds(!!showAds);
            } catch (err: any) {
                setError(err.message);
            }
        };

        requestAccess();
    }, [content, currentEpisode]);

    // 3b. Reward tokens for watching (fires once when stream becomes available)
    useEffect(() => {
        // Token rewards not supported in flex-streaming
    }, [streamSrc]);

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

                const res = await userFetch(`${API_ROUTES.HISTORY.BASE}/${watchId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Profile-Id': profileId,
                    },
                });

                if (res.ok) {
                    const resJson = await res.json();
                    if (resJson.success && resJson.data?.progressSeconds) {
                        if (!localProgress || resJson.data.progressSeconds > parseInt(localProgress) + 5) {
                            setInitialTime(resJson.data.progressSeconds);
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

            await userFetch(API_ROUTES.HISTORY.PROGRESS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Profile-Id': profileId,
                },
                body: JSON.stringify({
                    contentId: content.id,
                    episodeId: currentEpisode?.id,
                    progressSeconds: Math.floor(currentTime),
                    durationSeconds: Math.floor(duration),
                }),
            });
        } catch (e) {
            console.error('Error saving progress:', e);
        }
    };

    const handleNextEpisode = () => {
        if (currentEpisodeIndex < 0 || !hasNextEpisode) return;
        const next = allEpisodes[currentEpisodeIndex + 1];
        router.push(`/film/${id}/watch?episodeId=${next.id}`);
    };

    const handlePrevEpisode = () => {
        if (currentEpisodeIndex <= 0 || !hasPrevEpisode) return;
        const prev = allEpisodes[currentEpisodeIndex - 1];
        router.push(`/film/${id}/watch?episodeId=${prev.id}`);
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
        <div className="fixed inset-0 z-[9999] bg-black overflow-hidden group">
            <VideoPlayer
                src={streamSrc}
                title={currentEpisode
                    ? `${content.translations?.[0]?.title || content.title} — T${currentEpisode.seasonNumber}E${currentEpisode.number}: ${currentEpisode.translations?.[0]?.title || currentEpisode.title || ''}`
                    : (content.translations?.[0]?.title || content.title)
                }
                initialTime={initialTime}
                externalSubtitles={subtitles}
                onProgressUpdate={handleProgressUpdate}
                onEnded={handleNextEpisode}
                onNextEpisode={hasNextEpisode ? handleNextEpisode : undefined}
                onPrevEpisode={hasPrevEpisode ? handlePrevEpisode : undefined}
                hasNextEpisode={hasNextEpisode}
                hasPrevEpisode={hasPrevEpisode}
                episodes={content.seasons || []}
                currentEpisodeId={currentEpisode?.id}
                onEpisodeSelect={(episodeId) => {
                    router.push(`/film/${id}/watch?episodeId=${episodeId}`);
                }}
                onBack={() => router.push(`/film/${id}`)}
                showAds={showAds}
            />
        </div>
    );
}
