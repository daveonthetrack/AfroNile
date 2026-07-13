import { NextResponse } from 'next/server';
import { prisma } from '@repo/database';

export const revalidate = 0;

export async function GET() {
  try {
    const comments = await prisma.supportContribution.findMany({
      where: {
        AND: [
          { comment: { not: null } },
          { comment: { not: '' } },
          { stripeSessionId: { not: null } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: {
        id: true,
        comment: true,
        createdAt: true,
        amountCents: true,
      },
    });

    return NextResponse.json({ success: true, comments }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch comments:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
