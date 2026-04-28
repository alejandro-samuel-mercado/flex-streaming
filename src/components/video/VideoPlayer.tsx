'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw, SkipForward } from 'lucide-react';

interface VideoPlayerProps {
  src: string; // The .m3u8 URL
  poster?: string;
  onEnded?: () => void;
}

export default function VideoPlayer({ src, poster, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        autoStartLoad: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Ready to play
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For Safari native HLS support
      video.src = src;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [src]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
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

  const handleFullscreen = () => {
    if (videoRef.current?.parentElement?.requestFullscreen) {
      videoRef.current.parentElement.requestFullscreen();
    }
  };

  return (
    <div 
      className={`player-container ${isControlsVisible ? 'controls-visible' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={onEnded}
        onClick={togglePlay}
      />

      {/* Custom Controls */}
      <div className="player-controls">
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="player-progress mb-4"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={togglePlay} className="text-white hover:text-[var(--color-primary)] transition">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <button className="text-white hover:text-gray-300">
              <RotateCcw size={22} />
            </button>
            
            <button className="text-white hover:text-gray-300">
              <SkipForward size={22} />
            </button>

            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="text-white">
                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.1" 
                value={volume} 
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (videoRef.current) videoRef.current.volume = v;
                }}
                className="w-0 group-hover/vol:w-20 transition-all overflow-hidden h-1 accent-white" 
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="text-white hover:text-gray-300">
              <Settings size={22} />
            </button>
            <button onClick={handleFullscreen} className="text-white hover:text-gray-300">
              <Maximize size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
