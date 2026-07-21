'use client';

import React from 'react';
import { Quote, ExternalLink } from 'lucide-react';
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
    title: 'The Maestro',
    subtitle: 'Who is Selamino?',
    content: (
      <div className="space-y-4">
        <p>
          Selam Seyoum Woldemariam, affectionately known as &quot;Selamino,&quot; is a legendary Ethiopian guitarist and a pivotal figure in the development of modern Ethiopian music. With a career spanning over five decades, he is celebrated for his distinctive playing style that blends traditional Ethiopian melodies with influences from rock, jazz, and funk.
        </p>
        <p>
          Selamino rose to prominence as a key member of the influential Ibex Band, which later became the Roha Band; one of the most iconic groups in Ethiopian music history. Through his work with Roha and other collaborations, Selamino played an integral role in creating the &quot;Ethiopian groove&quot; that defined the country&apos;s golden age of music in the 1970s and 1980s.
        </p>
        <p>
          Beyond his work as a performer, Selamino has also contributed to the preservation and evolution of Ethiopian music. His guitar work has graced countless classic recordings, collaborating with renowned vocalists such as Mahmoud Ahmed, Aster Aweke, and Tilahun Gessesse. Selamino’s mastery of the instrument, coupled with his ability to seamlessly bridge Ethiopia’s rich musical heritage with contemporary sounds, has made him a beloved figure both at home and among the global Ethiopian diaspora. Even as the music scene has evolved, Selamino continues to inspire new generations of musicians with his timeless artistry and dedication to keeping Ethiopian music alive.
        </p>
      </div>
    ),
  },
  {
    number: '02',
    title: 'The Prodigious Producer',
    subtitle: 'Who is Dave On The Track?',
    content: (
      <div className="space-y-4">
        <p>
          Dawit Hagos, known professionally as Dave On The Track, is a Music Producer, Multi-Instrumentalist, DJ, and Audio Engineer dedicated to crafting dynamic, genre-blending soundscapes. With a deep passion for collaboration, he has worked with artists across the globe, including Ethiopian artists Rophnan and SALEMIA, Kenyan artist Rydah, and Puerto Rican artist Noelkinz.
        </p>
        <p>
          His production credits include ‘Alem Bire’, SALEMIA’s viral debut, as well as standout projects like ‘Ligoda’ and ‘Alula’, highlighting his versatility and ability to merge diverse musical styles.
        </p>
        <p>
          Beyond the studio, Dave On The Track is an active member of the Recording Academy (DC Chapter), where he represents AfroNile and East African music on an international stage. Through his work, he advocates for the region’s rich musical heritage, ensuring its artists gain the global recognition they deserve. His mission extends beyond production—he is committed to elevating East African music and fostering meaningful connections between cultures through sound.
        </p>
      </div>
    ),
  },
  {
    number: '03',
    title: 'The AfroNile Experience',
    subtitle: 'The story of AfroNile',
    content: (
      <div className="space-y-4">
        <p>
          AfroNile is a story of resilience, rebirth, and the power of music to bridge generations. Formed by Selamino and Dave On The Track, AfroNile embodies the perfect balance of tradition and innovation.
        </p>
        <p>
          Their journey began in the basement studio of Dave’s sister on Accord Drive in Potomac, a humble yet transformative space where creativity flourished. For nearly a year, they immersed themselves in music, dedicating over 10 hours a day to composing, experimenting, and pushing the boundaries of sound. It was in this cocoon of dedication that AfroNile was born, emerging with a unique sonic identity that blends deep musical roots with modern production techniques.
        </p>
        <p>
          Through countless challenges, the difficulty of assembling a like-minded band, and the ever-evolving technological landscape, AfroNile remains undeterred. Rather than resisting change, they embrace it, using technology as a tool to elevate their artistry. Their story is a reminder to musicians everywhere: no matter the obstacles, passion and perseverance will always find a way.
        </p>
        <p>
          With a 70-year-old musician and a young, tech-savvy 30-year-old, their combined years divided by two symbolize the essence of AfroNile; an age of 50. Blending the wisdom of the past with the creativity of the present, AfroNile is a movement. It is hope. And like the legendary Ibex Band & Roha Band before them, their perseverance is destined to pay off.
        </p>
      </div>
    ),
  },
];

function buildChaptersFromBio(_bio: string | null) {
  return FALLBACK_CHAPTERS;
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

const BIOGRAPHY_IMAGES: Record<string, { src: string; alt: string }> = {
  '01': { src: '/selamino-biography.jpg', alt: 'Selamino' },
  '02': { src: '/dave-on-the-track-biography.jpg', alt: 'Dave On The Track' },
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
                'Recording live sessions from the East African analog warehouses. Captured directly to tape for organic tone separation.'}
            </p>
          </div>
        </div>
      </section>

      {/* Editorial Chapter Block */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {chapters.map((chap, i) => {
          const biographyImage = BIOGRAPHY_IMAGES[chap.number];

          return (
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
              <div className={cn(
                "text-xs sm:text-sm text-zinc-400 font-light leading-relaxed",
                biographyImage && "grid gap-6 md:grid-cols-[minmax(0,1fr)_13rem] md:items-start"
              )}>
                <div className="max-w-2xl">{chap.content}</div>
                {biographyImage && (
                  <figure className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-xl">
                    <img
                      src={biographyImage.src}
                      alt={biographyImage.alt}
                      className="aspect-[3/4] w-full object-cover object-top"
                    />
                  </figure>
                )}
              </div>
            </div>
            </div>
          );
        })}
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
            - AfroNile Manifesto, Nile Basin Chapter
          </span>
        </div>
      </section>

    </div>
  );
}
