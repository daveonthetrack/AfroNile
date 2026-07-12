import React from 'react';
import { prisma } from '@repo/database';
import { LiveClient } from './live-client';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Concert Live Companion | AfroNile',
  description: 'Connect with the live concert screen in real-time. Share your reflections, check in via QR, and support the performance live.',
};

export default async function LiveCompanionPage() {
  const artist = await prisma.artist.findFirst({
    where: { slug: 'afronile' },
  });

  if (!artist) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Database Seed Data Missing</h2>
        <p className="text-sm text-zinc-500 max-w-sm">Please initialize the database with seeds.</p>
      </div>
    );
  }

  const albums = await prisma.album.findMany({
    where: { artistId: artist.id },
    include: {
      songs: {
        orderBy: { trackNumber: 'asc' },
      },
    },
  });

  const events = await prisma.event.findMany({
    where: { artistId: artist.id },
    orderBy: { eventDate: 'asc' },
  });

  const products = await prisma.product.findMany({
    orderBy: { priceCents: 'asc' },
  });

  return (
    <LiveClient
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
