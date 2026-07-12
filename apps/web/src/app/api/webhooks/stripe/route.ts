import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey, getStripeWebhookSecret } from '@/lib/env';
import { fulfillOrder } from '@/lib/fulfillment';

export const dynamic = 'force-dynamic';

function getStripeClient(): Stripe {
  return new Stripe(getStripeSecretKey(), {
    apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
  });
}

async function sendEmailNotification(to: string, subject: string, htmlContent: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY environment variable is missing. Skipping email notification.');
    return;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: 'AfroNile <tickets@afronile.com>',
        to: [to],
        subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to send email via Resend API:', errorText);
    }
  } catch (error) {
    console.error('Resend email API request error:', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = getStripeClient().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Stripe Webhook Signature Verification Failed:', message);
      return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (metadata?.orderId) {
        const orderId = metadata.orderId;

        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: true,
            orderItems: {
              include: { product: true },
            },
          },
        });

        if (!order) {
          console.error(`Order not found for Stripe checkout session: ${orderId}`);
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (session.payment_status !== 'paid') {
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const createdTickets = await fulfillOrder(order, session.id);

        if (createdTickets && createdTickets.length > 0 && order.user?.email) {
          const firstTicket = createdTickets[0];
          const emailHtml = `
              <div style="font-family: sans-serif; background-color: #0b0b0b; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #222;">
                <h1 style="color: #ff3366; text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Your AfroNile Concert Tickets</h1>
                <p style="font-size: 16px; color: #ccc; line-height: 1.6;">Thank you for your purchase! Your tickets for <strong>${firstTicket.eventTitle}</strong> at <strong>${firstTicket.venueName}</strong> have been generated.</p>
                <p style="font-size: 14px; color: #888;">Order ID: ${orderId}</p>
                <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;" />
                <h2 style="font-size: 18px; color: #fff; margin-bottom: 15px;">Your Cryptographic Tickets:</h2>
                ${createdTickets
                  .map(
                    (t, idx) => `
                  <div style="background-color: #121212; padding: 15px; border-radius: 8px; border: 1px solid #333; margin-bottom: 15px;">
                    <span style="font-size: 11px; text-transform: uppercase; color: #ff3366; font-weight: bold; letter-spacing: 1px;">Ticket #${idx + 1}</span>
                    <p style="font-size: 14px; color: #fff; margin: 5px 0 10px 0; font-family: monospace; word-break: break-all;">${t.qrCodeHash}</p>
                    <p style="font-size: 12px; color: #aaa; margin: 0;">Scan this at the venue gate for entry.</p>
                  </div>
                `
                  )
                  .join('')}
                <p style="font-size: 13px; color: #555; text-align: center; margin-top: 30px;">This is a system generated cryptographic receipt. AfroNile Monolith.</p>
              </div>
            `;
          await sendEmailNotification(order.user.email, `Your AfroNile Tickets: ${firstTicket.eventTitle}`, emailHtml);
        }
      }

      if (metadata?.contributionId) {
        const contributionId = metadata.contributionId;

        const contribution = await prisma.supportContribution.findUnique({
          where: { id: contributionId },
          include: { user: true },
        });

        if (contribution) {
          await prisma.supportContribution.update({
            where: { id: contributionId },
            data: {
              stripeSessionId: session.id,
              amountCents: session.amount_total || contribution.amountCents,
            },
          });

          const donorEmail = contribution.email || contribution.user?.email;
          if (donorEmail) {
            const supportHtml = `
              <div style="font-family: sans-serif; background-color: #0b0b0b; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #222;">
                <h1 style="color: #ff3366; text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 20px;">Thank You for Supporting AfroNile</h1>
                <p style="font-size: 16px; color: #ccc; line-height: 1.6;">We received your live support contribution of <strong>$${((session.amount_total || contribution.amountCents) / 100).toFixed(2)}</strong> during the concert performance!</p>
                <p style="font-size: 15px; color: #ff3366; font-style: italic; text-align: center; margin: 20px 0; background-color: #121212; padding: 15px; border-radius: 8px; border: 1px solid #333;">
                  "${contribution.comment || 'Supported the show!'}"
                </p>
                <p style="font-size: 14px; color: #aaa; line-height: 1.6;">Your contribution directly funds independent Nile Wave music production and live events with zero middle-men.</p>
                <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;" />
                <p style="font-size: 12px; color: #555; text-align: center;">Transaction ID: ${session.id}</p>
              </div>
            `;
            await sendEmailNotification(donorEmail, 'Thank You for Supporting AfroNile!', supportHtml);
          }
        } else {
          console.error(`Support contribution ${contributionId} not found for webhook session.`);
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata;

      if (metadata?.orderId) {
        await prisma.order.updateMany({
          where: { id: metadata.orderId, status: 'PENDING' },
          data: { status: 'FAILED' },
        });
      }

      if (metadata?.contributionId) {
        await prisma.supportContribution.deleteMany({
          where: {
            id: metadata.contributionId,
            stripeSessionId: null,
          },
        });
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stripe Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 });
  }
}
