'use client';

import React from 'react';
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

  return (
    <div className="space-y-12">
      {/* Banner */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Disc className="h-8 w-8 text-primary" />
          <span>Discography</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Explore and stream high-fidelity studio releases directly from the artist source.</p>
      </div>

      {/* Album listings */}
      <div className="space-y-16">
        {albums.map((album) => {
          const product = albumProducts.find((p) => p.sku === `ALBUM_${album.id}`);
          
          return (
            <div key={album.id} className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 rounded-2xl bg-zinc-900/10 border border-white/5 backdrop-blur-sm">
              
              {/* Album art column */}
              <div className="md:col-span-1 space-y-6">
                <div className="aspect-square w-full relative overflow-hidden rounded-xl border border-white/10 group">
                  <img
                    src={album.coverImageUrl}
                    alt={album.title}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-102"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <button
                      onClick={() => {
                        const playlist: Track[] = album.songs.map((s) => ({
                          id: s.id,
                          title: s.title,
                          artistName,
                          coverImageUrl: album.coverImageUrl,
                          audioUrl: s.audioUrl,
                          durationSeconds: s.durationSeconds,
                        }));
                        playTrack(playlist[0]);
                      }}
                      className="h-12 w-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform active:scale-95 transition"
                    >
                      <Play className="h-5 w-5 fill-current ml-0.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">{album.title}</h2>
                  <p className="text-xs text-zinc-500 mt-1">{artistName} • Studio Album</p>
                </div>

                {product && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Digital Album Price</span>
                      <span className="text-base font-extrabold text-white">{formatPrice(album.priceCents)}</span>
                    </div>
                    <button
                      onClick={() => handleAddAlbumToCart(album, product)}
                      className="h-9 px-4 rounded bg-primary hover:bg-primary/95 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Songs Tracklist column */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Tracks</h3>
                <div className="space-y-1.5">
                  {album.songs.map((song) => {
                    const isActive = currentTrack?.id === song.id;
                    return (
                      <div
                        key={song.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition duration-200',
                          isActive ? 'border-primary/20 bg-primary/5' : 'border-white/5 bg-zinc-950/40 hover:bg-zinc-900/40'
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="text-xs font-mono text-zinc-600 w-4 text-center tabular-nums">{song.trackNumber}</span>
                          <button
                            onClick={() =>
                              playTrack({
                                id: song.id,
                                title: song.title,
                                artistName,
                                coverImageUrl: album.coverImageUrl,
                                audioUrl: song.audioUrl,
                                durationSeconds: song.durationSeconds,
                              })
                            }
                            className={cn(
                              'h-7 w-7 rounded-full border flex items-center justify-center transition shrink-0',
                              isActive ? 'bg-primary border-primary text-white' : 'border-white/10 text-zinc-400 hover:text-white'
                            )}
                          >
                            <Play className="h-3 w-3 fill-current ml-0.5" />
                          </button>
                          <span className={cn('text-sm truncate', isActive ? 'text-primary font-medium' : 'text-white')}>
                            {song.title}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 font-mono tabular-nums">
                          {Math.floor(song.durationSeconds / 60)}:{(song.durationSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
