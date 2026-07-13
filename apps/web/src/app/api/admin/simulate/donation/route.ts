import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyToken } from '@repo/auth';
import { getJwtSecret, isProduction } from '@/lib/env';

export const dynamic = 'force-dynamic';

const MOCK_COMMENTS = [
  "Nairobi beats are infectious! Love the new album.",
  "Keep rockin' the Nile Waves! 🌊",
  "AfroNile grooves are on another level. Peace from Kampala!",
  "Saw you guys at The Dome, epic show! Can't wait for the next one.",
  "Africa Unite is a masterpiece track! 🚀",
  "East Africa grooving! Nile waves worldwide.",
  "Support from a lifelong fan. Keep releasing awesome vinyls.",
];

const MOCK_EMAILS = [
  "groover@nile.com",
  "fanatic@nile.ke",
  "beatmaker@soundwaves.org",
  "nairobi.music@dance.net",
  "afrobeat_lover@nairobi.com",
  "vinyl_collector@nile.com",
];

export async function POST(req: NextRequest) {
  if (isProduction()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const payload = verifyToken(token, getJwtSecret());
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const event = await prisma.event.findFirst();

    const amountCents = (Math.floor(Math.random() * 29) + 2) * 500;
    const email = MOCK_EMAILS[Math.floor(Math.random() * MOCK_EMAILS.length)];
    const comment = MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];

    const contribution = await prisma.supportContribution.create({
      data: {
        amountCents,
        email,
        comment,
        eventId: event?.id || null,
        stripeSessionId: `mock_stripe_session_${Date.now()}_${Math.random()}`,
      },
    });

    return NextResponse.json({ success: true, donationId: contribution.id });
  } catch (error: unknown) {
    console.error('Simulate donation creation error:', error);
    return NextResponse.json({ error: 'Internal server error occurred.' }, { status: 500 });
  }
}
