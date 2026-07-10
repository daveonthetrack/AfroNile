'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import { LiveFeedItem } from '../types';

interface LiveFeedProps {
  items: LiveFeedItem[];
}

export function LiveFeed({ items }: LiveFeedProps) {
  return (
    <div className="bg-zinc-900/10 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-4 shadow-xl select-none">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-3">
        <Radio className="h-4.5 w-4.5 text-primary animate-pulse" />
        <h3 className="text-sm font-bold text-white tracking-tight">Live Activity Feed</h3>
      </div>

      {/* Feed list */}
      <div className="space-y-4.5 min-h-[160px]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-zinc-600 font-light">
            Listening for live concert events...
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              className="flex justify-between items-start gap-4 text-xs animate-in fade-in slide-in-from-top-1 duration-300 border-b border-white/[0.02] pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {/* Blinking Live Ping Dot */}
                <span className="relative flex h-2 w-2 shrink-0 mt-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-65"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/80"></span>
                </span>
                <p className="text-zinc-300 font-light leading-relaxed">
                  {item.text}
                </p>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 shrink-0 leading-relaxed uppercase tracking-wider">
                {item.timestamp}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
