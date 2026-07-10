import React from 'react';
import { prisma } from '@repo/database';
import { HomeClient } from './home-client';

// Disable next caching to ensure real-time inventory levels are retrieved
export const revalidate = 0;

export default async function HomePage() {
  // 1. Fetch artist details
  const artist = await prisma.artist.findFirst({
    where: { slug: 'afronile' },
  });

  if (!artist) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
        <div className="h-12 w-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
          <span className="text-zinc-500 font-mono">?</span>
        </div>
        <h2 className="text-xl font-bold text-white">Database Seed Data Missing</h2>
        <p className="text-sm text-zinc-500 max-w-sm">
          No artist profile exists. Please initialize the database with `pnpm --filter=@repo/database run db:seed`.
        </p>
      </div>
    );
  }

  // 2. Fetch albums & tracklists
  const albums = await prisma.album.findMany({
    where: { artistId: artist.id },
    include: {
      songs: {
        orderBy: { trackNumber: 'asc' },
      },
    },
  });

  // 4. Fetch upcoming events
  const events = await prisma.event.findMany({
    where: { artistId: artist.id },
    orderBy: { eventDate: 'asc' },
  });

  // 5. Fetch all catalog products (merchandise, tickets)
  const products = await prisma.product.findMany({
    orderBy: { priceCents: 'asc' },
  });

  return (
    <HomeClient
      artist={{
        id: artist.id,
        stageName: artist.stageName,
        bio: artist.bio,
        socialLinks: artist.socialLinks,
      }}
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
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        venueName: e.venueName,
        venueAddress: e.venueAddress,
        eventDate: e.eventDate,
      }))}
      products={products.map((p) => ({
        id: p.id,
        type: p.type,
        title: p.title,
        priceCents: p.priceCents,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
      }))}
    />
  );
}
