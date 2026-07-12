import { NextRequest } from 'next/server';
import { prisma } from '@repo/database';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    async start(controller) {
      const sendUpdate = async () => {
        try {
          // Fetch comments
          const comments = await prisma.supportContribution.findMany({
            where: {
              AND: [
                { comment: { not: null } },
                { comment: { not: '' } }
              ]
            },
            orderBy: { createdAt: 'desc' },
            take: 30,
            select: {
              id: true,
              comment: true,
              createdAt: true,
              amountCents: true,
            },
          });

          // Fetch live concert status
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

          let currentSong = null;
          let trackProgress = null;
          if (activeEvent) {
            const songs = activeEvent.artist.albums[0]?.songs || [];
            const totalSongs = songs.length || 10;
            const cycleTimeSeconds = 180;
            const currentUnix = Math.floor(Date.now() / 1000);
            const trackIndex = Math.floor(currentUnix / cycleTimeSeconds) % totalSongs;
            const progressSeconds = currentUnix % cycleTimeSeconds;
            const resolvedSong = songs[trackIndex] || null;

            if (resolvedSong) {
              currentSong = {
                id: resolvedSong.id,
                title: resolvedSong.title,
                trackNumber: resolvedSong.trackNumber,
                durationSeconds: resolvedSong.durationSeconds,
                progressSeconds: Math.min(progressSeconds, resolvedSong.durationSeconds),
              };
            }
            trackProgress = {
              current: trackIndex + 1,
              total: totalSongs,
            };
          }

          const payload = {
            comments,
            liveStatus: activeEvent
              ? {
                  eventId: activeEvent.id,
                  venueName: activeEvent.venueName,
                  venueAddress: activeEvent.venueAddress,
                  tourName: activeEvent.title,
                  currentSong,
                  setlistProgress: trackProgress,
                }
              : null,
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch (err) {
          console.error('SSE data fetch failed:', err);
        }
      };

      // Send first event immediately
      await sendUpdate();

      // Poll database every 5 seconds and push update to active clients
      const interval = setInterval(async () => {
        await sendUpdate();
      }, 5000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
