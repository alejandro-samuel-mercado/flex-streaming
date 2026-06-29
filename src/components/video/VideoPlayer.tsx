'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, ArrowLeft, RotateCw, ChevronLeft, ChevronRight, List, X, Headphones, MessageSquare, Lock, Maximize2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { parseVTT, SubtitleCue } from '@/lib/vtt-parser';

interface VideoPlayerProps {
    src: string; // The .m3u8 URL
    title?: string;
    poster?: string;
    initialTime?: number;
    externalSubtitles?: Array<{
        url: string;
        language: string;
        label: string;
    }>;
    onProgressUpdate?: (currentTime: number, duration: number) => void;
    onEnded?: () => void;
    onNextEpisode?: () => void;
    onPrevEpisode?: () => void;
    hasNextEpisode?: boolean;
    hasPrevEpisode?: boolean;
    onShowEpisodes?: () => void;
    episodes?: any[]; // Seasons data
    onEpisodeSelect?: (episodeId: string) => void;
    onBack?: () => void;
    currentEpisodeId?: string;
}

export default function VideoPlayer({
    src, title, poster, initialTime = 0, externalSubtitles = [],
    onProgressUpdate, onEnded, onNextEpisode, onPrevEpisode,
    hasNextEpisode, hasPrevEpisode, onShowEpisodes,
    episodes = [], onEpisodeSelect, onBack, currentEpisodeId
}: VideoPlayerProps) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isLocked, setIsLocked] = useState(false);

    const [audioTracks, setAudioTracks] = useState<any[]>([]);
    const [currentAudio, setCurrentAudio] = useState(-1);
    const [subtitleTracks, setSubtitleTracks] = useState<any[]>([]);
    const [currentSubtitle, setCurrentSubtitle] = useState(-1);
    const [isAudioMenuOpen, setIsAudioMenuOpen] = useState(false);
    const [isSubtitleMenuOpen, setIsSubtitleMenuOpen] = useState(false);
    const [showEpisodesSidebar, setShowEpisodesSidebar] = useState(false);

    const [levels, setLevels] = useState<any[]>([]);
    const [currentLevel, setCurrentLevel] = useState(-1);
    const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

    // Custom Subtitles State
    const [activeCues, setActiveCues] = useState<SubtitleCue[]>([]);
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);

    const hlsRef = useRef<any>(null);
    const hasSavedInitialProgressRef = useRef(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastProgressTimeRef = useRef<number>(0);
    const lastTimeUpdateRef = useRef<number>(0);
    const initialTimeSetRef = useRef(false);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    const [isBuffering, setIsBuffering] = useState(true);
    const [showLoading, setShowLoading] = useState(true);
    const [loadingStats, setLoadingStats] = useState({ loaded: 0, total: 0, speed: 0 });

    useEffect(() => {
        const acquireWakeLock = async () => {
            if (!('wakeLock' in navigator)) return;
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn('[VideoPlayer] Wake lock failed:', err);
            }
        };
        const releaseWakeLock = async () => {
            if (wakeLockRef.current) {
                try { await wakeLockRef.current.release(); } catch { }
                wakeLockRef.current = null;
            }
        };
        if (isPlaying) acquireWakeLock();
        else releaseWakeLock();
        return () => { releaseWakeLock(); };
    }, [isPlaying]);

    useEffect(() => {
        if (externalSubtitles && externalSubtitles.length > 0) {
            setSubtitleTracks(prev => {
                const hlsSubs = prev.filter(s => s.type === 'HLS');
                const extSubs = externalSubtitles.map((s, i) => ({
                    id: `ext-${i}`,
                    name: s.label,
                    lang: s.language,
                    url: s.url,
                    type: 'EXTERNAL'
                }));
                return [...hlsSubs, ...extSubs];
            });
        }
    }, [externalSubtitles]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        let hls: Hls | null = null;
        const handleLoadedMetadata = () => {
            if (!initialTimeSetRef.current) {
                console.log('🕒 [VideoPlayer] Metadata loaded, seeking to:', initialTime);
                video.currentTime = initialTime;
                initialTimeSetRef.current = true;
            }
        };
        video.addEventListener('loadedmetadata', handleLoadedMetadata);

        if (Hls.isSupported()) {
            hls = new Hls({
                capLevelToPlayerSize: true,
                autoStartLoad: true,
                startPosition: initialTime > 0 ? initialTime : -1,
                startLevel: 0, // Force lowest quality for instantaneous start
                maxBufferLength: 15, // Reduce initial aggressive buffering
                maxMaxBufferLength: 30,
                maxBufferSize: 30 * 1024 * 1024,
                xhrSetup: (xhr, url) => {
                    try {
                        const masterUrl = new URL(src, window.location.origin);
                        const token = masterUrl.searchParams.get('token');
                        if (token && !url.includes('token=')) {
                            const newUrl = new URL(url, masterUrl.origin);
                            newUrl.searchParams.set('token', token);
                            xhr.open('GET', newUrl.toString(), true);
                        }
                    } catch { }
                }
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setAudioTracks(hls?.audioTracks || []);
                setCurrentAudio(hls?.audioTrack ?? -1);
                const hlsSubs = (hls?.subtitleTracks || []).map(s => ({ ...s, type: 'HLS' }));
                setSubtitleTracks(prev => {
                    const extSubs = prev.filter(s => s.type === 'EXTERNAL');
                    return [...hlsSubs, ...extSubs];
                });
                setCurrentSubtitle(hls?.subtitleTrack ?? -1);
                setLevels(hls?.levels || []);
                setCurrentLevel(hls?.currentLevel ?? -1);
            });

            hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
                setAudioTracks(data.audioTracks || []);
                setCurrentAudio(hls?.audioTrack ?? -1);
            });

            hls.on(Hls.Events.FRAG_LOADED, (_event, data) => {
                const stats = (data as any).stats;
                if (stats) {
                    setLoadingStats(prev => ({
                        loaded: prev.loaded + stats.loaded,
                        total: stats.total,
                        speed: stats.bw / 1024 / 1024
                    }));
                }
            });

            hls.on(Hls.Events.BUFFER_APPENDING as any, () => setIsBuffering(true));
            hls.on(Hls.Events.BUFFER_APPENDED as any, () => setIsBuffering(false));

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR: hls?.startLoad(); break;
                        case Hls.ErrorTypes.MEDIA_ERROR: hls?.recoverMediaError(); break;
                        default: hls?.destroy(); break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            if (hls) hls.destroy();
            initialTimeSetRef.current = false;
            setIsBuffering(true); // Show loading for next source
            setShowLoading(true);
        };
    }, [src]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || initialTime === 0 || initialTimeSetRef.current) return;
        const handleCanPlay = () => {
            if (!initialTimeSetRef.current) {
                video.currentTime = initialTime;
                initialTimeSetRef.current = true;
            }
        };
        if (video.readyState >= 1) handleCanPlay();
        else {
            video.addEventListener('loadedmetadata', handleCanPlay);
            return () => video.removeEventListener('loadedmetadata', handleCanPlay);
        }
    }, [initialTime, src]);

    // Debounce loading overlay to prevent flickering and deadlocks
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        // Only show loading if buffering while playing, or during the very first metadata load
        if (isBuffering) {
            timeout = setTimeout(() => setShowLoading(true), 300);
        } else {
            setShowLoading(false);
        }
        return () => clearTimeout(timeout);
    }, [isBuffering]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const togglePlay = () => {
        if (isLocked) return;
        if (isAudioMenuOpen || isSubtitleMenuOpen || isQualityMenuOpen) {
            setIsAudioMenuOpen(false);
            setIsSubtitleMenuOpen(false);
            setIsQualityMenuOpen(false);
            return;
        }
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else {
                videoRef.current.play();
                // Initial progress save
                if (!hasSavedInitialProgressRef.current && onProgressUpdate) {
                    hasSavedInitialProgressRef.current = true;
                    onProgressUpdate(videoRef.current.currentTime, videoRef.current.duration);
                    lastProgressTimeRef.current = Date.now();
                }
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const v = videoRef.current;
        const now = Date.now();
        if (now - lastTimeUpdateRef.current >= 1000) {
            lastTimeUpdateRef.current = now;
            setCurrentTime(v.currentTime);
            setDuration(v.duration);
            setProgress((v.currentTime / v.duration) * 100);
        }
        if (onProgressUpdate && now - lastProgressTimeRef.current > 5000) {
            lastProgressTimeRef.current = now;
            onProgressUpdate(v.currentTime, v.duration);
        }
    };

    const skip = (seconds: number) => {
        if (isLocked || !videoRef.current) return;
        videoRef.current.currentTime += seconds;
        // Save immediately after skip
        if (onProgressUpdate) onProgressUpdate(videoRef.current.currentTime, videoRef.current.duration);
    };

    useEffect(() => {
        return () => {
            if (videoRef.current && onProgressUpdate) {
                onProgressUpdate(videoRef.current.currentTime, videoRef.current.duration);
            }
        };
    }, []);

    const formatTime = (time: number) => {
        if (isNaN(time)) return '00:00';
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    useEffect(() => {
        const loadSubtitle = async () => {
            const track = subtitleTracks[currentSubtitle];
            if (track?.type === 'EXTERNAL' && track.url) {
                try {
                    const res = await fetch(track.url);
                    const text = await res.text();
                    setActiveCues(parseVTT(text));
                } catch { }
            } else setActiveCues([]);
        };
        loadSubtitle();
    }, [currentSubtitle, subtitleTracks]);

    useEffect(() => {
        if (activeCues.length === 0) return;
        const cue = activeCues.find(c => currentTime >= c.start && currentTime <= c.end);
        if (cue !== currentCue) setCurrentCue(cue || null);
    }, [currentTime, activeCues, currentCue]);

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = time;
            setProgress(parseFloat(e.target.value));
        }
    };

    const handleMouseMove = () => {
        setIsControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setIsControlsVisible(false);
        }, 3000);
    };

    const handleFullscreen = () => {
        if (isLocked) return;
        const el = videoRef.current?.parentElement;
        if (!el) return;
        if (!document.fullscreenElement) el.requestFullscreen();
        else document.exitFullscreen();
    };

    return (
        <div
            className={`player-container bg-black relative w-full h-full overflow-hidden group/player ${isControlsVisible ? 'controls-visible' : ''}`}
            onMouseMove={handleMouseMove}
            onClick={togglePlay}
        >
            <video
                ref={videoRef}
                poster={poster}
                autoPlay
                crossOrigin="anonymous"
                className="w-full h-full object-contain pointer-events-none"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => onEnded?.()}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => {
                    setIsBuffering(false);
                    videoRef.current?.play().catch(() => { }); // Try to force play if autoplay blocked
                }}
                onLoadedData={() => setIsBuffering(false)}
            />



            {/* Subtitles Overlay */}
            {currentCue && !isLocked && (
                <div className="absolute bottom-[10%] left-0 right-0 flex justify-center pointer-events-none z-[100] px-10">
                    <div className="bg-black/60 px-6 py-2 rounded-xl text-center backdrop-blur-md border border-white/10">
                        <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">{currentCue.text}</p>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 !p-8 flex items-center justify-between transition-all duration-700 z-[110] ${isControlsVisible && !isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
                <div className="flex items-center !gap-6">
                    <button onClick={(e) => { e.stopPropagation(); if (onBack) onBack(); else router.back(); }} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-purple-400 mb-1 block">Reproduciendo</span>
                        <h1 className="text-xl font-black text-white uppercase italic tracking-tight">{title || 'Cargando...'}</h1>
                    </div>
                </div>

                <div className="flex items-center !gap-4">
                    {(onShowEpisodes || (episodes.length > 0)) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onShowEpisodes) onShowEpisodes();
                                else setShowEpisodesSidebar(true);
                            }}
                            className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-colors"
                        >
                            <List size={16} /> Episodios
                        </button>
                    )}
                </div>
            </div>

            {/* Center Controls */}
            {!isLocked && isControlsVisible && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <div className="flex items-center !gap-12 pointer-events-auto">
                        <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-white/40 hover:text-white transition-all hover:scale-110">
                            <RotateCcw size={40} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all">
                            {isPlaying ? <Pause size={40} fill="white" /> : <Play size={40} fill="white" className="ml-1" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-white/40 hover:text-white transition-all hover:scale-110">
                            <RotateCw size={40} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Quality Menu ── */}
            {isQualityMenuOpen && (
                <div className="absolute bottom-36 !right-8 z-[200] w-72 bg-black/85 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between !px-5 !py-3 border-b border-white/10">
                        <span className="text-xs font-black text-white/60 uppercase tracking-[3px]">Calidad</span>
                        <button onClick={() => setIsQualityMenuOpen(false)} className="text-white/40 hover:text-white !p-1"><X size={16} /></button>
                    </div>
                    <div className="!py-2 max-h-64 overflow-y-auto">
                        <button onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = -1; setCurrentLevel(-1); setIsQualityMenuOpen(false); }}
                            className={`w-full flex items-center justify-between !px-5 !py-3 text-sm text-left transition-colors ${currentLevel === -1 ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                            <span className="font-semibold">Auto</span>
                            {currentLevel === -1 && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                        </button>
                        {levels.map((level, i) => (
                            <button key={i} onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = i; setCurrentLevel(i); setIsQualityMenuOpen(false); }}
                                className={`w-full flex items-center justify-between !px-5 !py-3 text-sm text-left transition-colors ${currentLevel === i ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                                <span className="font-semibold">{level.height}p</span>
                                {currentLevel === i && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Audio Menu ── */}
            {isAudioMenuOpen && (
                <div className="absolute bottom-36 !right-8 z-[200] w-72 bg-black/85 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between !px-5 !py-3 border-b border-white/10">
                        <span className="text-xs font-black text-white/60 uppercase tracking-[3px]">Idioma Audio</span>
                        <button onClick={() => setIsAudioMenuOpen(false)} className="text-white/40 hover:text-white !p-1"><X size={16} /></button>
                    </div>
                    <div className="!py-2 max-h-64 overflow-y-auto">
                        {audioTracks.length === 0 ? (
                            <button onClick={() => setIsAudioMenuOpen(false)}
                                className={`w-full flex items-center justify-between !px-5 !py-3 text-sm text-left transition-colors bg-purple-500/20 text-purple-300`}>
                                <span className="font-semibold">Audio Predeterminado</span>
                                <div className="w-2 h-2 rounded-full bg-purple-400" />
                            </button>
                        ) : (
                            audioTracks.map((track, i) => (
                                <button key={i} onClick={() => { if (hlsRef.current) hlsRef.current.audioTrack = i; setCurrentAudio(i); setIsAudioMenuOpen(false); }}
                                    className={`w-full flex items-center justify-between !px-5 !py-3 text-sm text-left transition-colors ${currentAudio === i ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                                    <span className="font-semibold">{track.name || track.lang || `Pista ${i + 1}`}</span>
                                    {currentAudio === i && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ── Subtitle Menu ── */}
            {isSubtitleMenuOpen && (
                <div className="absolute bottom-36 !right-8 z-[200] w-72 bg-black/85 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between !px-5 !py-3 border-b border-white/10">
                        <span className="text-xs font-black text-white/60 uppercase tracking-[3px]">Subtítulos</span>
                        <button onClick={() => setIsSubtitleMenuOpen(false)} className="text-white/40 hover:text-white !p-1"><X size={16} /></button>
                    </div>
                    <div className="!py-2 max-h-64 overflow-y-auto">
                        <button onClick={() => { 
                                setCurrentSubtitle(-1); 
                                setActiveCues([]); 
                                setCurrentCue(null); 
                                if (hlsRef.current) {
                                    hlsRef.current.subtitleTrack = -1;
                                    hlsRef.current.subtitleDisplay = false;
                                }
                                setIsSubtitleMenuOpen(false); 
                            }}
                            className={`w-full flex items-center justify-between !px-5 !py-3 text-sm text-left transition-colors ${currentSubtitle === -1 ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                            <span className="font-semibold">Desactivados</span>
                            {currentSubtitle === -1 && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                        </button>
                        {subtitleTracks.map((track, i) => (
                            <button key={i} onClick={() => {
                                setCurrentSubtitle(i);
                                setActiveCues([]); // Clear previous cues
                                setCurrentCue(null);
                                if (track.type === 'HLS' && hlsRef.current) {
                                    hlsRef.current.subtitleDisplay = true; // Must be set BEFORE setting the track!
                                    hlsRef.current.subtitleTrack = i;
                                }
                                setIsSubtitleMenuOpen(false);
                            }}
                                className={`w-full flex items-center justify-between !px-5 !py-3 text-sm text-left transition-colors ${currentSubtitle === i ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                                <span className="font-semibold">{track.name || track.lang || `Subtítulo ${i + 1}`}</span>
                                {currentSubtitle === i && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom Controls */}
            <div className={`absolute bottom-0 left-0 right-0 transition-all duration-500 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-[110] ${isControlsVisible && !isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`} onClick={e => e.stopPropagation()}>
                <div className="flex flex-col !gap-3 !px-4 md:!px-8 !pb-4 md:!pb-8 !pt-8 md:!pt-16">

                    {/* ROW 1 — Progress bar + time */}
                    <div className="flex items-center !gap-2 md:!gap-4">
                        <span className="text-[10px] md:text-xs font-mono text-white/60 select-none shrink-0">
                            <span className="text-white font-bold">{formatTime(currentTime)}</span>
                            <span className="!mx-1 text-white/30">/</span>
                            {formatTime(duration)}
                        </span>
                        <div className="relative flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group/progress">
                            <div className="absolute top-0 left-0 h-full bg-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.7)] rounded-full pointer-events-none" style={{ width: `${progress}%` }} />
                            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none" style={{ left: `calc(${progress}% - 8px)` }} />
                            <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    {/* ROW 2 — All buttons */}
                    <div className="flex items-center justify-between">

                        {/* LEFT: Restart · Prev · Next · Volume */}
                        <div className="flex items-center !gap-4 md:!gap-8">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (videoRef.current) videoRef.current.currentTime = 0; }}
                                title="Reiniciar"
                                className="text-white/60 hover:text-white transition-all hover:scale-110 hidden sm:block"
                            >
                                <RotateCcw size={24} className="hidden md:block" />
                                <RotateCcw size={18} className="block md:hidden" />
                            </button>

                            {hasPrevEpisode && (
                                <button onClick={(e) => { e.stopPropagation(); onPrevEpisode?.(); }} title="Episodio anterior"
                                    className="text-white/60 hover:text-white transition-all hover:scale-110">
                                    <ChevronLeft size={32} />
                                </button>
                            )}

                            {hasNextEpisode && (
                                <button onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }} title="Siguiente episodio"
                                    className="text-white/60 hover:text-white transition-all hover:scale-110">
                                    <ChevronRight size={32} />
                                </button>
                            )}

                            <div className="flex items-center group/vol">
                                <button onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white transition-all hover:scale-110">
                                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 md:w-7 md:h-7" /> : <Volume2 className="w-5 h-5 md:w-7 md:h-7" />}
                                </button>
                                <div className="w-0 overflow-hidden group-hover/vol:w-20 md:group-hover/vol:w-28 group-hover/vol:!ml-4 transition-all duration-300 flex items-center h-8">
                                    <input
                                        type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume}
                                        onChange={(e) => { setVolume(parseFloat(e.target.value)); if (isMuted) setIsMuted(false); }}
                                        className="w-full accent-purple-500 !h-1.5 bg-white/10 rounded-full cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Audio · Subs · Fullscreen */}
                        <div className="flex items-center !gap-4 md:!gap-8">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsSubtitleMenuOpen(false); setIsAudioMenuOpen(!isAudioMenuOpen); setIsQualityMenuOpen(false); }}
                                className={`flex flex-col items-center !gap-1 transition-colors ${isAudioMenuOpen ? 'text-purple-400' : 'text-white/60 hover:text-white'}`}
                            >
                                <Headphones className="w-5 h-5 md:w-7 md:h-7" />
                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:block">Audio</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsAudioMenuOpen(false); setIsSubtitleMenuOpen(!isSubtitleMenuOpen); setIsQualityMenuOpen(false); }}
                                className={`flex flex-col items-center !gap-1 transition-colors ${isSubtitleMenuOpen ? 'text-purple-400' : 'text-white/60 hover:text-white'}`}
                            >
                                <MessageSquare className="w-5 h-5 md:w-7 md:h-7" />
                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:block">Subs</span>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsAudioMenuOpen(false); setIsSubtitleMenuOpen(false); setIsQualityMenuOpen(!isQualityMenuOpen); }}
                                className={`flex flex-col items-center !gap-1 transition-colors ${isQualityMenuOpen ? 'text-purple-400' : 'text-white/60 hover:text-white'}`}
                            >
                                <Settings className="w-5 h-5 md:w-7 md:h-7" />
                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest hidden sm:block">Calidad</span>
                            </button>
                            <button onClick={handleFullscreen} className="text-white/60 hover:text-white transition-all hover:scale-110">
                                <Maximize2 className="w-5 h-5 md:w-7 md:h-7" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Internal Sidebar */}
            {showEpisodesSidebar && episodes.length > 0 && (
                <div className="absolute inset-y-0 right-0 w-full max-w-[380px] bg-black/65 backdrop-blur-2xl border-l border-white/10 z-[200] !p-8 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center !mb-8">
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Episodios</h2>
                        <button onClick={() => setShowEpisodesSidebar(false)} className="text-white/40 hover:text-white !p-2">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex flex-col !gap-6">
                        {episodes.map((s: any) => (
                            <div key={s.id}>
                                <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[4px] !mb-3 opacity-60 border-b border-purple-500/20 !pb-2">Temporada {s.number}</h3>
                                <div className="flex flex-col !gap-2">
                                    {s.episodes?.map((e: any) => (
                                        <button
                                            key={e.id}
                                            onClick={() => {
                                                setShowEpisodesSidebar(false);
                                                onEpisodeSelect?.(e.id);
                                            }}
                                            className={`w-full !p-3 rounded-xl border transition-all text-left flex items-center !gap-3 ${(currentEpisodeId ? currentEpisodeId === e.id : false) ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${(currentEpisodeId ? currentEpisodeId === e.id : false) ? 'bg-white text-black' : 'bg-white/5 text-white/40'}`}>{e.number}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{e.translations?.[0]?.title || `Episodio ${e.number}`}</p>
                                                {!!e.duration && <span className="text-[10px] text-white/30 uppercase">{e.duration} min</span>}
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
