'use client';

import React from 'react';
import { Sparkles, MapPin, Calendar, CheckCircle2 } from 'lucide-react';

interface LiveHeroProps {
  venueName: string;
  tourName: string;
  checkedIn: boolean;
  checkingIn: boolean;
}

export function LiveHero({ venueName, tourName, checkedIn, checkingIn }: LiveHeroProps) {
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-zinc-950 px-6 py-8 md:p-16 flex flex-col justify-end min-h-[28vh] md:min-h-[45vh] shadow-2xl group select-none">
      
      {/* Soft Moving Ambient Glows (Nothing/A24 inspired) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-zinc-900 blur-[80px] opacity-40 animate-pulse duration-[6000ms]" />
        <div className="absolute -bottom-45 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-[100px] opacity-50 animate-pulse duration-[8000ms]" />
      </div>

      <div className="relative z-10 space-y-6 max-w-2xl">
        <div className="flex flex-wrap gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-zinc-400 bg-white/5 border border-white/10 uppercase tracking-widest backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Live Companion</span>
          </div>
          
          {checkedIn && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 uppercase tracking-widest animate-in fade-in zoom-in-95 duration-500">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Checked In</span>
            </div>
          )}
          {checkingIn && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 uppercase tracking-widest animate-pulse">
              <span>Checking In...</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest block font-mono">Tonight’s Performance</span>
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-none">
            {tourName}
          </h1>
        </div>

        <p className="text-sm md:text-base text-zinc-400 font-light leading-relaxed max-w-lg">
          Thank you for being here. If tonight’s music and energy moved you, help us continue creating by exploring our companion spaces.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center text-xs font-mono text-zinc-500 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary/75" />
            <span className="text-zinc-300">{venueName}</span>
          </div>
          <div className="hidden sm:block text-zinc-700">•</div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary/75" />
            <span>{currentDateStr}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
