'use client';

import React from 'react';
import { Play, ShoppingCart, Ticket, Sparkles, Plus, Disc, Music } from 'lucide-react';
import { EventRow, TicketStatus } from '../modules/commerce/components/event-row';
import { cn } from '../lib/utils';
import { useAudioStore, Track } from '../modules/audio/hooks/useAudioStore';
import { useCartStore } from '../modules/commerce/hooks/useCartStore';

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

  const renderProductGraphic = (title: string) => {
    const name = title.toLowerCase();
    if (name.includes('shirt') || name.includes('tee') || name.includes('hoodie') || name.includes('apparel')) {
      return (
        <img 
          src="/Tshirt.png" 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      );
    }
    if (name.includes('hat') || name.includes('cap') || name.includes('beanie')) {
      return (
        <svg className="w-20 h-20 text-zinc-700 stroke-[0.75] transition-transform duration-500 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 17 C3 9, 13 9, 13 17 Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 17 C 14 17, 21 18, 21 16 C 21 14, 13 15, 11 17" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="11" r="1.5" />
        </svg>
      );
    }
    return (
      <svg className="w-20 h-20 text-zinc-700 stroke-[0.75] transition-transform duration-500 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    );
  };

  return (
    <div className="w-full">

      {/* Full-Screen Edge-to-Edge Hero Header Section */}
      <section className="relative overflow-hidden bg-zinc-950 w-full min-h-[92vh] flex flex-col justify-end px-6 md:px-12 lg:px-20 pb-20 md:pb-28 pt-36 -mt-16 group select-none">
        {/* Background Loop Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-40 pointer-events-none transition-opacity duration-700 group-hover:opacity-50 scale-102"
        >
          <source src="/AfroNile Logo Animated.mp4" type="video/mp4" />
        </video>
        
        {/* Dark Vignette Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent z-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/50 via-transparent to-transparent z-0" />
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] opacity-40 group-hover:opacity-60 transition-opacity duration-700 z-0 pointer-events-none" />
        
        <div className="relative z-10 space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-zinc-400 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Official Artist Hub</span>
          </div>
          <h1 className="text-7xl md:text-9xl font-extrabold text-white tracking-tighter leading-none">
            {artist.stageName}
          </h1>
          <p className="text-base md:text-xl text-zinc-300 font-light leading-relaxed max-w-2xl">
            {artist.bio}
          </p>
          
          <div className="flex flex-wrap gap-4 pt-6">
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
              className="h-12 px-8 rounded-full bg-primary hover:bg-primary/95 text-sm font-semibold text-white flex items-center gap-2.5 shadow-lg shadow-primary/20 transition active:scale-98"
            >
              <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
              <span>Listen Now</span>
            </button>
            <a 
              href="#discography"
              className="h-12 px-8 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-semibold text-zinc-200 flex items-center justify-center transition backdrop-blur-sm"
            >
              View Discography
            </a>
          </div>
        </div>

        {/* Scroll Indicator details */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-50 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium font-sans">Scroll to explore</span>
          <div className="h-6 w-4 border border-zinc-500 rounded-full flex items-start justify-center p-1">
            <div className="w-1 h-1 bg-white rounded-full animate-bounce mt-0.5" />
          </div>
        </div>
      </section>

      {/* Constrained Grid Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        
        {/* Music & Album section */}
        <section id="discography" className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Album Artwork Side Card */}
          <div className="lg:col-span-1 bg-zinc-900/10 border border-white/5 p-8 rounded-3xl backdrop-blur-md">
            {albums.map((album) => (
              <div key={album.id} className="space-y-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 group shadow-2xl">
                    <img
                      src={album.coverImageUrl}
                      alt={album.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
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
                        className="h-14 w-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg"
                      >
                        <Play className="h-6 w-6 fill-current ml-0.5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Studio Album</span>
                    <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{album.title}</h3>
                  </div>
                </div>

                <div className="border-t border-white/5 pt-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Format: Digital FLAC</span>
                    <p className="text-2xl font-extrabold text-white mt-1">{formatPrice(album.priceCents)}</p>
                  </div>
                  <button
                    onClick={() => handleAddAlbumToCart(album)}
                    className="h-10 px-5 rounded-full bg-white hover:bg-zinc-200 text-xs font-semibold text-black flex items-center gap-1.5 transition active:scale-98"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tracklist List View */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 px-1">
              <Disc className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-white tracking-tight">Album Tracklist</h2>
            </div>
            
            <div className="space-y-2.5">
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
                        <span className="text-xs font-bold text-zinc-600 w-4 text-center tabular-nums">
                          {song.trackNumber}
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
                            'h-9 w-9 rounded-full border flex items-center justify-center shrink-0 transition shadow-sm',
                            isActive
                              ? 'bg-primary border-primary text-white scale-100'
                              : 'border-white/10 hover:border-white/30 text-zinc-400 hover:text-white bg-zinc-950/40 hover:scale-105 active:scale-95'
                          )}
                        >
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        </button>
                        <span className={cn('text-sm font-semibold truncate', isActive ? 'text-primary' : 'text-zinc-200')}>
                          {song.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-semibold tabular-nums text-zinc-500">
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
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <Music className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Visualizer Experience</h2>
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-white/5 aspect-[21/9] md:aspect-[3/1] bg-zinc-900 group shadow-2xl">
            <img 
              src="/Afronile visualizer-5 mb.png" 
              alt="AfroNile Visualizer" 
              className="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 space-y-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Soundwave Canvas</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none">Immersive Cairo Waveforms</h3>
              <p className="text-xs md:text-sm text-zinc-400 max-w-md font-light leading-relaxed">
                Egypt-infused Afrobeat patterns rendered dynamically. Experience Nile Waves translated visually.
              </p>
            </div>
          </div>
        </section>

        {/* Tour & Shows Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold text-white tracking-tight">Tour & Live Dates</h2>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-zinc-400 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
              <Ticket className="h-3.5 w-3.5 text-primary" />
              <span>Cryptographic QR Access</span>
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
        <section className="space-y-8">
          <div className="flex items-center gap-2 border-b border-white/5 pb-4">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Official Shop</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {merchItems.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900/10 border border-white/5 rounded-3xl p-6 flex flex-col justify-between hover:border-white/10 hover:bg-zinc-900/20 transition-all duration-300 group shadow-md"
              >
                <div className="space-y-6">
                  <div className="aspect-square rounded-2xl bg-zinc-950/65 border border-white/5 flex items-center justify-center relative overflow-hidden">
                    {renderProductGraphic(item.title)}
                    
                    {item.stockQuantity <= 10 && item.stockQuantity > 0 && (
                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-wider animate-pulse">
                        Low Stock
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Limited Edition</span>
                    <h3 className="text-base font-bold text-white truncate">{item.title}</h3>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                  <span className="text-xl font-extrabold text-white tabular-nums">
                    {formatPrice(item.priceCents)}
                  </span>
                  <button
                    onClick={() => handleAddMerchToCart(item)}
                    disabled={item.stockQuantity === 0}
                    className="h-10 px-5 rounded-full bg-primary hover:bg-primary/95 text-white text-xs font-semibold transition flex items-center gap-1.5 active:scale-98 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Cart</span>
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
