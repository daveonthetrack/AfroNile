import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    stripeSecretLength: process.env.STRIPE_SECRET_KEY?.length || 0,
    stripeSecretPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'none',
  });
}
