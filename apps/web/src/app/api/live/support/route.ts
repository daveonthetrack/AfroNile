import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey, getAppOrigin } from '@/lib/env';
import { getSessionUser, getTokenFromCookies } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { amountCents, eventId, email, phone, comment } = await req.json();

    if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
      return NextResponse.json({ error: 'INVALID_AMOUNT' }, { status: 400 });
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'VALID_EMAIL_REQUIRED' }, { status: 400 });
    }

    const sessionUser = getSessionUser(getTokenFromCookies());
    const userId = sessionUser?.userId ?? null;

    const contribution = await prisma.supportContribution.create({
      data: {
        userId,
        amountCents,
        eventId: eventId || null,
        stripeSessionId: null,
        email: email.trim(),
        phone: phone?.trim() || null,
        comment: comment?.trim() || null,
      },
    });

    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
    });

    const origin = getAppOrigin(req);

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded' as Stripe.Checkout.SessionCreateParams.UiMode,
      payment_method_types: ['card', 'cashapp'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AfroNile Concert Support',
              description: comment ? `Vibe: "${comment}"` : 'Thank you for supporting performance art!',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      return_url: `${origin}/live/memory/${contribution.id}?session_id={CHECKOUT_SESSION_ID}`,
      customer_email: email.trim(),
      metadata: {
        contributionId: contribution.id,
        comment: comment || '',
      },
    });

    if (!session.client_secret) {
      await prisma.supportContribution.delete({
        where: { id: contribution.id },
      });
      return NextResponse.json(
        { error: 'PAYMENT_PORTAL_UNAVAILABLE', message: 'Unable to initialize support payment session.' },
        { status: 500 }
      );
    }

    // stripeSessionId is set only after payment (webhook or success redirect)

    return NextResponse.json(
      {
        success: true,
        contributionId: contribution.id,
        clientSecret: session.client_secret,
        stripeSessionId: session.id,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Failed to create support contribution session:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
