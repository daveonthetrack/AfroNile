import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { cookies } from 'next/headers';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  try {
    const { amountCents, eventId, email, phone, comment } = await req.json();

    if (!amountCents || typeof amountCents !== 'number' || amountCents <= 0) {
      return NextResponse.json({ error: 'INVALID_AMOUNT' }, { status: 400 });
    }

    // Resolve userId from auth cookie if present
    const token = cookies().get('token')?.value;
    let userId: string | null = null;

    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(payloadBase64));
          // Look up user ID from email
          const user = await prisma.user.findUnique({
            where: { email: decoded.email },
          });
          if (user) {
            userId = user.id;
          }
        }
      } catch (e) {
        console.error('Failed to decode user in support checkout:', e);
      }
    }

    // Create the support contribution record in DB first
    // Note: We set stripeSessionId to a placeholder initially, then update it below
    const contribution = await prisma.supportContribution.create({
      data: {
        userId: userId || null,
        amountCents,
        eventId: eventId || null,
        stripeSessionId: `pending_${Math.random().toString(36).substring(2, 12)}`,
        email: email || null,
        phone: phone || null,
        comment: comment || null,
      },
    });

    let clientSecret: string | null = null;
    let stripeSessionId = '';

    const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
    // If Stripe secret key exists, create a real hosted Checkout Session
    if (secretKey) {
      try {
        const stripe = new Stripe(secretKey, {
          apiVersion: '2024-04-10' as any,
        });

        // Resolve base URL origin for redirects
        const origin = req.headers.get('origin') || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
          ui_mode: 'embedded' as any,
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

        stripeSessionId = session.id;
        clientSecret = session.client_secret;

        // Update database with the actual Stripe session ID
        await prisma.supportContribution.update({
          where: { id: contribution.id },
          data: { stripeSessionId: session.id },
        });

      } catch (stripeErr) {
        console.error('Stripe Checkout Session creation failed, falling back to mock:', stripeErr);
      }
    }

    return NextResponse.json({
      success: true,
      contributionId: contribution.id,
      clientSecret: clientSecret, // null signals Demo Mode fallback
      stripeSessionId: stripeSessionId,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create support contribution session:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
