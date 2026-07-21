'use client';

import React from 'react';
import { Disc } from 'lucide-react';
import { LiveSong } from '../types';

interface LivePlayerProps {
  currentSong: LiveSong | null;
  setlistProgress: {
    current: number;
    total: number;
  };
  albumCoverUrl: string;
}

export function LivePlayer({ currentSong, setlistProgress, albumCoverUrl }: LivePlayerProps) {
  if (!currentSong) {
    return (
      <div className="glass-card p-6 rounded-[2rem] flex flex-col items-center justify-center text-center h-48 select-none">
        <Disc className="h-7 w-7 text-zinc-600 animate-spin duration-[4000ms] mb-3" />
        <p className="text-sm font-semibold text-zinc-400">Waiting for performance to start...</p>
        <span className="text-[10px] text-zinc-600 mt-1 uppercase tracking-wider block font-mono">Live Sync Idle</span>
      </div>
    );
  }

  const progressPercent = (currentSong.progressSeconds / currentSong.durationSeconds) * 100;
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card p-6 rounded-[2rem] space-y-6 shadow-xl select-none">
      
      {/* Set progress indicator */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Live Feed</span>
        <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
          Song {setlistProgress.current} of {setlistProgress.total}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Cover Art Wrapper */}
        <div className="relative h-16 w-16 rounded-full overflow-hidden border border-white/10 shrink-0 shadow-lg ring-4 ring-zinc-900/30">
          <img 
            src={albumCoverUrl} 
            alt="Current Album Artwork" 
            className="h-full w-full object-cover animate-spin duration-[25000ms]"
          />
          {/* Vinyl Center Hole Decorator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 bg-zinc-950 rounded-full border border-white/10 shadow-inner" />
          </div>
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Title Details */}
        <div className="min-w-0 space-y-1">
          <span className="text-[9px] font-bold text-primary uppercase tracking-widest block font-mono">Currently Performing</span>
          <h3 className="text-lg font-bold text-white tracking-tight truncate leading-none">
            {currentSong.title}
          </h3>
          <span className="text-xs text-zinc-500 font-light block">AfroNile — Live Setlist</span>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="space-y-2">
        <div className="relative h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 left-0 bg-primary transition-all duration-1000 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        
        <div className="flex justify-between text-[10px] font-mono text-zinc-500 leading-none">
          <span>{formatTime(currentSong.progressSeconds)}</span>
          <span>{formatTime(currentSong.durationSeconds)}</span>
        </div>
      </div>
    </div>
  );
}
