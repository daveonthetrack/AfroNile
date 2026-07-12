import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { getSessionUser, getTokenFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'EVENT_ID_REQUIRED' }, { status: 400 });
    }

    const sessionUser = getSessionUser(getTokenFromCookies());
    const userId = sessionUser?.userId ?? null;

    if (!userId) {
      return NextResponse.json({ success: true, anonymous: true });
    }

    const existingCheckIn = await prisma.concertCheckIn.findFirst({
      where: { userId, eventId },
    });

    if (existingCheckIn) {
      return NextResponse.json({ success: true, alreadyCheckedIn: true });
    }

    await prisma.concertCheckIn.create({
      data: {
        userId,
        eventId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to check in:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
