import crypto from 'crypto';
import { getAssetSigningSecret } from './env';

export function signAudioStream(songId: string, audioPath: string, expiresAtMs: number): string {
  const payload = `${songId}:${audioPath}:${expiresAtMs}`;
  return crypto.createHmac('sha256', getAssetSigningSecret()).update(payload).digest('hex');
}

export function verifyAudioStreamToken(
  songId: string,
  audioPath: string,
  expiresAtMs: number,
  token: string
): boolean {
  if (!token || Number.isNaN(expiresAtMs) || expiresAtMs < Date.now()) {
    return false;
  }

  const expected = signAudioStream(songId, audioPath, expiresAtMs);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(token, 'hex'));
  } catch {
    return false;
  }
}

export function buildSignedStreamUrl(songId: string, expiresAtMs: number, token: string): string {
  return `/api/audio/stream/${songId}?token=${token}&expires=${expiresAtMs}`;
}
