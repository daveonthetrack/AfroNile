import { prisma } from '@repo/database';
import { buildSignedStreamUrl, signAudioStream } from '@/lib/audio-signing';

export interface AssetDistributionResult {
  authorized: boolean;
  streamUrl?: string;
  expiresAt?: Date;
  error?: 'INVALID_PRODUCT' | 'DATABASE_ERROR';
}

/**
 * Generates a secure, time-limited URL for a public audio stream.
 * Audio bytes are served only via /api/audio/stream after token validation.
 */
export async function authorizeAndDistributeAsset(songId: string): Promise<AssetDistributionResult> {
  try {
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: { album: true },
    });

    if (!song) {
      return { authorized: false, error: 'INVALID_PRODUCT' };
    }

    const expirationMs = 3600 * 1000;
    const expiresAt = new Date(Date.now() + expirationMs);
    const expiresAtMs = expiresAt.getTime();
    const token = signAudioStream(songId, song.audioUrl, expiresAtMs);
    const streamUrl = buildSignedStreamUrl(songId, expiresAtMs, token);

    return {
      authorized: true,
      streamUrl,
      expiresAt,
    };
  } catch (error) {
    console.error('Secure Asset Distribution Error:', error);
    return { authorized: false, error: 'DATABASE_ERROR' };
  }
}
