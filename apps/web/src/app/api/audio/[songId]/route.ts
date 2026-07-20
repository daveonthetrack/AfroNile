import { NextRequest, NextResponse } from 'next/server';
import { authorizeAndDistributeAsset } from '../../../../modules/audio/assetDistribution';

/**
 * GET /api/audio/[songId]
 * Returns a time-limited signed URL for a public audio stream.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { songId: string } }
) {
  try {
    const { songId } = params;

    if (!songId) {
      return NextResponse.json(
        { error: 'SONG_ID_REQUIRED', message: 'Song ID parameter is required.' },
        { status: 400 }
      );
    }

    const authResult = await authorizeAndDistributeAsset(songId);

    if (!authResult.authorized) {
      if (authResult.error === 'INVALID_PRODUCT') {
        return NextResponse.json(
          { error: 'SONG_NOT_FOUND', message: 'The requested song does not exist.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'STREAM_UNAVAILABLE', message: 'This audio stream is currently unavailable.' },
        { status: 503 }
      );
    }

    // Return the signed temporary stream URL to the audio player
    return NextResponse.json({
      success: true,
      songId,
      streamUrl: authResult.streamUrl,
      expiresAt: authResult.expiresAt,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Audio Stream API Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_SERVER_ERROR', message: error.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}

