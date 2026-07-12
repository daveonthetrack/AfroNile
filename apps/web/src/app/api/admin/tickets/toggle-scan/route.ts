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

    // 2. Read request body
    const { ticketId, isScanned } = await req.json();
    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required.' }, { status: 400 });
    }

    // 3. Update ticket scanned status
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isScanned,
        scannedAt: isScanned ? new Date() : null
      }
    });

    return NextResponse.json({ success: true, ticketId: ticket.id, isScanned: ticket.isScanned });

  } catch (error: any) {
    console.error('Ticket override toggle scan status error:', error);
    return NextResponse.json({ error: 'Internal server error occurred.' }, { status: 500 });
  }
}
