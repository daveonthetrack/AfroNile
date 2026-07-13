import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { existsSync, createReadStream, statSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

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
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return new NextResponse('Download token is required.', { status: 400 });
    }

    // Retrieve download record from database
    const downloadRecord = await prisma.download.findUnique({
      where: { downloadToken: token },
      include: {
        product: true,
        user: true,
      },
    });

    if (!downloadRecord) {
      return renderErrorPage('INVALID_TOKEN', 'The download link is invalid or does not exist.');
    }

    if (downloadRecord.expiresAt < new Date()) {
      return renderErrorPage('EXPIRED_LINK', 'This digital download link has expired (valid for 30 days post-purchase).');
    }

    const albumId = downloadRecord.product.sku.replace('ALBUM_', '');
    const { searchParams } = new URL(req.url);
    const songId = searchParams.get('songId');

    // Case 1: Serving file download stream for a specific song ID
    if (songId) {
      const song = await prisma.song.findFirst({
        where: { id: songId, albumId },
      });

      if (!song) {
        return new NextResponse('Requested song not found in this album vault.', { status: 404 });
      }

      const filePath = resolveAudioFilePath(song.audioUrl);
      if (!filePath) {
        return new NextResponse('Audio asset file not found on server storage.', { status: 404 });
      }

      const fileStat = statSync(filePath);
      const stream = createReadStream(filePath);
      const webStream = Readable.toWeb(stream) as ReadableStream;

      // Log a download audit analytics event
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'DIGITAL_DOWNLOAD',
          userId: downloadRecord.userId,
          details: JSON.stringify({
            productId: downloadRecord.productId,
            songId,
            songTitle: song.title,
          }),
        },
      });

      const sanitizedFilename = song.title.replace(/[^a-zA-Z0-9-_ ]/g, '') || 'Track';

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': fileStat.size.toString(),
          'Content-Disposition': `attachment; filename="${sanitizedFilename}.mp3"`,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    // Case 2: Render a gorgeous, customer-facing digital download index webpage
    const songs = await prisma.song.findMany({
      where: { albumId },
      orderBy: { trackNumber: 'asc' },
    });

    return renderDownloadPage(downloadRecord.product.title, songs, token, downloadRecord.user.email);

  } catch (error) {
    console.error('Digital download retrieval error:', error);
    return new NextResponse('Internal server error processing download.', { status: 500 });
  }
}

function renderErrorPage(code: string, message: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vault Access Blocked | AfroNile</title>
      <style>
        body {
          background-color: #050505;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background: rgba(18, 18, 18, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 51, 102, 0.15);
          border-radius: 24px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .icon {
          color: #ff3366;
          font-size: 48px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        h1 {
          font-size: 20px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0 0 10px 0;
        }
        p {
          font-size: 13px;
          color: #aaa;
          line-height: 1.6;
          margin: 0 0 24px 0;
        }
        .btn {
          display: inline-block;
          background: #ff3366;
          color: #fff;
          text-decoration: none;
          padding: 12px 32px;
          border-radius: 30px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: transform 0.2s;
        }
        .btn:hover {
          transform: translateY(-2px);
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">⚠️</div>
        <h1>ACCESS BLOCKED</h1>
        <p>${message}</p>
        <div style="font-size: 9px; color: #555; font-family: monospace; margin-bottom: 20px;">Code: ${code}</div>
        <a href="/shop" class="btn">Return to Boutique</a>
      </div>
    </body>
    </html>
  `;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

function renderDownloadPage(albumTitle: string, songs: any[], token: string, userEmail: string) {
  const songRows = songs
    .map(
      (song) => `
    <div class="track-row">
      <div class="track-info">
        <span class="track-num">${String(song.trackNumber).padStart(2, '0')}</span>
        <span class="track-title">${song.title}</span>
      </div>
      <a href="/api/downloads/${token}?songId=${song.id}" class="dl-btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Download</span>
      </a>
    </div>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Digital Download Vault | ${albumTitle}</title>
      <style>
        body {
          background-color: #070707;
          color: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 40px 20px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-sizing: border-box;
        }
        .container {
          max-width: 600px;
          width: 100%;
          background: rgba(15, 15, 15, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 32px;
          padding: 40px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8);
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }
        .container::before {
          content: '';
          position: absolute;
          top: -150px;
          left: 50%;
          transform: translateX(-50%);
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .header {
          text-align: center;
          margin-bottom: 35px;
          position: relative;
          z-index: 10;
        }
        .badge {
          display: inline-block;
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: #818cf8;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 15px;
        }
        h1 {
          font-size: 24px;
          font-weight: 900;
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }
        .meta {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .meta span {
          color: #aaa;
        }
        .tracklist {
          border: 1px solid rgba(255, 255, 255, 0.03);
          background: rgba(5, 5, 5, 0.6);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 25px;
        }
        .track-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          transition: background-color 0.2s;
        }
        .track-row:last-child {
          border-bottom: none;
        }
        .track-row:hover {
          background-color: rgba(255, 255, 255, 0.01);
        }
        .track-info {
          display: flex;
          align-items: center;
          min-width: 0;
        }
        .track-num {
          font-family: monospace;
          color: #666;
          font-size: 12px;
          margin-right: 15px;
          font-weight: bold;
        }
        .track-title {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dl-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #ccc;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.2s;
          cursor: pointer;
        }
        .dl-btn:hover {
          background: #ffffff;
          color: #000;
          border-color: #ffffff;
          transform: translateY(-1px);
        }
        .footer {
          text-align: center;
          font-size: 10px;
          color: #444;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="badge">SECURE DIGITAL VAULT</div>
          <h1>${albumTitle}</h1>
          <div class="meta">Licensed to: <span>${userEmail}</span></div>
        </div>
        
        <div class="tracklist">
          ${songRows}
        </div>
        
        <div class="footer">
          AfroNile Independent Distribution &bull; Secure Tokenized Asset Link
        </div>
      </div>
    </body>
    </html>
  `;
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
