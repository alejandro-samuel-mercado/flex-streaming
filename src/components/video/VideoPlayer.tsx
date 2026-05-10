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
}

export default function VideoPlayer({
    src, title, poster, initialTime = 0, externalSubtitles = [],
    onProgressUpdate, onEnded, onNextEpisode, onPrevEpisode,
    hasNextEpisode, hasPrevEpisode, onShowEpisodes,
    episodes = [], onEpisodeSelect, onBack
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

    const hlsRef = useRef<Hls | null>(null);
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
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                maxBufferSize: 60 * 1024 * 1024,
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

    const togglePlay = () => {
        if (isLocked) return;
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
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
        if (onProgressUpdate && now - lastProgressTimeRef.current > 10000) {
            lastProgressTimeRef.current = now;
            onProgressUpdate(v.currentTime, v.duration);
        }
    };

    const skip = (seconds: number) => {
        if (isLocked || !videoRef.current) return;
        videoRef.current.currentTime += seconds;
    };

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
                crossOrigin="anonymous"
                className="w-full h-full object-contain pointer-events-none"
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => onEnded?.()}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onCanPlay={() => setIsBuffering(false)}
                onLoadedData={() => setIsBuffering(false)}
            />

            {/* Cinematic Loading Overlay */}
            {showLoading && (
                <div className="absolute inset-0 z-[150] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-500 pointer-events-none">
                    <div className="relative w-24 h-24 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 animate-spin shadow-[0_0_20px_rgba(168,85,247,0.5)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Nuba</span>
                        </div>
                    </div>
                    <div className="text-center animate-pulse">

                        <div className="flex items-center gap-4 text-[10px] font-mono text-white/50">
                            {loadingStats.loaded > 0 && <span>{(loadingStats.loaded / 1024 / 1024).toFixed(1)}MB cargados</span>}
                            {loadingStats.speed > 0 && <span className="text-purple-400">{loadingStats.speed.toFixed(1)} Mbps</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Subtitles Overlay */}
            {currentCue && !isLocked && (
                <div className="absolute bottom-[10%] left-0 right-0 flex justify-center pointer-events-none z-[100] px-10">
                    <div className="bg-black/60 px-6 py-2 rounded-xl text-center backdrop-blur-md border border-white/10">
                        <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">{currentCue.text}</p>
                    </div>
                </div>
            )}

            {/* Top Bar */}
            <div className={`absolute top-0 left-0 right-0 p-8 flex items-center justify-between transition-all duration-700 z-[110] ${isControlsVisible && !isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
                <div className="flex items-center gap-6">
                    <button onClick={(e) => { e.stopPropagation(); if (onBack) onBack(); else router.back(); }} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[4px] text-purple-400 mb-1 block">Reproduciendo</span>
                        <h1 className="text-xl font-black text-white uppercase italic tracking-tight">{title || 'Cargando...'}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {(hasNextEpisode || hasPrevEpisode) && (
                        <div className="flex bg-black/40 backdrop-blur-xl rounded-full border border-white/10 p-1">
                            {hasPrevEpisode && (
                                <button onClick={(e) => { e.stopPropagation(); onPrevEpisode?.(); }} className="p-2 text-white/50 hover:text-white transition-colors">
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            {hasNextEpisode && (
                                <button onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }} className="p-2 text-white/50 hover:text-white transition-colors">
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </div>
                    )}
                    {(onShowEpisodes || (episodes.length > 0)) && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onShowEpisodes) onShowEpisodes();
                                else setShowEpisodesSidebar(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20"
                        >
                            <List size={16} /> Episodios
                        </button>
                    )}
                </div>
            </div>

            {/* Center Controls */}
            {!isLocked && isControlsVisible && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <div className="flex items-center gap-12 pointer-events-auto">
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

            {/* Bottom Controls */}
            <div className={`absolute bottom-0 left-0 right-0 p-8 transition-all duration-500 bg-gradient-to-t from-black/90 to-transparent z-[110] ${isControlsVisible && !isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`} onClick={e => e.stopPropagation()}>
                <div className="flex flex-col gap-4">
                    {/* Progress Bar */}
                    <div className="relative h-1.5 w-full bg-white/10 rounded-full overflow-hidden group/progress cursor-pointer">
                        <div className="absolute top-0 left-0 h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all" style={{ width: `${progress}%` }} />
                        <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-8">
                            <div className="text-xs font-mono text-white/50">
                                <span className="text-white font-bold">{formatTime(currentTime)}</span> / {formatTime(duration)}
                            </div>
                            <div className="flex items-center gap-4 group/vol">
                                <button onClick={() => setIsMuted(!isMuted)} className="text-white/40 hover:text-white transition-colors">
                                    {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                                <input type="range" min="0" max="1" step="0.1" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-0 group-hover/vol:w-24 transition-all accent-purple-500 h-1 bg-white/10 rounded-full" />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            {/* Menus like Quality, Audio, etc would go here */}
                            <button onClick={() => setIsAudioMenuOpen(!isAudioMenuOpen)} className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
                                <Headphones size={20} />
                                <span className="text-[8px] font-black uppercase">Audio</span>
                            </button>
                            <button onClick={() => setIsSubtitleMenuOpen(!isSubtitleMenuOpen)} className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors">
                                <MessageSquare size={20} />
                                <span className="text-[8px] font-black uppercase">Subs</span>
                            </button>
                            <button onClick={handleFullscreen} className="text-white/40 hover:text-white transition-colors">
                                <Maximize2 size={24} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Internal Sidebar */}
            {showEpisodesSidebar && episodes.length > 0 && (
                <div className="absolute inset-y-0 right-0 w-full max-w-[400px] bg-black/95 backdrop-blur-3xl border-l border-white/10 z-[200] p-10 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-500" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Episodios</h2>
                        <button onClick={() => setShowEpisodesSidebar(false)} className="text-white/40 hover:text-white p-2">
                            <X size={28} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-8">
                        {episodes.map((s: any) => (
                            <div key={s.id}>
                                <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[4px] mb-4 opacity-60 border-b border-purple-500/20 pb-2">Temporada {s.number}</h3>
                                <div className="flex flex-col gap-3">
                                    {s.episodes?.map((e: any) => (
                                        <button
                                            key={e.id}
                                            onClick={() => {
                                                setShowEpisodesSidebar(false);
                                                onEpisodeSelect?.(e.id);
                                            }}
                                            className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${title?.includes(`E${e.number}`) ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-black text-white/40">{e.number}</div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-white truncate">{e.translations?.[0]?.title || `Episodio ${e.number}`}</p>
                                                <span className="text-[10px] text-white/30 uppercase">{e.duration || '??'} MIN</span>
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
