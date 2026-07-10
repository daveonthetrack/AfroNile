import { NextRequest, NextResponse } from 'next/server';
import { authorizeAndDistributeAsset } from '../../../../modules/audio/assetDistribution';

/**
 * GET /api/audio/[songId]
 * Exposes a secure gateway to retrieve time-limited signed audio URLs.
 * Checks user purchase history before permitting access to audio assets.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { songId: string } }
) {
  try {
    const { songId } = params;
    
    // Retrieve userId from query params to simulate session access checks
    // In production, this would read from Next-Auth or Iron Session cookies.
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!songId) {
      return NextResponse.json(
        { error: 'SONG_ID_REQUIRED', message: 'Song ID parameter is required.' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'User session or ID is required.' },
        { status: 401 }
      );
    }

    // Call secure asset distribution validation logic
    const authResult = await authorizeAndDistributeAsset(userId, songId);

    if (!authResult.authorized) {
      if (authResult.error === 'INVALID_PRODUCT') {
        return NextResponse.json(
          { error: 'SONG_NOT_FOUND', message: 'The requested song does not exist.' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { 
          error: 'PURCHASE_REQUIRED', 
          message: 'Access denied. You must purchase the album to stream this audio track.' 
        },
        { status: 403 }
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
