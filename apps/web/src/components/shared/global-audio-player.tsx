'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Music,
  ListMusic
} from 'lucide-react';
import { useAudioStore } from '../../modules/audio/hooks/useAudioStore';
import { usePathname } from 'next/navigation';

export function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);

  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    togglePlay,
    setPlaying,
    setCurrentTime,
    setDuration,
    setVolume,
    nextTrack,
    prevTrack,
  } = useAudioStore();

  // Handle mounting on client side to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync audio source and fetch signed stream URL dynamically
  useEffect(() => {
    if (!audioRef.current) return;
    let active = true;

    if (currentTrack) {
      async function loadSecureTrack() {
        try {
          const res = await fetch(`/api/audio/${currentTrack!.id}`);
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || 'Access denied.');
          }
          const data = await res.json();
          if (active && data.success && data.streamUrl) {
            audioRef.current!.src = data.streamUrl;
            audioRef.current!.load();
            if (isPlaying) {
              audioRef.current!.play().catch(() => setPlaying(false));
            }
          }
        } catch (err: any) {
          console.error('Failed to load secure audio track:', err);
          alert(`Playback Error: ${err.message || 'This audio stream is currently unavailable.'}`);
          setPlaying(false);
        }
      }
      loadSecureTrack();
    } else {
      audioRef.current.pause();
    }

    return () => {
      active = false;
    };
  }, [currentTrack]);

  // Sync play/pause state
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Sync volume state
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const pathname = usePathname();

  if (!mounted || pathname === '/live/screen') return null;

  const handleTimelineChange = (val: number[]) => {
    if (!audioRef.current || val[0] === undefined) return;
    audioRef.current.currentTime = val[0];
    setCurrentTime(val[0]);
  };

  const handleVolumeChange = (val: number[]) => {
    if (val[0] === undefined) return;
    const newVol = val[0];
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
    }
  };

  const formatTime = (timeInSecs: number) => {
    if (isNaN(timeInSecs)) return '0:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 h-20 max-w-5xl w-[calc(100%-2rem)] rounded-full glass-card shadow-[0_20px_50px_rgba(0,0,0,0.6)] px-6 flex items-center justify-between transition-all duration-300 hover:border-white/10 select-none">
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={nextTrack}
      />

      {/* Left Section: Metadata */}
      <div className="flex items-center min-w-0 w-1/2 sm:w-1/4">
        {currentTrack ? (
          <>
            <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-900 border border-white/10 group shadow-md">
              {currentTrack.coverImageUrl ? (
                <img 
                  src={currentTrack.coverImageUrl} 
                  alt={currentTrack.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Music className="h-5 w-5 text-zinc-500" />
                </div>
              )}
            </div>
            <div className="ml-3 min-w-0">
              <h4 className="truncate text-xs font-bold text-white tracking-tight leading-none mb-1">{currentTrack.title}</h4>
              <p className="truncate text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">{currentTrack.artistName}</p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 bg-zinc-950/60">
              <Music className="h-4 w-4 text-zinc-700" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-600 leading-none mb-1">NO TRACK</p>
              <p className="text-[9px] font-semibold text-zinc-700">SELECT A SONG</p>
            </div>
          </div>
        )}
      </div>

      {/* Middle Section: Controls & Progress */}
      <div className="flex flex-col items-center flex-1 max-w-xl px-4 w-1/2 sm:w-1/2">
        <div className="flex items-center gap-6 mb-1.5">
          <button 
            onClick={prevTrack} 
            disabled={!currentTrack}
            className="text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition duration-200"
          >
            <SkipBack className="h-4.5 w-4.5" />
          </button>
          
          <button
            onClick={togglePlay}
            disabled={!currentTrack}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 disabled:opacity-20 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>

          <button 
            onClick={nextTrack} 
            disabled={!currentTrack}
            className="text-zinc-500 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition duration-200"
          >
            <SkipForward className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex items-center w-full gap-3 text-[10px] font-mono text-zinc-500 select-none">
          <span className="tabular-nums">{formatTime(currentTime)}</span>
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-4 group cursor-pointer"
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleTimelineChange}
            disabled={!currentTrack}
          >
            <Slider.Track className="bg-zinc-900 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-primary rounded-full h-full shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
            </Slider.Track>
            <Slider.Thumb 
              className="block w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus:outline-none ring-2 ring-primary" 
              aria-label="Progress"
            />
          </Slider.Root>
          <span className="tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right Section: Volume & Queue */}
      <div className="hidden sm:flex items-center justify-end gap-4 w-1/4">
        <button className="text-zinc-500 hover:text-white transition md:block hidden">
          <ListMusic className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 max-w-[100px] w-full">
          <button 
            onClick={toggleMute}
            className="text-zinc-500 hover:text-white transition"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-4 cursor-pointer"
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
          >
            <Slider.Track className="bg-zinc-900 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-zinc-300 rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb 
              className="block w-2 h-2 bg-white rounded-full focus:outline-none ring-1 ring-white" 
              aria-label="Volume"
            />
          </Slider.Root>
        </div>
      </div>
    </div>
  );
}
