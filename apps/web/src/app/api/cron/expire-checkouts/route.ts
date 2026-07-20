import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/env';

export const dynamic = 'force-dynamic';

const DEFAULT_RESERVATION_TTL_MINUTES = 30;
const MAX_CHECKOUTS_PER_RUN = 100;

function getReservationTtlMinutes(): number {
  const configured = Number.parseInt(process.env.CHECKOUT_RESERVATION_TTL_MINUTES || '', 10);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_RESERVATION_TTL_MINUTES;
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = req.headers.get('authorization');

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - getReservationTtlMinutes() * 60 * 1000);
  const staleOrders = await prisma.order.findMany({
    where: {
      status: 'PENDING',
      stripePaymentIntentId: { not: null },
      createdAt: { lt: cutoff },
    },
    select: { id: true, stripePaymentIntentId: true },
    take: MAX_CHECKOUTS_PER_RUN,
  });

  const stripe = new Stripe(getStripeSecretKey(), {
    apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
  });

  let canceled = 0;
  let skipped = 0;
  let failed = 0;

  for (const order of staleOrders) {
    if (!order.stripePaymentIntentId) continue;

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);
      if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
        skipped++;
        continue;
      }

      if (paymentIntent.status === 'canceled') {
        skipped++;
        continue;
      }

      await stripe.paymentIntents.cancel(paymentIntent.id);
      canceled++;
    } catch (error) {
      failed++;
      console.error(`Unable to expire checkout order ${order.id}:`, error);
    }
  }

  return NextResponse.json({
    processed: staleOrders.length,
    canceled,
    skipped,
    failed,
    reservationTtlMinutes: getReservationTtlMinutes(),
  });
}
