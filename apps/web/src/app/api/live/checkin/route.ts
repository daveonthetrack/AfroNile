import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'EVENT_ID_REQUIRED' }, { status: 400 });
    }

    // Resolve userId from auth cookie
    const token = cookies().get('token')?.value;
    let userId: string | null = null;

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(payloadBase64));
          const user = await prisma.user.findUnique({
            where: { email: decoded.email },
          });
          if (user) {
            userId = user.id;
          }
        }
      } catch (e) {
        console.error('Failed to decode user in checkin:', e);
      }
    }

    if (!userId) {
      // Safe non-blocking response for anonymous users (from QR codes)
      return NextResponse.json({ success: true, anonymous: true });
    }

    // Enforce uniqueness to prevent double check-ins
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
  } catch (error: any) {
    console.error('Failed to check in:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
