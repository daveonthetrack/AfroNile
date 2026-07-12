'use client';

import React, { useEffect, useState } from 'react';
import { useAudioStore } from '../../modules/audio/hooks/useAudioStore';
import { Play, Pause } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SignatureVinyl() {
  const { currentTrack, isPlaying, togglePlay } = useAudioStore();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      const scrolled = window.scrollY;
      // Shrink turntable to bottom right after scrolling past 350px
      setIsMinimized(scrolled > 350);
      setScrollProgress(scrolled * 0.15); // Scale rotation rate
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once at start
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  // Combine automatic spin animation when playing, and manual scroll rotation
  const spinRotation = (scrollProgress % 360).toFixed(2);
  const labelImage = currentTrack?.coverImageUrl || '/nile_waves_album_art.jpg';

  return (
    <div
      className={cn(
        'transition-all duration-700 ease-out z-40 select-none pointer-events-auto',
        isMinimized
          ? 'fixed bottom-28 right-6 w-16 h-16 md:w-20 md:h-20 shadow-2xl scale-100 opacity-90 hover:opacity-100 hover:scale-105'
          : 'relative w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[450px] md:h-[450px] mx-auto'
      )}
    >
      {/* Turntable Platter Deck Base (Hidden when minimized for micro-compact shape) */}
      <div
        className={cn(
          'absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-white/5 shadow-2xl transition-all duration-700 ease-out flex items-center justify-center',
          isMinimized ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        )}
      >
        {/* Metal corners and lights */}
        <div className="absolute top-4 left-4 h-2 w-2 rounded-full bg-zinc-800 border border-white/10" />
        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-zinc-800 border border-white/10" />
        <div className="absolute bottom-4 left-4 h-2 w-2 rounded-full bg-zinc-800 border border-white/10" />
        <div className="absolute bottom-4 right-4 h-2 w-2 rounded-full bg-zinc-800 border border-white/10" />

        {/* Pitch fader mock */}
        <div className="absolute right-8 top-1/4 bottom-1/4 w-1 bg-zinc-900 border-l border-white/5 rounded-full flex items-center justify-center">
          <div className="w-4 h-6 bg-zinc-800 border border-white/10 rounded-sm shadow-md cursor-pointer hover:bg-zinc-700 transition" />
        </div>

        {/* Start/Stop Button */}
        <button
          onClick={togglePlay}
          className="absolute bottom-6 left-6 h-8 w-8 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-white/10 flex items-center justify-center shadow-md active:scale-95 transition"
        >
          <div className={cn('h-2.5 w-2.5 rounded-sm', isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
        </button>

        {/* Glowing speed selector indicators */}
        <div className="absolute top-6 left-12 flex gap-1.5 text-[8px] font-mono text-zinc-600">
          <span className={cn(isPlaying ? 'text-primary' : '')}>33 RPM</span>
          <span>/</span>
          <span>45 RPM</span>
        </div>
      </div>

      {/* The Vinyl Disc itself */}
      <div
        onClick={isMinimized ? togglePlay : undefined}
        style={{
          transform: `rotate(${parseFloat(spinRotation)}deg)`,
        }}
        className={cn(
          'absolute rounded-full cursor-pointer overflow-hidden bg-black shadow-2xl flex items-center justify-center transition-all duration-700 ease-out',
          isMinimized
            ? 'inset-0 border border-white/10'
            : 'inset-8 sm:inset-10 md:inset-12 border-4 border-zinc-900'
        )}
      >
        {/* Vinyl grooves (concentric circles) */}
        <div className="absolute inset-0 rounded-full opacity-35 bg-[radial-gradient(circle_at_center,transparent_40%,#111_40%,#111_42%,transparent_42%,transparent_50%,#111_50%,#111_52%,transparent_52%,transparent_60%,#111_60%,#111_62%,transparent_62%,transparent_70%,#111_70%,#111_72%,transparent_72%,transparent_80%,#111_80%,#111_82%,transparent_82%,transparent_90%,#111_90%,#111_92%,transparent_92%)]" />
        
        {/* Dynamic Light Sheen reflections */}
        <div className="absolute inset-0 rounded-full pointer-events-none opacity-25 bg-[conic-gradient(from_0deg,transparent_15deg,rgba(255,255,255,0.1)_30deg,transparent_45deg,transparent_195deg,rgba(255,255,255,0.1)_210deg,transparent_225deg)]" />

        {/* Center Label Sleeve */}
        <div
          className={cn(
            'rounded-full bg-zinc-900 flex items-center justify-center relative overflow-hidden border border-black shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)] transition-all duration-700',
            isMinimized ? 'w-6 h-6' : 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36'
          )}
        >
          {/* Label Background Art */}
          <img
            src={labelImage}
            alt="Vinyl label"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black/10" />

          {/* Central spindle hole */}
          <div className="absolute w-2 h-2 rounded-full bg-zinc-950 border border-white/20 shadow-inner" />
        </div>

        {/* Continuous spin spinner overlays (for minimized view play status) */}
        {isMinimized && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            {isPlaying ? (
              <Pause className="h-4 w-4 text-white" />
            ) : (
              <Play className="h-4 w-4 text-white ml-0.5" />
            )}
          </div>
        )}
      </div>

      {/* Turntable Tonearm Assembly (Hidden when minimized) */}
      <div
        className={cn(
          'absolute transition-all duration-700 ease-out origin-top-right',
          isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100',
          'top-8 right-8 w-24 h-48 sm:w-32 sm:h-64'
        )}
      >
        <svg
          viewBox="0 0 100 200"
          fill="none"
          stroke="currentColor"
          className="w-full h-full text-zinc-400 stroke-2"
          style={{
            transform: isPlaying ? 'rotate(18deg)' : 'rotate(0deg)',
            transformOrigin: '80px 20px',
            transition: 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* Tonearm pivot base */}
          <circle cx="80" cy="20" r="12" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
          <circle cx="80" cy="20" r="4" fill="#d4af37" />

          {/* Counterweight */}
          <rect x="72" y="2" width="16" height="8" rx="1" fill="#27272a" />

          {/* Arm body (Bent metal style) */}
          <path
            d="M 80,20 C 80,80 50,110 50,160 L 50,175"
            stroke="#a1a1aa"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Cartridge headshell and stylus */}
          <g transform="translate(42, 172)">
            <polygon points="8,0 8,18 0,14 0,4" fill="#27272a" stroke="#52525b" />
            {/* Styled Gold logo band */}
            <rect x="2" y="6" width="4" height="2" fill="#d4af37" />
          </g>
        </svg>
      </div>

      {/* Simple continuous spin CSS injector (for GPU accelerated continuous spin) */}
      {isPlaying && (
        <style jsx global>{`
          @keyframes spin-continuous {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-continuous {
            animation: spin-continuous 15s linear infinite;
          }
        `}</style>
      )}
    </div>
  );
}
