'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import { API_ROUTES, API_ORIGIN } from '@/lib/api-routes';

interface ContentData {
  id: string;
  type: 'MOVIE' | 'SERIES';
  status?: string;
  translations: { title: string; description: string }[];
  videoFiles: {
    id: string;
    masterPlaylist: string;
    status: string;
    subtitleTracks?: {
      id: string;
      language: string;
      label: string;
      url: string;
    }[];
  }[];
}

// Derive backend origin once at module level
const backendUrl = API_ORIGIN;

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialTime, setInitialTime] = useState<number>(0);
  // Authenticated HLS URL (built after receiving the signed token)
  const [streamSrc, setStreamSrc] = useState<string | null>(null);

  // ── 1. Fetch content metadata ─────────────────────────────────────────────
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

        if (!data.videoFiles || data.videoFiles.length === 0) {
          if (data.status === 'PENDING' || data.status === 'PROCESSING' || data.status === 'QUEUED') {
             setContent(data);
             setLoading(false);
             return;
          }
          throw new Error('Este contenido no tiene videos disponibles para reproducir.');
        }

        setContent(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  // ── 2. Request a signed streaming token ───────────────────────────────────
  // This MUST happen before loading the HLS manifest — otherwise the
  // streaming endpoint returns 401 and the player gets no video at all.
  useEffect(() => {
    if (!content || !content.videoFiles || content.videoFiles.length === 0) return;

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
          body: JSON.stringify({ contentId: content.id }),
        });

        if (!res.ok) throw new Error('No se pudo obtener acceso al video.');
        const resJson = await res.json();
        if (!resJson.success) throw new Error(resJson.error || 'Acceso denegado.');

        const { token: signedToken, videoFileId } = resJson.data;

        // Construct the token-authenticated HLS URL
        const hlsUrl = `${backendUrl}/api/stream/hls/${videoFileId}/master.m3u8?token=${signedToken}`;
        setStreamSrc(hlsUrl);
      } catch (err: any) {
        setError(err.message);
      }
    };

    requestAccess();
  }, [content]);

  // ── 3. Restore watch progress (background, does NOT block playback) ───────
  useEffect(() => {
    if (!content) return;

    const fetchHistory = async () => {
      try {
        // LocalStorage first — instant resume
        const localProgress = localStorage.getItem(`watch_progress_${content.id}`);
        if (localProgress) {
          setInitialTime(parseInt(localProgress));
        }

        const token = localStorage.getItem('accessToken');
        const profileId = localStorage.getItem('profileId');
        if (!token || !profileId) return;

        // API fetch for cross-device sync
        const res = await fetch(`${API_ROUTES.HISTORY.BASE}/${content.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Profile-Id': profileId,
          },
        });

        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success && resJson.data?.progress) {
            // Only override local if API is significantly ahead
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
  }, [content?.id]);

  // ── 4. Progress saving ────────────────────────────────────────────────────
  const handleProgressUpdate = async (currentTime: number, duration: number) => {
    if (!content || duration === 0) return;

    // LocalStorage — zero-latency, works offline
    localStorage.setItem(`watch_progress_${content.id}`, Math.floor(currentTime).toString());

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
          progress: Math.floor(currentTime),
          duration: Math.floor(duration),
        }),
      });
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  };

  // ── Render states ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4" size={48} color="var(--color-primary)" />
        <p className="text-xl font-medium">Preparando tu función...</p>
      </div>
    );
  }

  if (content && (!content.videoFiles || content.videoFiles.length === 0)) {
    return (
      <div className="h-screen w-full bg-[#030612] flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle size={64} className="text-[var(--color-primary)] mb-6" />
        <h1 className="text-4xl font-black mb-4 uppercase italic">¡Próximamente!</h1>
        <p className="text-gray-400 mb-8 max-w-md text-lg">Este contenido aún se está preparando o estará disponible muy pronto en la plataforma.</p>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-[var(--color-primary)] text-black font-black rounded-xl hover:scale-105 transition uppercase"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertCircle size={64} className="text-[var(--color-primary)] mb-6" />
        <h1 className="text-3xl font-bold mb-4">¡Ups! Algo salió mal</h1>
        <p className="text-gray-400 mb-8 max-w-md">{error || 'No se encontró el video.'}</p>
        <button
          onClick={() => router.back()}
          className="px-8 py-3 bg-white text-black font-bold rounded-md hover:bg-gray-200 transition"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  // Brief loader while the signed token is being fetched
  if (!streamSrc) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4" size={48} color="var(--color-primary)" />
        <p className="text-xl font-medium">Verificando acceso...</p>
      </div>
    );
  }

  // Map subtitles to absolute URLs
  const videoFile = content.videoFiles.find(v => v.status === 'COMPLETED') || content.videoFiles[0];
  const subtitles = videoFile.subtitleTracks?.map(s => ({
    url: s.url.startsWith('http') ? s.url : `${backendUrl}${s.url.startsWith('/') ? '' : '/'}${s.url}`,
    language: s.language,
    label: s.label,
  })) || [];

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      <VideoPlayer
        src={streamSrc}
        title={content.translations[0]?.title}
        initialTime={initialTime}
        externalSubtitles={subtitles}
        onProgressUpdate={handleProgressUpdate}
        onEnded={() => console.log('Video terminado')}
      />
    </div>
  );
}
