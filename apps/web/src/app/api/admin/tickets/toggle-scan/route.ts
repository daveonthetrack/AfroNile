import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

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
