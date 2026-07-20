import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getJwtSecret, getStripeSecretKey } from '@/lib/env';
import { verifyToken } from '@repo/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentIntentId = searchParams.get('payment_intent');
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.redirect(new URL('/shop?error=missing_order_id', req.url));
  }

  if (!paymentIntentId) {
    return NextResponse.redirect(new URL('/shop?error=missing_payment_intent_id', req.url));
  }

  try {
    const token = req.cookies.get('token')?.value;
    const sessionUser = token ? verifyToken(token, getJwtSecret()) : null;
    if (!sessionUser) {
      return NextResponse.redirect(new URL('/login?redirect=/orders', req.url));
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== sessionUser.userId || order.stripePaymentIntentId !== paymentIntentId) {
      return NextResponse.redirect(new URL(`/shop?error=order_not_found&order_id=${orderId}`, req.url));
    }

    if (order.status === 'PAID') {
      return NextResponse.redirect(new URL(`/orders?success=true&order_id=${orderId}`, req.url));
    }

    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
    });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.redirect(new URL(`/shop?error=payment_failed&order_id=${orderId}`, req.url));
    }

    if (paymentIntent.metadata.orderId !== orderId) {
      return NextResponse.redirect(new URL('/shop?error=payment_intent_mismatch', req.url));
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
      return NextResponse.redirect(new URL(`/orders?success=true&order_id=${orderId}`, req.url));
    }

    return NextResponse.redirect(new URL(`/orders?processing=true&order_id=${orderId}`, req.url));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Checkout success verification error:', error);
    return NextResponse.redirect(
      new URL(`/shop?error=verification_failed&message=${encodeURIComponent(message)}`, req.url)
    );
  }
}
