import { prisma } from '@repo/database';
import { buildSignedStreamUrl, signAudioStream } from '@/lib/audio-signing';

export interface AssetDistributionResult {
  authorized: boolean;
  streamUrl?: string;
  expiresAt?: Date;
  error?: 'UNAUTHORIZED' | 'ORDER_NOT_FOUND' | 'INVALID_PRODUCT' | 'DATABASE_ERROR';
}

/**
 * Handles secure asset authorization and signed streaming URL generation.
 * Audio bytes are served only via /api/audio/stream after token validation.
 */
export async function authorizeAndDistributeAsset(
  userId: string,
  songId: string
): Promise<AssetDistributionResult> {
  try {
    const song = await prisma.song.findUnique({
      where: { id: songId },
      include: { album: true },
    });

    if (!song) {
      return { authorized: false, error: 'INVALID_PRODUCT' };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    const isAdminUser = user?.role?.name === 'ADMIN';

    const albumSku = `ALBUM_${song.album.id}`;

    const paidPurchase = await prisma.order.findFirst({
      where: {
        userId,
        status: 'PAID',
        orderItems: {
          some: {
            product: { sku: albumSku },
          },
        },
      },
    });

    if (!paidPurchase && !isAdminUser) {
      return { authorized: false, error: 'UNAUTHORIZED' };
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
