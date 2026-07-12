import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, existsSync, statSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';
import { prisma } from '@repo/database';
import { verifyAudioStreamToken } from '@/lib/audio-signing';

export const dynamic = 'force-dynamic';

function resolveAudioFilePath(audioUrl: string): string | null {
  if (!audioUrl.startsWith('/audio/')) {
    return null;
  }

  const relativePath = audioUrl.replace(/^\//, '');
  const absolutePath = join(process.cwd(), 'public', relativePath);

  if (!absolutePath.startsWith(join(process.cwd(), 'public', 'audio'))) {
    return null;
  }

  return existsSync(absolutePath) ? absolutePath : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { songId: string } }
) {
  try {
    const { songId } = params;
    const token = req.nextUrl.searchParams.get('token');
    const expiresParam = req.nextUrl.searchParams.get('expires');

    if (!songId || !token || !expiresParam) {
      return NextResponse.json({ error: 'MISSING_STREAM_CREDENTIALS' }, { status: 400 });
    }

    const expiresAtMs = parseInt(expiresParam, 10);

    const song = await prisma.song.findUnique({
      where: { id: songId },
      select: { audioUrl: true },
    });

    if (!song) {
      return NextResponse.json({ error: 'SONG_NOT_FOUND' }, { status: 404 });
    }

    if (!verifyAudioStreamToken(songId, song.audioUrl, expiresAtMs, token)) {
      return NextResponse.json({ error: 'INVALID_OR_EXPIRED_TOKEN' }, { status: 403 });
    }

    const filePath = resolveAudioFilePath(song.audioUrl);
    if (!filePath) {
      return NextResponse.json({ error: 'AUDIO_FILE_NOT_FOUND' }, { status: 404 });
    }

    const fileStat = statSync(filePath);
    const fileSize = fileStat.size;
    const range = req.headers.get('range');

    if (range) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (!match) {
        return new NextResponse('Invalid Range', { status: 416 });
      }

      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse('Range Not Satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunkSize = end - start + 1;
      const stream = createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(stream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'private, no-store',
        },
      });
    }

    const stream = createReadStream(filePath);
    const webStream = Readable.toWeb(stream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error: unknown) {
    console.error('Audio stream proxy error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
