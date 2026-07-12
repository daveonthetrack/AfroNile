import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.redirect(new URL('/shop?error=missing_order_id', req.url));
  }

  if (!sessionId) {
    return NextResponse.redirect(new URL('/shop?error=missing_session_id', req.url));
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.redirect(new URL(`/shop?error=order_not_found&order_id=${orderId}`, req.url));
    }

    if (order.status === 'PAID') {
      return NextResponse.redirect(new URL(`/tickets?success=true&order_id=${orderId}`, req.url));
    }

    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.redirect(new URL(`/shop?error=payment_failed&order_id=${orderId}`, req.url));
    }

    if (session.metadata?.orderId !== orderId) {
      return NextResponse.redirect(new URL('/shop?error=session_mismatch', req.url));
    }

    // Poll briefly for webhook fulfillment (read-only — never writes to DB)
    let currentStatus: string = order.status;
    for (let attempt = 0; attempt < 10 && currentStatus === 'PENDING'; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const refreshed = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });
      currentStatus = refreshed?.status ?? 'PENDING';
    }

    if (currentStatus === 'PAID') {
      return NextResponse.redirect(new URL(`/tickets?success=true&order_id=${orderId}`, req.url));
    }

    return NextResponse.redirect(new URL(`/tickets?processing=true&order_id=${orderId}`, req.url));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Checkout success verification error:', error);
    return NextResponse.redirect(
      new URL(`/shop?error=verification_failed&message=${encodeURIComponent(message)}`, req.url)
    );
  }
}
