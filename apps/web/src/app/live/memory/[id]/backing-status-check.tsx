'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Heart, XCircle, Loader2 } from 'lucide-react';
import { ShareButton } from '../../../../modules/live/components/share-button';

interface BackingStatusCheckProps {
  contributionId: string;
  initialStatus: 'PAID' | 'PENDING';
}

export function BackingStatusCheck({ contributionId, initialStatus }: BackingStatusCheckProps) {
  const [status, setStatus] = useState<'PAID' | 'PENDING' | 'FAILED'>(initialStatus);
  const [loading, setLoading] = useState(initialStatus === 'PENDING');

  useEffect(() => {
    if (initialStatus === 'PAID') return;

    let attempts = 0;
    const maxAttempts = 15; // 30 seconds total (15 * 2s)

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/live/support?contributionId=${contributionId}`);
        const data = await res.json();

        if (data.status === 'PAID') {
          setStatus('PAID');
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling backing status:', err);
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setStatus('FAILED');
        setLoading(false);
        clearInterval(interval);
      }
    };

    // Run first check immediately
    checkStatus();

    const interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [contributionId, initialStatus]);

  if (loading) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 space-y-8 select-none text-center">
        <Link 
          href="/live" 
          className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Return to Companion</span>
        </Link>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950/40 backdrop-blur-xl p-8 md:p-10 shadow-2xl flex flex-col justify-center items-center aspect-[4/5]">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/5 blur-[80px] opacity-40 pointer-events-none" />
          <div className="absolute top-4 left-4 right-4 bottom-4 border border-white/[0.02] rounded-[24px] pointer-events-none" />

          <div className="relative z-10 space-y-6 w-full text-center flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
            <h2 className="text-sm font-mono text-zinc-400 uppercase tracking-widest">
              Verifying Contribution...
            </h2>
            <p className="text-[9px] text-zinc-600 uppercase max-w-[200px] leading-relaxed">
              Securing transaction through Stripe and updating live ledger.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 space-y-8 select-none text-center animate-in fade-in duration-300">
        <Link 
          href="/live" 
          className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Return to Companion</span>
        </Link>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-red-500/10 bg-zinc-950/40 backdrop-blur-xl p-8 md:p-10 shadow-2xl flex flex-col justify-center items-center aspect-[4/5] group">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-red-500/5 blur-[80px] opacity-40 pointer-events-none" />
          <div className="absolute top-4 left-4 right-4 bottom-4 border border-red-500/[0.02] rounded-[24px] pointer-events-none" />

          <div className="relative z-10 space-y-6 w-full text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-500 mb-2">
              <XCircle className="h-6 w-6" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-xl font-serif font-black text-white tracking-[0.1em] uppercase leading-none">
                TRANSACTION DECLINED
              </h1>
              <div className="h-0.5 w-12 bg-red-500/35 mx-auto rounded-full" />
            </div>

            <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto pt-2">
              Your support contribution could not be processed by Stripe. Please try contributing again.
            </p>

            <div className="pt-4">
              <Link
                href="/live"
                className="inline-flex h-11 px-8 items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-xs font-bold uppercase tracking-wider text-white transition active:scale-95 shadow-lg shadow-red-500/20"
              >
                Try Again
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PAID status (Success screen Keepsake box)
  return (
    <div className="max-w-sm mx-auto px-4 py-20 space-y-8 select-none text-center animate-in fade-in duration-500">
      <Link 
        href="/live" 
        className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition"
      >
        <ArrowLeft className="h-3 w-3" />
        <span>Return to Companion</span>
      </Link>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950/40 backdrop-blur-xl p-8 md:p-10 shadow-2xl flex flex-col justify-center items-center aspect-[4/5] group">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/10 blur-[80px] opacity-40 pointer-events-none" />
        <div className="absolute top-4 left-4 right-4 bottom-4 border border-white/[0.02] rounded-[24px] pointer-events-none" />

        <div className="relative z-10 space-y-6 w-full text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary mb-2">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-serif font-black text-white tracking-[0.15em] uppercase leading-none pl-[0.15em]">
              THANK YOU
            </h1>
            <div className="h-0.5 w-12 bg-primary/45 mx-auto rounded-full" />
          </div>

          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto pt-2">
            YOU ARE NOW PART OF THE AFRONILE FAMILY.
          </p>
        </div>

        <div className="relative z-10 mt-8 text-zinc-500/50 flex gap-1">
          <Sparkles className="h-4 w-4 animate-pulse duration-[2000ms]" />
        </div>
      </div>

      <div className="flex gap-4 justify-center">
        <ShareButton />
      </div>
    </div>
  );
}
