import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';

export const revalidate = 0;

export async function GET() {
  try {
    // Fetch the active show profile (seeded release tour)
    const activeEvent = await prisma.event.findFirst({
      orderBy: { eventDate: 'asc' },
      include: {
        artist: {
          include: {
            albums: {
              include: {
                songs: {
                  orderBy: { trackNumber: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!activeEvent) {
      return NextResponse.json({ error: 'NO_ACTIVE_EVENT' }, { status: 404 });
    }

    const songs = activeEvent.artist.albums[0]?.songs || [];
    const totalSongs = songs.length || 10;

    // Simulate track cycles based on server time
    const cycleTimeSeconds = 180; // 3 minutes per track simulation
    const currentUnix = Math.floor(Date.now() / 1000);
    const trackIndex = Math.floor(currentUnix / cycleTimeSeconds) % totalSongs;
    const progressSeconds = currentUnix % cycleTimeSeconds;

    const currentSong = songs[trackIndex] || null;

    return NextResponse.json({
      eventId: activeEvent.id,
      venueName: activeEvent.venueName,
      venueAddress: activeEvent.venueAddress,
      tourName: activeEvent.title,
      currentSong: currentSong
        ? {
            id: currentSong.id,
            title: currentSong.title,
            trackNumber: currentSong.trackNumber,
            durationSeconds: currentSong.durationSeconds,
            progressSeconds: Math.min(progressSeconds, currentSong.durationSeconds),
          }
        : null,
      setlistProgress: {
        current: trackIndex + 1,
        total: totalSongs,
      },
    });
  } catch (error: any) {
    console.error('Failed to get live status:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
