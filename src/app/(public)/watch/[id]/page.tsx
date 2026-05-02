'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import VideoPlayer from '@/components/video/VideoPlayer';
import { API_ROUTES } from '@/lib/api-routes';

interface ContentData {
  id: string;
  type: 'MOVIE' | 'SERIES';
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

export default function WatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialTime, setInitialTime] = useState<number>(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);

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

  useEffect(() => {
    if (!content) return;

    const fetchHistory = async () => {
      try {
        const id = content.id;
        // 1. Check LocalStorage first (instant)
        const localProgress = localStorage.getItem(`watch_progress_${id}`);
        if (localProgress) {
            console.log('🕒 [WatchPage] Local storage found, resuming at:', localProgress);
            setInitialTime(parseInt(localProgress));
        }

        const token = localStorage.getItem('token');
        const profileId = localStorage.getItem('currentProfileId');
        if (!token || !profileId) {
            setHistoryLoaded(true);
            return;
        }

        // 2. Fetch from API (for sync)
        const res = await fetch(`${API_ROUTES.HISTORY.BASE}/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Profile-Id': profileId
          }
        });
        
        if (res.ok) {
          const resJson = await res.json();
          if (resJson.success && resJson.data && resJson.data.progress) {
             // Only update if API is significantly ahead or local is empty
             if (!localProgress || resJson.data.progress > parseInt(localProgress) + 5) {
                console.log('🕒 [WatchPage] API history found, updating to:', resJson.data.progress);
                setInitialTime(resJson.data.progress);
             }
          }
        }
      } catch (e) {
          console.error('History fetch error:', e);
      } finally {
          setHistoryLoaded(true);
      }
    };
    fetchHistory();
  }, [content?.id]);

  const handleProgressUpdate = async (currentTime: number, duration: number) => {
    if (!content || duration === 0) return;
    
    // 1. Save to LocalStorage (instant)
    localStorage.setItem(`watch_progress_${content.id}`, Math.floor(currentTime).toString());

    try {
        const token = localStorage.getItem('token');
        const profileId = localStorage.getItem('currentProfileId');
        if (!token || !profileId) return;

        // 2. Save to API (background)
        await fetch(`${API_ROUTES.HISTORY.BASE}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Profile-Id': profileId
          },
          body: JSON.stringify({
            contentId: content.id,
            progress: Math.floor(currentTime),
            duration: Math.floor(duration)
          })
        });
    } catch (e) {
        console.error('Error saving progress:', e);
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

  // Get the first completed video file
  const videoFile = content.videoFiles.find(v => v.status === 'COMPLETED') || content.videoFiles[0];
  
  // Format source URL (ensure it points to the backend)
  let backendUrl = 'http://localhost:4000';
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    backendUrl = new URL(apiUrl).origin;
  } catch (e) {}
  
  const videoSrc = videoFile.masterPlaylist.startsWith('http') 
    ? videoFile.masterPlaylist 
    : `${backendUrl}${videoFile.masterPlaylist.startsWith('/') ? '' : '/'}${videoFile.masterPlaylist}`;

  // Map subtitles for the player
  const subtitles = videoFile.subtitleTracks?.map(s => ({
    url: s.url.startsWith('http') ? s.url : `${backendUrl}${s.url.startsWith('/') ? '' : '/'}${s.url}`,
    language: s.language,
    label: s.label
  })) || [];

  if (!historyLoaded) {
     return (
       <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-white">
         <Loader2 className="animate-spin mb-4" size={48} color="var(--color-primary)" />
         <p className="text-xl font-medium">Restaurando sesión...</p>
       </div>
     );
  }

  return (
    <div className="h-screen w-full bg-black relative overflow-hidden">
      {/* Top Header — visible on hover */}
      <div className="absolute top-0 left-0 right-0 p-8 z-50 flex items-center gap-4 transition-opacity duration-300 opacity-0 hover:opacity-100 bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={() => router.back()}
          className="text-white hover:text-[var(--color-primary)] transition"
        >
          <ArrowLeft size={32} />
        </button>
        <h1 className="text-2xl font-bold text-white">
          Estás viendo: <span className="text-[var(--color-primary)]">{content.translations[0]?.title}</span>
        </h1>
      </div>

      <VideoPlayer 
        src={videoSrc}
        title={content.translations[0]?.title}
        initialTime={initialTime}
        externalSubtitles={subtitles}
        onProgressUpdate={handleProgressUpdate}
        onEnded={() => console.log('Video terminado')}
      />
    </div>
  );
}
