'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import VideoPlayer from '../video/VideoPlayer';
import { API_ORIGIN } from '@/lib/api-routes';
interface TrailerModalProps {
    url: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function TrailerModal({ url, isOpen, onClose }: TrailerModalProps) {
    const [embedUrl, setEmbedUrl] = useState<string | null>(null);
    const [isDirectVideo, setIsDirectVideo] = useState(false);
    const [isHLS, setIsHLS] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setEmbedUrl(null);
            setIsDirectVideo(false);
            setIsHLS(false);
            return;
        }

        // Resolve local URL if it's a relative path
        let finalUrl = url;
        if (url.startsWith('/media/')) {
            const backendUrl = API_ORIGIN;
            finalUrl = `${backendUrl}${url}`;
        }

        // Parse YouTube
        const ytMatch = finalUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch && ytMatch[1]) {
            setEmbedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?rel=0`);
            setIsHLS(false);
            return;
        }

        // Parse Vimeo
        const vimeoMatch = finalUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/i);
        if (vimeoMatch && vimeoMatch[1]) {
            setEmbedUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}`);
            setIsHLS(false);
            return;
        }

        // Check if it is HLS
        if (finalUrl.includes('.m3u8')) {
            setEmbedUrl(finalUrl);
            setIsDirectVideo(true);
            setIsHLS(true);
            return;
        }

        // Assume direct video file (mp4, webm, etc.)
        setEmbedUrl(finalUrl);
        setIsDirectVideo(true);
        setIsHLS(false);

    }, [url, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5 animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-[110] w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-red-500 rounded-full text-white transition-colors"
                >
                    <X size={24} />
                </button>
                
                {isHLS ? (
                    <div className="w-full h-full">
                         <VideoPlayer src={embedUrl!} title="Tráiler" />
                    </div>
                ) : isDirectVideo ? (
                    <video
                        src={embedUrl!}
                        controls
                        className="w-full h-full object-contain"
                    />
                ) : embedUrl ? (
                    <iframe
                        src={embedUrl}
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50">
                        No se pudo cargar el tráiler.
                    </div>
                )}
            </div>
        </div>
    );
}
