'use client';

import React, { useState } from 'react';
import { Play, ShoppingCart, Disc } from 'lucide-react';
import { useAudioStore, Track } from '../../modules/audio/hooks/useAudioStore';
import { cn } from '../../lib/utils';
import { useCartStore } from '../../modules/commerce/hooks/useCartStore';

export interface MusicClientProps {
  artistName: string;
  albums: {
    id: string;
    title: string;
    coverImageUrl: string;
    priceCents: number;
    songs: {
      id: string;
      title: string;
      trackNumber: number;
      audioUrl: string;
      durationSeconds: number;
    }[];
  }[];
  albumProducts: {
    id: string;
    priceCents: number;
    sku: string;
  }[];
}

export function MusicClient({ artistName, albums, albumProducts }: MusicClientProps) {
  const { playTrack, currentTrack } = useAudioStore();
  const { addItem } = useCartStore();
  const [activeAlbumId, setActiveAlbumId] = useState<string>(albums[0]?.id || '');

  const handleAddAlbumToCart = (album: typeof albums[number], product: typeof albumProducts[number]) => {
    addItem({
      id: product.id,
      title: `${album.title} (Digital Album)`,
      priceCents: album.priceCents,
      sku: product.sku,
      type: 'VIP_EXPERIENCE',
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const activeAlbum = albums.find((a) => a.id === activeAlbumId) || albums[0];

  return (
    <div className="space-y-16 pt-16">
      
      {/* Banner */}
      <div className="border-b border-white/5 pb-6 text-left">
        <h1 className="text-4xl font-serif font-black text-white tracking-wide flex items-center gap-3">
          <Disc className="h-7 w-7 text-primary animate-spin-continuous" />
          <span>VINYL ARCHIVE</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-2 font-mono uppercase tracking-widest">
          Egypt-inspired releases • Crate Selection
        </p>
      </div>

      {/* Premium Vinyl Browsing Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: The Vinyl Collection Crate (Sleeve Slider) */}
        <div className="lg:col-span-5 space-y-8 text-left">
          <div className="px-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Select Release Sleeve</span>
          </div>

          <div className="space-y-6">
            {albums.map((album) => {
              const isActive = album.id === activeAlbumId;
              const product = albumProducts.find((p) => p.sku === `ALBUM_${album.id}`);
              
              return (
                <div 
                  key={album.id}
                  onClick={() => setActiveAlbumId(album.id)}
                  className={cn(
                    "cursor-pointer rounded-[2rem] p-5 glass-card relative overflow-hidden transition-all duration-500 group flex gap-5 items-center",
                    isActive ? "border-primary/30 bg-zinc-900/30 scale-102" : "opacity-60 hover:opacity-100"
                  )}
                >
                  {/* Physical Sleeve + Vinyl Slide-out Container */}
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 overflow-visible flex items-center">
                    
                    {/* The Sleeve (Gatefold card cover) */}
                    <div className="relative z-10 w-full h-full rounded-xl overflow-hidden border border-white/10 group-hover:border-primary/20 shadow-lg transition-colors duration-300">
                      <img
                        src={album.coverImageUrl}
                        alt={album.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* The Vinyl Disc sliding out from the sleeve */}
                    <div 
                      className={cn(
                        "absolute rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-2xl transition-all duration-700 ease-out origin-center pointer-events-none",
                        isActive 
                          ? "translate-x-12 rotate-[45deg] opacity-100" 
                          : "translate-x-4 opacity-40 scale-95 group-hover:translate-x-8 group-hover:opacity-75"
                      )}
                      style={{
                        width: '90%',
                        height: '90%',
                        left: '0',
                        backgroundImage: 'radial-gradient(circle, transparent 40%, #161618 40%, #161618 42%, transparent 42%)',
                      }}
                    >
                      {/* Groove texture */}
                      <div className="absolute inset-0.5 rounded-full border border-zinc-850 opacity-50" />
                      <div className="absolute inset-2 rounded-full border border-zinc-850 opacity-40" />
                      <div className="absolute inset-4 rounded-full border border-zinc-900 opacity-40" />
                      
                      {/* Label Cover Center */}
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-black flex items-center justify-center">
                        <img src={album.coverImageUrl} alt="Album label" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>

                  {/* Album Details */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h3 className="text-base font-serif font-bold text-white tracking-wide truncate">
                      {album.title}
                    </h3>
                    <p className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider">
                      {artistName} • Studio Album
                    </p>
                    
                    {isActive && product && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{formatPrice(album.priceCents)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddAlbumToCart(album, product);
                          }}
                          className="h-7 px-3.5 rounded-full bg-primary hover:bg-primary/95 text-[9px] font-bold uppercase tracking-wider text-white flex items-center gap-1 transition active:scale-95 shadow-md"
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>Buy Vinyl</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Tracklist & Liner Booklet */}
        <div className="lg:col-span-7 space-y-8 text-left">
          {activeAlbum ? (
            <div className="glass-card rounded-[2.5rem] p-6 md:p-8 space-y-8 relative overflow-hidden">
              {/* Backglow decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-[80px] pointer-events-none" />

              {/* Album Liner Title */}
              <div className="flex items-start justify-between border-b border-white/5 pb-5">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest font-mono">Currently Loaded Disc</span>
                  <h2 className="text-2xl md:text-3xl font-serif font-black tracking-wide text-white uppercase">{activeAlbum.title}</h2>
                  <p className="text-xs text-zinc-500 font-mono">LINER NOTES & SELECTIONS</p>
                </div>
                
                <button
                  onClick={() => {
                    const playlist: Track[] = activeAlbum.songs.map((s) => ({
                      id: s.id,
                      title: s.title,
                      artistName,
                      coverImageUrl: activeAlbum.coverImageUrl,
                      audioUrl: s.audioUrl,
                      durationSeconds: s.durationSeconds,
                    }));
                    playTrack(playlist[0]);
                  }}
                  className="h-10 w-10 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center transition active:scale-95 shadow-lg"
                >
                  <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
                </button>
              </div>

              {/* Tracks */}
              <div className="space-y-2">
                {activeAlbum.songs.map((song) => {
                  const isActive = currentTrack?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-2xl border transition duration-200 group hover:bg-white/[0.01]',
                        isActive ? 'border-primary/20 bg-primary/[0.02]' : 'border-white/5 bg-zinc-950/20'
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-bold text-zinc-600 w-4 text-center font-mono">
                          {song.trackNumber.toString().padStart(2, '0')}
                        </span>
                        
                        <button
                          onClick={() =>
                            playTrack({
                              id: song.id,
                              title: song.title,
                              artistName,
                              coverImageUrl: activeAlbum.coverImageUrl,
                              audioUrl: song.audioUrl,
                              durationSeconds: song.durationSeconds,
                            })
                          }
                          className={cn(
                            'h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition shadow-sm',
                            isActive ? 'bg-primary border-primary text-white' : 'border-white/10 text-zinc-500 hover:text-white'
                          )}
                        >
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        </button>
                        
                        <span className={cn('text-xs font-semibold tracking-wide truncate', isActive ? 'text-primary' : 'text-zinc-250')}>
                          {song.title}
                        </span>
                      </div>
                      
                      <span className="text-[10px] text-zinc-550 font-mono tabular-nums">
                        {Math.floor(song.durationSeconds / 60)}:{(song.durationSeconds % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500 font-mono border border-dashed border-white/5 rounded-2xl">
              SELECT AN ALBUM SLEEVE TO BROWSE TRACKS
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
