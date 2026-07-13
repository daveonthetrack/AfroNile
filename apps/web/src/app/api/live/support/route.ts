import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey, getAppOrigin } from '@/lib/env';
import { getSessionUser, getTokenFromRequest } from '@/lib/auth';
import { TippingSchema } from '@/lib/validation';
import { AuditService } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contributionId = searchParams.get('contributionId');

    if (!contributionId) {
      return NextResponse.json({ error: 'Contribution ID is required.' }, { status: 400 });
    }

    const contribution = await prisma.supportContribution.findUnique({
      where: { id: contributionId },
    });

    if (!contribution) {
      return NextResponse.json({ error: 'Contribution not found.' }, { status: 404 });
    }

    const isPaid = contribution.stripeSessionId !== null;

    return NextResponse.json({
      success: true,
      status: isPaid ? 'PAID' : 'PENDING',
    });
  } catch (error) {
    console.error('Failed to get contribution status:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  let userId: string | null = null;

  try {
    const sessionUser = getSessionUser(getTokenFromRequest(req));
    userId = sessionUser?.userId ?? null;
    let invalidSession = false;

    if (userId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      if (!dbUser) {
        userId = null;
        invalidSession = true;
      }
    }

    // Validate body using Zod
    const body = await req.json();
    const parseResult = TippingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'INVALID_SUPPORT_PAYLOAD',
        message: parseResult.error.issues[0]?.message || 'Invalid parameters.'
      }, { status: 400 });
    }

    const { amountCents, eventId, email, phone, comment } = parseResult.data;

    // Create a temporary unverified contribution record
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

    // Log the transaction initialization
    await AuditService.record({
      ...(userId ? { userId } : {}),
      action: 'LIVE_SUPPORT_INITIATED',
      details: `Initialized support checkout session for event ${eventId}. Amount: $${(amountCents / 100).toFixed(2)}`,
      ipAddress: clientIp,
    });

    const response = NextResponse.json(
      {
        success: true,
        contributionId: contribution.id,
        clientSecret: session.client_secret,
        stripeSessionId: session.id,
      },
      { status: 201 }
    );

    if (invalidSession) {
      response.cookies.delete('token');
    }
    return response;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '';
    await AuditService.record({
      ...(userId ? { userId } : {}),
      action: 'LIVE_SUPPORT_FAILED',
      details: `Support contribution initialization aborted: ${errorMessage || 'Unknown error'}`,
      ipAddress: clientIp,
    });
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
