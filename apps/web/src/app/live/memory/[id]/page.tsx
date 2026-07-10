import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@repo/database';
import { Sparkles, ArrowLeft, Heart } from 'lucide-react';
import { ShareButton } from '../../../../modules/live/components/share-button';

export const revalidate = 0;

interface MemoryPageProps {
  params: {
    id: string;
  };
}

export default async function ConcertMemoryPage({ params }: MemoryPageProps) {
  // Simple check to make sure contribution exists
  const contribution = await prisma.supportContribution.findUnique({
    where: { id: params.id },
  });

  if (!contribution) {
    notFound();
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20 space-y-8 select-none text-center">
      
      {/* Return Navigation */}
      <Link 
        href="/live" 
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition"
      >
        <ArrowLeft className="h-3 w-3" />
        <span>Return to Companion</span>
      </Link>

      {/* Simplified Keepsake Box (No receipt elements) */}
      <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-zinc-950/40 backdrop-blur-xl p-8 md:p-10 shadow-2xl flex flex-col justify-center items-center aspect-[4/5] group">
        
        {/* Soft Radial gold glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-primary/10 blur-[80px] opacity-40 pointer-events-none" />
        
        {/* Border detail */}
        <div className="absolute top-4 left-4 right-4 bottom-4 border border-white/[0.02] rounded-[24px] pointer-events-none" />

        {/* Big Thank You Header */}
        <div className="relative z-10 space-y-6 w-full text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary mb-2 animate-pulse">
            <Heart className="h-5 w-5 fill-current" />
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-black font-mono text-white tracking-[0.2em] uppercase leading-none pl-[0.2em]">
              THANK YOU
            </h1>
            <div className="h-0.5 w-12 bg-primary/45 mx-auto rounded-full" />
          </div>

          <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest leading-relaxed max-w-[240px] mx-auto pt-2">
            YOU ARE NOW PART OF THE AFRONILE FAMILY.
          </p>
        </div>

        {/* Animated ambient Sparkles indicator */}
        <div className="relative z-10 mt-8 text-zinc-500/50 flex gap-1">
          <Sparkles className="h-4 w-4 animate-pulse duration-[2000ms]" />
        </div>

      </div>

      {/* Simple sharing buttons */}
      <div className="flex gap-4">
        <ShareButton />
      </div>

    </div>
  );
}
