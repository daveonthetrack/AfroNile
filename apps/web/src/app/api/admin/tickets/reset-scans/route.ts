import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyAdminFromRequest } from '@/lib/auth';
import { isProduction } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (isProduction()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

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
