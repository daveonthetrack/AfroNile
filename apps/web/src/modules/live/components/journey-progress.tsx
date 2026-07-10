'use client';

import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';

export function JourneyProgress() {
  const [momentum, setMomentum] = useState(45);

  useEffect(() => {
    // Slowly simulate active concert energy spikes between 45% and 85%
    const interval = setInterval(() => {
      setMomentum((prev) => {
        const delta = Math.random() > 0.5 ? 2.5 : -1.5;
        const next = prev + delta;
        return Math.min(Math.max(next, 40), 90);
      });
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900/10 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-6 shadow-xl select-none">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="h-4.5 w-4.5 text-primary" />
            <span>AfroNile Momentum</span>
          </h3>
          <p className="text-xs text-zinc-500 font-light">Collaborative tour energy and ongoing creative speed.</p>
        </div>
        <span className="text-[10px] font-mono font-bold text-zinc-500 tracking-wider">
          {momentum.toFixed(0)}% ACTIVE
        </span>
      </div>

      {/* Modern Flowing Wave SVG Progress Path */}
      <div className="relative py-2">
        <svg className="w-full h-12 stroke-[1.25]" viewBox="0 0 100 20" fill="none">
          <defs>
            <linearGradient id="goldenGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.1" />
              <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="purpleGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Underlapping secondary out-of-phase wave (Nothing theme) */}
          <path 
            d="M 0,10 C 20,4 30,16 50,10 C 70,4 80,16 100,10" 
            stroke="url(#purpleGrad)" 
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset={100 - Math.min(momentum * 1.1, 100)}
            className="transition-all duration-1000 ease-in-out opacity-65"
          />

          {/* Base Unfilled Path */}
          <path 
            d="M 0,10 C 25,18 25,2 50,10 C 75,18 75,2 100,10" 
            stroke="#27272a" 
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
          
          {/* Active Flow Path */}
          <path 
            d="M 0,10 C 25,18 25,2 50,10 C 75,18 75,2 100,10" 
            stroke="url(#goldenGrad)" 
            strokeLinecap="round"
            strokeDasharray="100"
            strokeDashoffset={100 - momentum}
            className="transition-all duration-1000 ease-in-out"
          />
          
          {/* Floating Glow Indicator Dot */}
          <circle 
            cx={momentum} 
            cy={10 + 4 * Math.sin((momentum * Math.PI) / 25)} 
            r="2" 
            fill="#f59e0b" 
            className="transition-all duration-1000 ease-in-out shadow-lg animate-pulse"
            style={{ filter: 'drop-shadow(0 0 5px #f59e0b)' }}
          />
        </svg>
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-none border-t border-white/5 pt-4">
        <span>Giza Soundwaves</span>
        <span>Global Journey</span>
      </div>
    </div>
  );
}
