'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SupportModule } from '../../modules/live/components/support-module';
import { useLiveState } from '../../modules/live/hooks/useLiveState';
import { UpcomingShows } from '../../modules/live/components/upcoming-shows';

interface LiveClientProps {
  events: {
    id: string;
    title: string;
    venueName: string;
    venueAddress: string;
    eventDate: Date | string;
  }[];
  products: {
    id: string;
    type: string;
    title: string;
    priceCents: number;
    sku: string;
    stockQuantity: number;
  }[];
}

export function LiveClient({ events, products }: LiveClientProps) {
  const searchParams = useSearchParams();
  const nextShow = events[0] || null;
  const showParam = searchParams.get('show');
  const initialShowId = showParam || nextShow?.id || '';

  const [showSplash, setShowSplash] = useState(false);
  const [splashFade, setSplashFade] = useState(false);

  // Connect to SSE event stream and sync live status
  const { checkInError } = useLiveState(initialShowId);

  // Form states lifted to handle interactive wave feedback
  const [selectedTier, setSelectedTier] = useState<number | null>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [comment, setComment] = useState('');

  // Ticket product matching for next performance
  const ticketProduct = products.find((p) => p.sku === `TICKET_${initialShowId}`) || null;

  // Play dynamic Entry Splash if launched from QR code scan (?show=...)
  useEffect(() => {
    const showParam = searchParams.get('show');
    let fadeTimer: NodeJS.Timeout | undefined;
    let removeTimer: NodeJS.Timeout | undefined;

    if (showParam) {
      setShowSplash(true);
      fadeTimer = setTimeout(() => setSplashFade(true), 1500);
      removeTimer = setTimeout(() => setShowSplash(false), 1900);
    }

    return () => {
      if (fadeTimer) clearTimeout(fadeTimer);
      if (removeTimer) clearTimeout(removeTimer);
    };
  }, [searchParams]);

  // Dynamic SVG path calculations based on selected support tier
  const getWavePath = () => {
    if (selectedTier === 5) {
      // Gentle, low frequency
      return "M 0,10 Q 25,14 50,10 T 100,10";
    }
    if (selectedTier === 10) {
      // Standard dual wave
      return "M 0,10 C 25,18 25,2 50,10 C 75,18 75,2 100,10";
    }
    if (selectedTier === 20) {
      // Sonic surge wave
      return "M 0,10 C 15,20 35,0 50,10 C 65,20 85,0 100,10";
    }
    if (selectedTier === 50) {
      // Golden overload frequency storm
      return "M 0,10 C 10,23 20,-3 30,10 C 40,23 50,-3 60,10 C 70,23 80,-3 90,10 C 95,23 100,-3 100,10";
    }
    if (customAmount) {
      // Hyperactive custom wave
      return "M 0,10 Q 12,22 25,10 T 50,10 T 75,10 T 100,10";
    }
    return "M 0,10 Q 25,12 50,10 T 100,10";
  };

  const getWavePulseSpeed = () => {
    if (selectedTier === 5) return "animate-[pulse_4s_ease-in-out_infinite]";
    if (selectedTier === 10) return "animate-[pulse_2s_ease-in-out_infinite]";
    if (selectedTier === 20) return "animate-[pulse_1s_ease-in-out_infinite]";
    if (selectedTier === 50) return "animate-[pulse_0.4s_ease-in-out_infinite]";
    if (customAmount) return "animate-[pulse_0.8s_ease-in-out_infinite]";
    return "animate-[pulse_3s_ease-in-out_infinite]";
  };

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-sm mx-auto px-4 py-8 select-none relative overflow-hidden text-left pt-20">
      
      {/* Dynamic radial glow that scales up brightness with backing amount */}
      <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none overflow-hidden z-0 transition-all duration-500">
        <div 
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-[60px] opacity-40 transition-all duration-500 bg-primary/20 ${
            selectedTier === 5 ? 'w-48 h-48 bg-amber-500/10' :
            selectedTier === 10 ? 'w-64 h-64 bg-amber-500/20' :
            selectedTier === 20 ? 'w-80 h-80 bg-pink-500/25' :
            selectedTier === 50 ? 'w-96 h-96 bg-primary/35 shadow-[0_0_40px_rgba(245,158,11,0.2)]' :
            'w-64 h-64'
          }`} 
        />
      </div>
      
      {/* Dynamic QR Entry Splash Overlay */}
      {showSplash && (
        <div 
          className={`fixed inset-0 bg-zinc-950 z-50 flex flex-col items-center justify-center gap-6 transition-all duration-300 ${
            splashFade ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100'
          }`}
        >
          <div className="relative flex items-center justify-center w-28 h-28">
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-70" />
            <div className="absolute inset-4 rounded-full border border-primary/30 animate-pulse" />
            <div className="absolute inset-8 rounded-full border border-primary/45" />
            <div className="h-6 w-6 bg-primary rounded-full animate-pulse shadow-[0_0_15px_#f59e0b]" />
          </div>
          <div className="space-y-2 text-center">
            <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-[0.2em] block">Nile Waves Live Sync</span>
            <h2 className="text-xs font-bold text-white tracking-widest font-mono animate-pulse uppercase">
              SYNCING PERFORMANCE WAVES...
            </h2>
          </div>
        </div>
      )}

      {/* Main Focused Support & Onboarding Card stack */}
      <main className="my-auto py-6 relative z-10 w-full space-y-6">
        {/* Check-in Error Alert banner */}
        {checkInError && (
          <div className="p-3 text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl font-mono uppercase tracking-wider text-center">
            Check-in Failed: {checkInError}
          </div>
        )}

        {/* Support and Reflections Module */}
        <SupportModule 
          eventId={initialShowId}
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
          customAmount={customAmount}
          setCustomAmount={setCustomAmount}
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          comment={comment}
          setComment={setComment}
        />

        {/* Next shows block */}
        <UpcomingShows events={events} ticketProduct={ticketProduct} />
      </main>

      {/* Glowing Cairo Soundwave Line visual footer */}
      <footer className="w-full relative py-2 pt-4 z-10 shrink-0">
        <svg className="w-full h-8 stroke-[1.5] transition-all duration-300" viewBox="0 0 100 20" fill="none">
          <defs>
            <linearGradient id="cairoWaveGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.05" />
              <stop 
                offset="50%" 
                stopColor={selectedTier === 50 ? "#d4af37" : selectedTier === 20 ? "#ec4899" : "#d4af37"} 
                stopOpacity="0.9" 
              />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          <path 
            d={getWavePath()} 
            stroke="url(#cairoWaveGrad)" 
            strokeLinecap="round"
            className={`transition-all duration-500 ${getWavePulseSpeed()}`}
          />
        </svg>
      </footer>

    </div>
  );
}
