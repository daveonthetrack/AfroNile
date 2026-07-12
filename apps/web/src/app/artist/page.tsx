import React from 'react';
import { prisma } from '@repo/database';
import { ArtistClient } from './artist-client';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Biography & Documentary | AfroNile',
  description: 'Uncover the story, origins, and cryptographic musical architecture of AfroNile.',
};

export default async function ArtistDocPage() {
  const artist = await prisma.artist.findFirst({
    where: { slug: 'afronile' },
  });

  if (!artist) {
    return (
      <div className="text-center py-12 text-zinc-500 font-mono">
        Artist profile data not found. Please run the seed script.
      </div>
    );
  }

  return (
    <ArtistClient
      artist={{
        id: artist.id,
        stageName: artist.stageName,
        bio: artist.bio,
        socialLinks: (artist.socialLinks as Record<string, string>) ?? null,
      }}
    />
  );
}
