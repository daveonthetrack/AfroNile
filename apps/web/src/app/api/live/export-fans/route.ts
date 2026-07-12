import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyAdminFromRequest } from '@/lib/auth';

export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const contributions = await prisma.supportContribution.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        email: true,
        phone: true,
        comment: true,
        amountCents: true,
        createdAt: true,
        stripeSessionId: true,
      },
    });

    const paidContributions = contributions.filter(
      (entry) =>
        entry.stripeSessionId &&
        !entry.stripeSessionId.startsWith('mock_stripe_session_') &&
        !entry.stripeSessionId.startsWith('pending_')
    );

    let csv = 'Email,Phone,Donation Amount,Comment,Pledge Date\n';

    const seenEmails = new Set<string>();

    for (const entry of paidContributions) {
      if (!entry.email) continue;
      const cleanEmail = entry.email.trim().toLowerCase();
      if (seenEmails.has(cleanEmail)) continue;
      seenEmails.add(cleanEmail);

      const emailVal = entry.email.replace(/"/g, '""');
      const phoneVal = (entry.phone || '').replace(/"/g, '""');
      const amountVal = `$${(entry.amountCents / 100).toFixed(2)}`;
      const commentVal = (entry.comment || '').replace(/"/g, '""').replace(/\n/g, ' ');
      const dateVal = new Date(entry.createdAt).toISOString();

      csv += `"${emailVal}","${phoneVal}","${amountVal}","${commentVal}","${dateVal}"\n`;
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="afronile_promotional_fans.csv"',
      },
    });
  } catch (error: unknown) {
    console.error('Failed to export promotional fan list:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
