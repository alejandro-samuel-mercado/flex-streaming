'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, SkipBack, SkipForward, Lock, Unlock, MessageSquare, Headphones, ArrowLeft, RotateCw, ChevronLeft, ChevronRight, List } from 'lucide-react';
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
}

export default function VideoPlayer({ src, title, poster, initialTime = 0, externalSubtitles = [], onProgressUpdate, onEnded, onNextEpisode, onPrevEpisode, hasNextEpisode, hasPrevEpisode, onShowEpisodes }: VideoPlayerProps) {
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

    const [levels, setLevels] = useState<any[]>([]);
    const [currentLevel, setCurrentLevel] = useState(-1);
    const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

    // Custom Subtitles State
    const [activeCues, setActiveCues] = useState<SubtitleCue[]>([]);
    const [currentCue, setCurrentCue] = useState<SubtitleCue | null>(null);
    const [subtitleError, setSubtitleError] = useState<string | null>(null);

    const hlsRef = useRef<Hls | null>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastProgressTimeRef = useRef<number>(0);
    const lastTimeUpdateRef = useRef<number>(0); // Throttle timeupdate re-renders
    const initialTimeSetRef = useRef(false);
    const wakeLockRef = useRef<WakeLockSentinel | null>(null);

    // ── Screen Wake Lock ────────────────────────────────────────────────
    // Prevents the screen from turning off during playback.
    // Without this, the user's screen goes dark after a few minutes of inactivity
    // even though they're watching a movie.
    useEffect(() => {
        const acquireWakeLock = async () => {
            if (!('wakeLock' in navigator)) return; // Not supported — silent no-op
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) {
                // Wake lock request can fail (e.g., low battery mode)
                console.warn('[VideoPlayer] Wake lock request failed:', err);
            }
        };

        const releaseWakeLock = async () => {
            if (wakeLockRef.current) {
                try {
                    await wakeLockRef.current.release();
                } catch { /* already released */ }
                wakeLockRef.current = null;
            }
        };

        if (isPlaying) {
            acquireWakeLock();
        } else {
            releaseWakeLock();
        }

        return () => { releaseWakeLock(); };
    }, [isPlaying]);

    useEffect(() => {
        if (externalSubtitles && externalSubtitles.length > 0) {
            setSubtitleTracks(prev => {
                const hlsSubs = prev.filter(s => s.type === 'HLS'); // Keep original HLS subs if any
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
            if (initialTime > 0 && !initialTimeSetRef.current) {
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
                renderTextTracksNatively: true,
                // Buffer tuning for smooth playback
                maxBufferLength: 30,             // Buffer up to 30s ahead
                maxMaxBufferLength: 60,          // Allow up to 60s in good conditions
                maxBufferSize: 60 * 1000 * 1000, // 60MB max buffer size
                maxBufferHole: 0.5,              // Tolerate 0.5s gaps without stalling
                // ABR tuning for stability
                abrEwmaDefaultEstimate: 5000000, // Start assuming 5Mbps connection
                abrBandWidthFactor: 0.95,        // Conservative bandwidth estimation
                abrBandWidthUpFactor: 0.7,       // Slower to upgrade quality (avoids oscillation)
                // Low-latency is not needed for VOD
                lowLatencyMode: false,
                backBufferLength: 30,            // Keep 30s of back-buffer for rewind
                // Token propagation for signed URLs
                xhrSetup: (xhr, url) => {
                    try {
                        const masterUrl = new URL(src, window.location.origin);
                        const token = masterUrl.searchParams.get('token');
                        if (token && !url.includes('token=')) {
                            const newUrl = new URL(url, masterUrl.origin);
                            newUrl.searchParams.set('token', token);
                            xhr.open('GET', newUrl.toString(), true);
                        }
                    } catch (e) {
                        console.error('[VideoPlayer] Token propagation error:', e);
                    }
                }
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                console.log('📄 [VideoPlayer] Manifest parsed. Levels:', hls?.levels.length, 'Audios:', hls?.audioTracks.length);
                setAudioTracks(hls?.audioTracks || []);
                // Use ?? instead of || so that index 0 is not treated as falsy
                setCurrentAudio(hls?.audioTrack ?? -1);

                const hlsSubs = (hls?.subtitleTracks || []).map(s => ({ ...s, type: 'HLS' }));
                setSubtitleTracks(prev => {
                    const extSubs = prev.filter(s => s.type === 'EXTERNAL');
                    return [...hlsSubs, ...extSubs];
                });
                setCurrentSubtitle(hls?.subtitleTrack ?? -1);

                // Get available quality levels
                const availableLevels = hls?.levels || [];
                setLevels(availableLevels);
                setCurrentLevel(hls?.currentLevel ?? -1);
            });

            hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
                console.log('🔊 [VideoPlayer] Audio tracks updated:', data.audioTracks.length);
                setAudioTracks(data.audioTracks || []);
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    console.error('🔥 [VideoPlayer] Fatal HLS error:', data.type, data.details);
                    // Attempt automatic recovery instead of freezing
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.warn('🔄 [VideoPlayer] Network error — attempting recovery...');
                            hls?.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.warn('🔄 [VideoPlayer] Media error — attempting recovery...');
                            hls?.recoverMediaError();
                            break;
                        default:
                            // Unrecoverable — destroy and report
                            console.error('💀 [VideoPlayer] Unrecoverable HLS error. Destroying.');
                            hls?.destroy();
                            break;
                    }
                }
            });

            hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, () => {
                setCurrentAudio(hls?.audioTrack ?? -1);
            });

            hls.on(Hls.Events.SUBTITLE_TRACK_SWITCH, () => {
                setCurrentSubtitle(hls?.subtitleTrack ?? -1);
            });

            hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
                setCurrentLevel(data.level);
            });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        }

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            if (hls) hls.destroy();
        };
    }, [src]);

    // Separate effect for initial seeking
    useEffect(() => {
        const video = videoRef.current;
        if (!video || initialTime === 0 || initialTimeSetRef.current) return;

        const handleCanPlay = () => {
            if (!initialTimeSetRef.current) {
                console.log('🕒 [VideoPlayer] Seeking to initial time:', initialTime);
                video.currentTime = initialTime;
                initialTimeSetRef.current = true;
            }
        };

        if (video.readyState >= 1) {
            handleCanPlay();
        } else {
            video.addEventListener('loadedmetadata', handleCanPlay);
            return () => video.removeEventListener('loadedmetadata', handleCanPlay);
        }
    }, [initialTime]);

    const togglePlay = () => {
        if (isLocked) return;
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    // Throttled to max 1 React state update per second.
    // The browser fires timeupdate ~4x/sec — without throttling that's 3 setState × 4 = 12
    // re-renders/sec, which drains CPU and contributes to perceived low FPS in the video.
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const v = videoRef.current;

        const now = Date.now();
        // Update display state at most once per second
        if (now - lastTimeUpdateRef.current >= 1000) {
            lastTimeUpdateRef.current = now;
            setCurrentTime(v.currentTime);
            setDuration(v.duration);
            setProgress((v.currentTime / v.duration) * 100);
        }

        // Progress save callback — every 10 seconds
        if (onProgressUpdate && now - lastProgressTimeRef.current > 10000) {
            lastProgressTimeRef.current = now;
            onProgressUpdate(v.currentTime, v.duration);
        }
    };

    const skip = (seconds: number) => {
        if (isLocked) return;
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const restart = () => {
        if (isLocked) return;
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '00:00';
        const h = Math.floor(time / 3600);
        const m = Math.floor((time % 3600) / 60);
        const s = Math.floor(time % 60);
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
    };

    // Handle custom subtitle loading
    useEffect(() => {
        const loadSubtitle = async () => {
            const track = subtitleTracks[currentSubtitle];
            if (track?.type === 'EXTERNAL' && track.url) {
                try {
                    console.log('📥 [VideoPlayer] Fetching VTT:', track.url);
                    const res = await fetch(track.url);
                    if (!res.ok) throw new Error('Failed to fetch subtitle');
                    const text = await res.text();
                    const cues = parseVTT(text);
                    console.log(`📝 [VideoPlayer] Subtitle cues loaded: ${cues.length}`);
                    setActiveCues(cues);
                } catch (err) {
                    console.error('❌ [VideoPlayer] Error loading subtitle:', err);
                    setSubtitleError('Error al cargar subtítulos');
                }
            } else {
                setActiveCues([]);
                setCurrentCue(null);
            }
        };

        loadSubtitle();
    }, [currentSubtitle, subtitleTracks]);

    // Handle subtitle cue matching on timeupdate
    useEffect(() => {
        if (activeCues.length === 0) return;

        const cue = activeCues.find(c => currentTime >= c.start && currentTime <= c.end);
        if (cue !== currentCue) {
            setCurrentCue(cue || null);
        }
    }, [currentTime, activeCues, currentCue]);

    const changeAudio = (id: number) => {
        if (hlsRef.current) {
            console.log('🔊 [VideoPlayer] Switching to audio track:', id);
            hlsRef.current.audioTrack = id;
            setIsAudioMenuOpen(false);
        }
    };

    const changeLevel = (id: number) => {
        if (hlsRef.current) {
            console.log('🎬 [VideoPlayer] Switching to quality level:', id);
            hlsRef.current.currentLevel = id;
            setCurrentLevel(id);
            setIsQualityMenuOpen(false);
        }
    };

    const changeSubtitle = (id: number) => {
        console.log('📝 [VideoPlayer] Switching to subtitle track:', id);

        // Handle HLS internal tracks
        if (hlsRef.current) {
            // Find if this ID is an HLS track or External
            const track = subtitleTracks[id];
            if (track?.type === 'HLS') {
                hlsRef.current.subtitleTrack = id;
            } else {
                // If switching to external or disabling, disable HLS subs
                hlsRef.current.subtitleTrack = -1;
            }
        }

        // Handle External tracks via native TextTrack API if needed
        if (videoRef.current) {
            const tracks = videoRef.current.textTracks;
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = 'disabled';
            }

            const selectedTrack = subtitleTracks[id];
            if (selectedTrack?.type === 'EXTERNAL') {
                console.log('🔍 [VideoPlayer] Activating external track:', selectedTrack.name);
                // Find the track element and enable it
                const trackElements = videoRef.current.querySelectorAll('track');
                let found = false;
                trackElements.forEach((el: any) => {
                    if (el.label.trim().toLowerCase() === selectedTrack.name.trim().toLowerCase()) {
                        el.track.mode = 'showing';
                        found = true;
                    }
                });
                if (!found) console.warn('⚠️ [VideoPlayer] External track not found in DOM:', selectedTrack.name);
            }
        }

        setCurrentSubtitle(id);
        setIsSubtitleMenuOpen(false);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = time;
            setProgress(parseFloat(e.target.value));
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleMouseMove = () => {
        setIsControlsVisible(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setIsControlsVisible(false);
        }, 3000);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isLocked) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'f':
                    e.preventDefault();
                    handleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    toggleMute();
                    break;
                case 'arrowright':
                    skip(10);
                    break;
                case 'arrowleft':
                    skip(-10);
                    break;
                case 'arrowup':
                    e.preventDefault();
                    setVolume(prev => {
                        const v = Math.min(1, prev + 0.1);
                        if (videoRef.current) videoRef.current.volume = v;
                        return v;
                    });
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    setVolume(prev => {
                        const v = Math.max(0, prev - 0.1);
                        if (videoRef.current) videoRef.current.volume = v;
                        return v;
                    });
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, isLocked, volume]);

    const handleFullscreen = () => {
        if (isLocked) return;
        if (videoRef.current?.parentElement?.requestFullscreen) {
            if (!document.fullscreenElement) {
                videoRef.current.parentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    };

    const toggleLock = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLocked(!isLocked);
        if (!isLocked) {
            setIsControlsVisible(true);
        }
    };

    return (
        <div
            className={`player-container  ${isControlsVisible ? 'controls-visible' : ''} ${isLocked ? 'player--locked' : ''}`}
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
                onEnded={() => { onEnded?.(); }}
            />
            {/* Custom Subtitle Overlay */}
            {currentCue && !isLocked && (
                <div
                    className="absolute bottom-[8%] left-0 right-0 flex justify-center pointer-events-none z-[100] px-10"

                >
                    <div className="bg-black/10  p-2! rounded-2xl text-center animate-fadeIn">
                        <p className="text-white text-xl md:text-2xl font-medium leading-relaxed whitespace-pre-wrap">
                            {currentCue.text}
                        </p>
                    </div>
                </div>
            )}

            {/* Top Bar - Disney Style Refined */}
            {!isLocked && (
                <div className={`absolute top-0 left-0 right-0   flex items-center justify-between transition-all p-4! duration-700 z-[60] ${isControlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
                    <div className="flex items-center gap-8">
                        <button
                            onClick={(e) => { e.stopPropagation(); router.back(); }}
                            className="w-14 h-14 rounded-full bg-black/20 backdrop-blur-2xl border border-white/5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 hover:scale-110 hover:border-white/20 transition-all shadow-2xl"
                            title="Volver"
                        >
                            <ArrowLeft size={32} strokeWidth={2.5} />
                        </button>

                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[5px] text-[var(--color-primary)] mb-1 opacity-80">Estás viendo</span>
                            <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-2xl uppercase italic">
                                {title || 'Cargando...'}
                            </h1>
                        </div>
                    </div>

                    {/* Episode navigation buttons (top right, series only) */}
                    <div className="flex items-center gap-3">
                        {hasPrevEpisode && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onPrevEpisode?.(); }}
                                className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all text-sm font-bold"
                                title="Episodio anterior"
                            >
                                <ChevronLeft size={16} /> Anterior
                            </button>
                        )}
                        {hasNextEpisode && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onNextEpisode?.(); }}
                                className="flex items-center gap-2 bg-black/30 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all text-sm font-bold"
                                title="Siguiente episodio"
                            >
                                Siguiente <ChevronRight size={16} />
                            </button>
                        )}
                        {onShowEpisodes && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onShowEpisodes(); }}
                                className="flex items-center gap-2 bg-purple-600/90 hover:bg-purple-500 backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full text-white shadow-lg transition-all text-sm font-black uppercase tracking-wider"
                                title="Lista de episodios"
                            >
                                <List size={18} strokeWidth={3} /> Episodios
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Center Controls Overlay (Disney Style large play button) */}
            {!isLocked && isControlsVisible && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <div className="flex items-center gap-16 pointer-events-auto">
                        <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="text-white/60 hover:text-white transition-all hover:scale-110">
                            <RotateCcw size={48} strokeWidth={1.5} />
                            <span className="block text-[12px] font-black mt-2 text-center">10</span>
                        </button>

                        <button
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                            className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 hover:scale-110 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                        >
                            {isPlaying ? <Pause size={48} fill="white" strokeWidth={0} /> : <Play size={48} fill="white" strokeWidth={0} className="ml-2" />}
                        </button>

                        <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="text-white/60 hover:text-white transition-all hover:scale-110">
                            <RotateCw size={48} strokeWidth={1.5} />
                            <span className="block text-[12px] font-black mt-2 text-center">10</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Locked Mode Indicator */}
            {isLocked && isControlsVisible && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]">
                    <button
                        onClick={toggleLock}
                        className="pointer-events-auto group flex flex-col items-center gap-4 bg-black/40 backdrop-blur-2xl p-10 rounded-[40px] border border-white/10 hover:border-white/30 transition-all"
                    >
                        <Lock size={64} className="text-[var(--color-primary)] animate-pulse" />
                        <span className="text-sm font-black tracking-[4px] uppercase text-white/60 group-hover:text-white transition">Bloqueado</span>
                        <div className="mt-4 px-6 py-2 bg-white/10 rounded-full text-xs font-bold">Pulsa para desbloquear</div>
                    </button>
                </div>
            )}

            {/* Bottom Controls - Disney Style */}
            <div className={`player-controls-v2 absolute bottom-0 left-0 right-0 p-4! transition-all duration-500 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-[60] ${isControlsVisible && !isLocked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`} onClick={e => e.stopPropagation()}>

                {/* Seek Bar */}
                <div className="flex flex-col gap-4 mb-4!">
                    <div className="flex items-center justify-between text-sm font-bold text-white/60 mb-1">
                        <span className="font-mono">{formatTime(currentTime)}</span>
                        <span className="font-mono">{formatTime(duration)}</span>
                    </div>
                    <div className="relative group/progress h-2 w-full bg-white/20 rounded-full cursor-pointer">
                        <div
                            className="absolute top-0 left-0 h-full bg-[var(--color-primary)] rounded-full shadow-[0_0_15px_var(--color-primary-glow)]"
                            style={{ width: `${progress}%` }}
                        />
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* Bottom Icons Bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <button onClick={restart} className="text-white/60 hover:text-white transition-all" title="Reiniciar">
                            <RotateCcw size={28} />
                        </button>

                        <div className="flex items-center gap-4 group/vol">
                            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-all">
                                {isMuted || volume === 0 ? <VolumeX size={28} /> : <Volume2 size={28} />}
                            </button>
                            <input
                                type="range" min="0" max="1" step="0.05"
                                value={volume}
                                onChange={(e) => {
                                    const v = parseFloat(e.target.value);
                                    setVolume(v);
                                    if (videoRef.current) videoRef.current.volume = v;
                                }}
                                className="w-0 group-hover/vol:w-32 transition-all overflow-hidden h-1.5 accent-[var(--color-primary)] bg-white/20 rounded-full"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-10">
                        {/* Quality Selection */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsQualityMenuOpen(!isQualityMenuOpen);
                                    setIsAudioMenuOpen(false);
                                    setIsSubtitleMenuOpen(false);
                                }}
                                className={`flex flex-col items-center gap-1 text-white/60 hover:text-white transition-all ${isQualityMenuOpen ? 'text-[var(--color-primary)]' : ''}`}
                            >
                                <Settings size={28} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Calidad</span>
                            </button>
                            {isQualityMenuOpen && levels.length > 0 && (
                                <div className="absolute bottom-16 right-0 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-3! min-w-[200px] shadow-2xl animate-fadeSlideUp">
                                    <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40 mb-3 px-4!">Calidad de Video</p>
                                    <button
                                        onClick={() => changeLevel(-1)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentLevel === -1 ? 'bg-[var(--color-primary)] text-white shadow-[0_0_20px_var(--color-primary-glow)]' : 'text-white/80 hover:bg-white/10'}`}
                                    >
                                        Auto (Recomendado)
                                    </button>
                                    <div className="h-px bg-white/5 my-2" />
                                    {levels.map((level, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => changeLevel(idx)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentLevel === idx ? 'bg-[var(--color-primary)] text-white shadow-[0_0_20px_var(--color-primary-glow)]' : 'text-white/80 hover:bg-white/10'}`}
                                        >
                                            {level.height}p {level.bitrate ? `(${(level.bitrate / 1000000).toFixed(1)} Mbps)` : ''}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Audio tracks */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    console.log('🎧 [VideoPlayer] Audio button clicked. Current state:', isAudioMenuOpen);
                                    setIsAudioMenuOpen(!isAudioMenuOpen);
                                    setIsSubtitleMenuOpen(false);
                                    setIsQualityMenuOpen(false);
                                }}
                                className={`flex flex-col items-center gap-1 text-white/60 hover:text-white transition-all ${isAudioMenuOpen ? 'text-[var(--color-primary)]' : ''}`}
                            >
                                <Headphones size={28} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Audio</span>
                            </button>
                            {isAudioMenuOpen && (
                                <div className="absolute bottom-16 right-0 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-3! min-w-[200px] shadow-2xl animate-fadeSlideUp">
                                    <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40 mb-3 px-4!">Pistas de Audio</p>
                                    {audioTracks.length > 0 ? (
                                        audioTracks.map((track, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => changeAudio(idx)}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentAudio === idx ? 'bg-[var(--color-primary)] text-white shadow-[0_0_20px_var(--color-primary-glow)]' : 'text-white/80 hover:bg-white/10'}`}
                                            >
                                                {track.name || `Audio ${idx + 1}`}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-white/40 italic">
                                            No hay audios adicionales detectados
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Subtitles */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsSubtitleMenuOpen(!isSubtitleMenuOpen);
                                    setIsAudioMenuOpen(false);
                                    setIsQualityMenuOpen(false);
                                }}
                                className={`flex flex-col items-center gap-1 text-white/60 hover:text-white transition-all ${isSubtitleMenuOpen ? 'text-[var(--color-primary)]' : ''}`}
                            >
                                <MessageSquare size={28} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Subtítulos</span>
                            </button>
                            {isSubtitleMenuOpen && (
                                <div className="absolute bottom-16 right-0 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-2xl p-3! min-w-[200px] shadow-2xl animate-fadeSlideUp">
                                    <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40 mb-3 px-4!">Configurar Subtítulos</p>
                                    <button
                                        onClick={() => changeSubtitle(-1)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentSubtitle === -1 ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10'}`}
                                    >
                                        Desactivados
                                    </button>
                                    <div className="h-px bg-white/5 my-2" />
                                    {subtitleTracks.map((track, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => changeSubtitle(idx)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${currentSubtitle === idx ? 'bg-[var(--color-primary)] text-white shadow-[0_0_20px_var(--color-primary-glow)]' : 'text-white/80 hover:bg-white/10'}`}
                                        >
                                            {track.name || `Idioma ${idx + 1}`}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={handleFullscreen} className="text-white/60 hover:text-white transition-all">
                            <Maximize size={28} />
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}
