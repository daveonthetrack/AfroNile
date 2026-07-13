'use client';

import React from 'react';
import { Sparkles, Quote, Music, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

interface ArtistClientProps {
  artist: {
    id: string;
    stageName: string;
    bio: string | null;
    socialLinks: Record<string, string> | null;
  };
}

const FALLBACK_CHAPTERS = [
  {
    number: '01',
    title: 'Nile Basin Frequencies',
    subtitle: 'The Nile Rhythm Roots',
    content:
      'Born along the edge of the Nile, the project represents a sonic bridge between traditional East African percussion patterns and the modern modular frequencies of Afrobeat. The music pulls inspiration from ancient tempos, filtering them through dynamic analog drum machines and custom Eurorack synthesizers.',
  },
  {
    number: '02',
    title: 'Analog Echoes',
    subtitle: 'Preserving Sound Character',
    content:
      'In an era dominated by flat digital replication, AfroNile operates entirely in the hybrid space. All core tracking utilizes physical synthesizers, organic wood percussion, and tape compression. Each frequency contains warmth, texture, and natural imperfections that connect with listeners on a mechanical, physical level.',
  },
  {
    number: '03',
    title: 'Cryptographic Autonomy',
    subtitle: 'Direct Artist-to-Listener Connection',
    content:
      'We believe in reclaiming the agency of musical distribution. Through peer-to-peer verification and cryptographic ticket ledgers, AfroNile eliminates third-party gatekeepers. Every interaction is built directly on-chain, ensuring that listeners support the performance directly, and the sound belongs to the community.',
  },
];

function buildChaptersFromBio(bio: string | null) {
  if (!bio?.trim()) {
    return FALLBACK_CHAPTERS;
  }

  const paragraphs = bio
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return FALLBACK_CHAPTERS;
  }

  return paragraphs.map((content, index) => ({
    number: String(index + 1).padStart(2, '0'),
    title: `Chapter ${index + 1}`,
    subtitle: 'Artist Chronicle',
    content,
  }));
}

const SOCIAL_LABELS: Record<string, string> = {
  spotify: 'Spotify',
  apple: 'Apple Music',
  appleMusic: 'Apple Music',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'Twitter',
  tiktok: 'TikTok',
};

export function ArtistClient({ artist }: ArtistClientProps) {
  const chapters = buildChaptersFromBio(artist.bio);
  const socialEntries = Object.entries(artist.socialLinks || {}).filter(
    ([, url]) => typeof url === 'string' && url.startsWith('http')
  );

  return (
    <div className="min-h-screen bg-[#020202] text-white pt-24 pb-32 space-y-32 select-none overflow-x-hidden">
      
      {/* Editorial Title Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-zinc-400">
          <Sparkles className="h-3 w-3 text-primary animate-pulse" />
          <span>Documentary Ledger</span>
        </div>
        
        <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-serif font-black tracking-wide text-gold-shimmer uppercase leading-none">
          {artist.stageName}
        </h1>
        
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 font-bold max-w-sm mx-auto font-mono">
          AfroNile • Roots, Synthesis, & Autonomy
        </p>

        {socialEntries.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {socialEntries.map(([key, url]) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-8 px-4 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white hover:border-white/20 transition"
              >
                <span>{SOCIAL_LABELS[key] || key}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Hero Visual Block */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 aspect-[16/9] bg-zinc-950 shadow-2xl group">
          <img
            src="/Afronile visualizer-5 mb.png"
            alt="AfroNile live companion visual"
            className="w-full h-full object-cover opacity-40 transition-transform duration-[4000ms] group-hover:scale-102"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          
          <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest font-mono block">Featured Kept Ledger</span>
              <h2 className="text-2xl font-serif font-bold text-white tracking-wide">Soundwave Synthesis</h2>
            </div>
            <p className="text-xs text-zinc-450 max-w-xs font-light leading-relaxed">
              {artist.bio?.split(/\n\s*\n/)[0]?.slice(0, 160) ||
                'Recording live sessions from the Cairo analog warehouses. Captured directly to tape for organic tone separation.'}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Chapter Block */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {chapters.map((chap, i) => (
          <div 
            key={chap.number} 
            className={cn(
              "grid grid-cols-1 md:grid-cols-12 gap-8 items-start scroll-reveal border-t border-white/5 pt-12",
              i % 2 === 1 ? "md:flex-row-reverse" : ""
            )}
          >
            {/* Chapter Number */}
            <div className="md:col-span-2 text-left">
              <span className="text-4xl md:text-6xl font-serif font-black text-primary/45 font-mono">
                {chap.number}
              </span>
            </div>

            {/* Chapter Body */}
            <div className="md:col-span-10 space-y-4 text-left">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                  {chap.subtitle}
                </span>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide mt-0.5">
                  {chap.title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-2xl">
                {chap.content}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Editorial Quotes & Philosophy */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 bg-white/[0.01] border border-white/5 rounded-[2.5rem] relative overflow-hidden scroll-reveal">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 space-y-6 max-w-2xl mx-auto flex flex-col items-center">
          <Quote className="h-8 w-8 text-primary animate-pulse" />
          <p className="text-lg md:text-2xl font-serif italic font-light text-zinc-200 leading-relaxed">
            "Music is not something we consume passively through screens. It is a spatial and mechanical frequency that binds the crowd and the performance together."
          </p>
          <div className="h-0.5 w-12 bg-primary/30 rounded-full" />
          <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-mono">
            - AfroNile Manifesto, Cairo Chapter
          </span>
        </div>
      </section>

      {/* Call to Actions */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 scroll-reveal">
        <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide">
          Step into the Nile Waves
        </h3>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
          Access high-fidelity digital releases, physical wax merch, and cryptographically secured tour dates directly.
        </p>
        <div className="flex justify-center gap-4 pt-2">
          <Link
            href="/music"
            className="h-10 px-6 rounded-full bg-primary hover:bg-primary/95 text-[10px] font-bold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-primary/10"
          >
            <Music className="h-3.5 w-3.5" />
            <span>Explore releases</span>
          </Link>
          <Link
            href="/tour"
            className="h-10 px-6 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-200 flex items-center justify-center transition active:scale-95"
          >
            <span>Live tour dates</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
