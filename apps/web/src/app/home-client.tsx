'use client';

import React from 'react';
import { Play, ShoppingCart, Ticket, Sparkles, Plus, Disc, Music } from 'lucide-react';
import { EventRow, TicketStatus } from '../modules/commerce/components/event-row';
import { cn } from '../lib/utils';
import { useAudioStore, Track } from '../modules/audio/hooks/useAudioStore';
import { useCartStore } from '../modules/commerce/hooks/useCartStore';
import { SignatureVinyl } from '../components/shared/signature-vinyl';
import Link from 'next/link';
import { resolveProductImageUrl } from '../lib/product-image';

export interface HomeClientProps {
  artist: {
    id: string;
    stageName: string;
    bio: string | null;
    socialLinks: any;
  };
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
    imageUrl: string | null;
  }[];
}

export function HomeClient({ artist, albums, events, products }: HomeClientProps) {
  const { playTrack, currentTrack } = useAudioStore();
  const { addItem } = useCartStore();

  const merchItems = products.filter((p) => p.type === 'MERCHANDISE');
  const ticketProducts = products.filter((p) => p.type === 'TICKET_DIGITAL');

  const handleAddMerchToCart = (item: typeof merchItems[number]) => {
    addItem({
      id: item.id,
      title: item.title,
      priceCents: item.priceCents,
      sku: item.sku,
      type: 'MERCHANDISE',
    });
  };

  const handleAddTicketToCart = (event: typeof events[number], product: typeof ticketProducts[number]) => {
    addItem({
      id: product.id,
      title: `${event.title} (Digital Ticket)`,
      priceCents: product.priceCents,
      sku: product.sku,
      type: 'TICKET_DIGITAL',
    });
  };

  const handleAddAlbumToCart = (album: typeof albums[number]) => {
    const albumSku = `ALBUM_${album.id}`;
    const product = products.find((p) => p.sku === albumSku);
    addItem({
      id: product ? product.id : albumSku,
      title: `${album.title} (Digital Album)`,
      priceCents: album.priceCents,
      sku: albumSku,
      type: 'VIP_EXPERIENCE',
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const renderProductGraphic = (title: string, imageUrl: string | null) => {
    const src = resolveProductImageUrl(imageUrl, title);

    if (src) {
      return (
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 text-zinc-500 gap-2">
        <Disc className="w-12 h-12 stroke-[1] text-zinc-600 animate-spin-continuous" />
        <span className="text-[9px] font-mono tracking-wider">AFRONILE EDITIONS</span>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#020202]">

      {/* Full-Screen Edge-to-Edge Hero Header Section */}
      <section className="relative overflow-hidden w-full min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-20 pb-20 pt-28 group select-none">
        
        {/* Background Hero Image */}
        <img 
          src="/Hero.jpg" 
          alt="AfroNile Hero"
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-20 pointer-events-none transition-opacity duration-700 group-hover:opacity-30 scale-100"
        />
        
        {/* Dark Vignette Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-0" />
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] opacity-40 transition-opacity duration-700 z-0 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full max-w-7xl mx-auto">
          
          {/* Hero Left Typographic Details */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/5 border border-white/10 text-zinc-400 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
              <span>Official Artist Hub</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-black text-white tracking-[0.05em] leading-tight text-gold-shimmer">
              {artist.stageName}
            </h1>
            
            <p className="text-sm md:text-base text-zinc-450 font-light leading-relaxed max-w-xl">
              {artist.bio}
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={() => {
                  if (albums.length > 0 && albums[0].songs.length > 0) {
                    const firstSong = albums[0].songs[0];
                    playTrack({
                      id: firstSong.id,
                      title: firstSong.title,
                      artistName: artist.stageName,
                      coverImageUrl: albums[0].coverImageUrl,
                      audioUrl: firstSong.audioUrl,
                      durationSeconds: firstSong.durationSeconds,
                    });
                  }
                }}
                className="h-11 px-8 rounded-full bg-primary hover:bg-primary/95 text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2 shadow-lg shadow-primary/20 transition active:scale-98"
              >
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                <span>Listen Now</span>
              </button>
              <Link 
                href="/artist"
                className="h-11 px-8 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center justify-center transition backdrop-blur-sm"
              >
                Read Biography
              </Link>
            </div>
          </div>

          {/* Hero Right Turntable Component (Signature Experience) */}
          <div className="lg:col-span-5 flex justify-center w-full">
            <SignatureVinyl />
          </div>

        </div>

        {/* Scroll Indicator details */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-30 hover:opacity-75 transition-opacity duration-300 pointer-events-none">
          <span className="text-[8px] uppercase tracking-[0.25em] text-zinc-500 font-bold font-sans">Scroll to explore</span>
          <div className="h-5 w-3.5 border border-zinc-700 rounded-full flex items-start justify-center p-0.5">
            <div className="w-1 h-1.5 bg-primary rounded-full animate-bounce mt-0.5" />
          </div>
        </div>
      </section>

      {/* Constrained Grid Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-36">
        
        {/* Music & Album section */}
        <section id="discography" className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start scroll-reveal">
          
          {/* Album Artwork Side Card */}
          <div className="lg:col-span-1 glass-card p-6 rounded-[2rem] relative overflow-hidden group">
            {albums.map((album) => (
              <div key={album.id} className="space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/5 group shadow-2xl">
                    <img
                      src={album.coverImageUrl}
                      alt={album.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                      <button 
                        onClick={() => {
                          const playlist: Track[] = album.songs.map((song) => ({
                            id: song.id,
                            title: song.title,
                            artistName: artist.stageName,
                            coverImageUrl: album.coverImageUrl,
                            audioUrl: song.audioUrl,
                            durationSeconds: song.durationSeconds,
                          }));
                          playTrack(playlist[0]);
                        }}
                        className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
                      >
                        <Play className="h-5 w-5 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-primary uppercase tracking-widest block font-mono">Egypt Infused Release</span>
                    <h3 className="text-xl font-serif font-bold text-white tracking-wide">{album.title}</h3>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-mono">Format: Digital FLAC</span>
                    <p className="text-lg font-bold text-white mt-0.5">{formatPrice(album.priceCents)}</p>
                  </div>
                  <button
                    onClick={() => handleAddAlbumToCart(album)}
                    className="h-9 px-5 rounded-full bg-white hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-wider text-black flex items-center gap-1.5 transition active:scale-98"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>Get Album</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tracklist List View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Disc className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">Album Tracklist</h2>
            </div>
            
            <div className="space-y-2">
              {albums.flatMap((album) =>
                album.songs.map((song) => {
                  const isActive = currentTrack?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 group hover:bg-white/[0.02]',
                        isActive
                          ? 'border-primary/20 bg-primary/[0.02]'
                          : 'border-white/5 bg-zinc-900/10'
                      )}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-xs font-bold text-zinc-600 w-4 text-center tabular-nums font-mono">
                          {song.trackNumber.toString().padStart(2, '0')}
                        </span>
                        <button
                          onClick={() =>
                            playTrack({
                              id: song.id,
                              title: song.title,
                              artistName: artist.stageName,
                              coverImageUrl: album.coverImageUrl,
                              audioUrl: song.audioUrl,
                              durationSeconds: song.durationSeconds,
                            })
                          }
                          className={cn(
                            'h-8 w-8 rounded-full border flex items-center justify-center shrink-0 transition shadow-sm',
                            isActive
                              ? 'bg-primary border-primary text-white scale-100'
                              : 'border-white/10 hover:border-white/30 text-zinc-400 hover:text-white bg-zinc-950/40 hover:scale-105 active:scale-95'
                          )}
                        >
                          <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                        </button>
                        <span className={cn('text-xs font-semibold tracking-wide truncate', isActive ? 'text-primary' : 'text-zinc-200')}>
                          {song.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-medium font-mono tabular-nums text-zinc-500">
                        <span>{Math.floor(song.durationSeconds / 60)}:{(song.durationSeconds % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Cinematic Visualizer Banner Section */}
        <section className="space-y-6 scroll-reveal">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <Music className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-lg font-serif font-bold text-white tracking-wide">Soundwave Visualizer</h2>
          </div>
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 aspect-[21/9] md:aspect-[3/1] bg-zinc-950 group shadow-2xl">
            <img 
              src="/Afronile visualizer-5 mb.png" 
              alt="AfroNile Visualizer" 
              className="w-full h-full object-cover opacity-35 transition-transform duration-[3000ms] group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 space-y-2 text-left">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest block font-mono">Cairo Frequency Map</span>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide">Cairo Waveforms</h3>
              <p className="text-[11px] text-zinc-400 max-w-sm font-light leading-relaxed">
                Egypt-infused Afrobeat patterns rendered dynamically. Experience Nile Waves translated visually.
              </p>
            </div>
            
            {/* Visualizer micro-waves decoration */}
            <div className="absolute bottom-10 right-10 flex gap-1 h-8 items-end pointer-events-none opacity-40">
              <div className="w-[1.5px] h-6 bg-primary rounded-full animate-[pulse_0.8s_infinite_alternate]" />
              <div className="w-[1.5px] h-3 bg-primary rounded-full animate-[pulse_1.2s_infinite_alternate_0.2s]" />
              <div className="w-[1.5px] h-8 bg-primary rounded-full animate-[pulse_1.0s_infinite_alternate_0.1s]" />
              <div className="w-[1.5px] h-4 bg-primary rounded-full animate-[pulse_0.7s_infinite_alternate_0.3s]" />
            </div>
          </div>
        </section>

        {/* Tour & Shows Section */}
        <section className="space-y-8 scroll-reveal">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Music className="h-4.5 w-4.5 text-primary" />
              <h2 className="text-lg font-serif font-bold text-white tracking-wide">Tour & Live Dates</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <Ticket className="h-3 w-3 text-primary animate-pulse" />
              <span>QR Ticket Gate Access</span>
            </div>
          </div>

          <div className="space-y-3">
            {events.map((event) => {
              const ticketProd = ticketProducts.find((p) => p.sku === `TICKET_${event.id}`);
              const status: TicketStatus = 
                !ticketProd || ticketProd.stockQuantity === 0 
                  ? 'SOLD_OUT' 
                  : ticketProd.stockQuantity < 10 
                  ? 'LOW_STOCK' 
                  : 'AVAILABLE';

              return (
                <EventRow
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  venueName={event.venueName}
                  venueAddress={event.venueAddress}
                  eventDate={event.eventDate}
                  priceCents={ticketProd?.priceCents || 4500}
                  ticketStatus={status}
                  stockLeft={ticketProd?.stockQuantity ?? 0}
                  onBuyTickets={() => {
                    if (ticketProd) handleAddTicketToCart(event, ticketProd);
                  }}
                />
              );
            })}
          </div>
        </section>

        {/* Merchandise Shop */}
        <section className="space-y-8 scroll-reveal">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <ShoppingCart className="h-4.5 w-4.5 text-primary" />
            <h2 className="text-lg font-serif font-bold text-white tracking-wide">Official Shop</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {merchItems.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-[2rem] p-5 flex flex-col justify-between hover:border-white/10 hover:bg-zinc-900/20 transition-all duration-400 group shadow-md"
              >
                <div className="space-y-5 text-left">
                  <div className="aspect-square rounded-2xl bg-zinc-950/65 border border-white/5 flex items-center justify-center relative overflow-hidden">
                    {renderProductGraphic(item.title, item.imageUrl)}
                    
                    {item.stockQuantity <= 10 && item.stockQuantity > 0 && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 uppercase tracking-wider animate-pulse font-mono">
                        Low Stock
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Boutique Release</span>
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{item.title}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/5">
                  <span className="text-base font-bold text-white tabular-nums font-mono">
                    {formatPrice(item.priceCents)}
                  </span>
                  <button
                    onClick={() => handleAddMerchToCart(item)}
                    disabled={item.stockQuantity === 0}
                    className="h-9 px-5 rounded-full bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 active:scale-98 disabled:bg-zinc-850 disabled:text-zinc-600 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Purchase</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
