import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyToken } from '@repo/auth';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-artist-monolith';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const payload = verifyToken(token, JWT_SECRET) as any;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // 2. Reset all ticket scan states
    await prisma.ticket.updateMany({
      data: {
        isScanned: false,
        scannedAt: null
      }
    });

    return NextResponse.json({ success: true, message: 'All database ticket scan logs have been reset.' });

  } catch (error: any) {
    console.error('Ticket reset scans error:', error);
    return NextResponse.json({ error: 'Internal server error occurred.' }, { status: 500 });
  }
}
