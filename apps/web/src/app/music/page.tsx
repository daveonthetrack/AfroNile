import React from 'react';
import { prisma } from '@repo/database';
import { MusicClient } from './music-client';
import type { Metadata } from 'next';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Discography & Audio Player | AfroNile',
  description: 'Explore and stream the complete Nile Waves discography. Unlock high-fidelity streams by purchasing albums directly from the artist.',
};

export default async function MusicPage() {
  // 1. Fetch artist details
  const artist = await prisma.artist.findFirst({
    where: { slug: 'afronile' },
  });

  if (!artist) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Artist profile data not found. Please run seed script.
      </div>
    );
  }

  // 3. Fetch albums & tracklists
  const albums = await prisma.album.findMany({
    where: { artistId: artist.id },
    include: {
      songs: {
        orderBy: { trackNumber: 'asc' },
      },
    },
  });

  // 4. Fetch album products
  const albumProducts = await prisma.product.findMany({
    where: { type: 'VIP_EXPERIENCE', sku: { startsWith: 'ALBUM_' } },
  });

  return (
    <MusicClient
      artistName={artist.stageName}
      albums={albums.map((a) => ({
        id: a.id,
        title: a.title,
        coverImageUrl: a.coverImageUrl,
        priceCents: a.priceCents,
        songs: a.songs.map((s) => ({
          id: s.id,
          title: s.title,
          trackNumber: s.trackNumber,
          audioUrl: s.audioUrl,
          durationSeconds: s.durationSeconds,
        })),
      }))}
      albumProducts={albumProducts.map((p) => ({
        id: p.id,
        priceCents: p.priceCents,
        sku: p.sku,
      }))}
    />
  );
}
