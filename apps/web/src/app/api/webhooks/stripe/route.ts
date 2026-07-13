import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey, getStripeWebhookSecret } from '@/lib/env';
import { fulfillOrder } from '@/lib/fulfillment';
import { AuditService } from '@/lib/services/audit.service';

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
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  let claimedEventId: string | null = null;

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

    try {
      await prisma.processedStripeEvent.create({
        data: {
          eventId: event.id,
          eventType: event.type,
        },
      });
      claimedEventId = event.id;
    } catch (error: unknown) {
      const code = typeof error === 'object' && error && 'code' in error ? error.code : undefined;
      if (code === 'P2002') {
        return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
      }
      throw error;
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 2. Dispatch Event Type
    switch (event.type) {
      case 'checkout.session.completed': {
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
            break;
          }

          if (
            session.payment_status !== 'paid' ||
            session.currency !== 'usd' ||
            session.amount_total !== order.totalAmountCents ||
            session.id !== order.stripeSessionId
          ) {
            console.error(`Stripe checkout verification failed for order ${orderId}.`);
            break;
          }

          // Link customer records: Save Stripe Customer ID to local User model
          if (session.customer && order.userId) {
            await prisma.user.update({
              where: { id: order.userId },
              data: { stripeCustomerId: session.customer as string },
            });
          }

          // Retrieve dynamic receipt url from latest charge details
          let receiptUrl: string | undefined;
          try {
            if (session.payment_intent) {
              const pi = await getStripeClient().paymentIntents.retrieve(session.payment_intent as string, {
                expand: ['latest_charge'],
              });
              const charge = pi.latest_charge as Stripe.Charge | undefined;
              receiptUrl = charge?.receipt_url || undefined;
            }
          } catch (err) {
            console.error('Error fetching payment intent charge details:', err);
          }

          // Fulfill order
          const fulfillment = await fulfillOrder(
            order,
            session.id,
            (session.payment_intent as string) || undefined,
            receiptUrl || undefined
          );

          // Retrieve generated downloads for digital products
          const downloads = fulfillment
            ? await prisma.download.findMany({
                where: { downloadToken: { in: fulfillment.downloadTokens } },
                include: { product: true },
              })
            : [];

          // Send Order Confirmation/Receipt Email
          if (fulfillment && order.user?.email) {
            const itemsListHtml = order.orderItems
              .map(
                (item) => `
              <div style="padding: 10px 0; border-bottom: 1px solid #222; display: flex; justify-content: space-between; font-size: 13px;">
                <div>
                  <strong style="color: #fff;">${item.product.title}</strong>
                  <span style="color: #888; font-size: 11px; block; font-family: monospace;">SKU: ${item.product.sku}</span>
                </div>
                <div style="color: #ccc; text-align: right;">
                  <span>${item.quantity}x</span> &bull;
                  <span>$${((item.unitPriceCents * item.quantity) / 100).toFixed(2)}</span>
                </div>
              </div>
            `
              )
              .join('');

            const ticketsHtml =
              fulfillment.tickets.length > 0
                ? `
              <div style="margin-top: 25px; padding: 15px; background: #121212; border: 1px solid #ff3366/20; border-radius: 8px;">
                <h3 style="color: #ff3366; font-size: 14px; margin: 0 0 10px 0; uppercase font-mono tracking-wider">Concert Entrance Tickets</h3>
                ${fulfillment.tickets
                  .map(
                    (t, idx) => `
                  <div style="margin-bottom: 12px; font-family: monospace; font-size: 12px;">
                    <span style="color: #ff3366;">Ticket #${idx + 1}:</span>
                    <p style="color: #fff; margin: 3px 0; word-break: break-all;">${t.qrCodeHash}</p>
                    <small style="color: #666;">Scan QR at gate for "${t.eventTitle}" at "${t.venueName}"</small>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : '';

            const downloadsHtml =
              downloads && downloads.length > 0
                ? `
              <div style="margin-top: 25px; padding: 15px; background: #121212; border: 1px solid #6366f1/20; border-radius: 8px;">
                <h3 style="color: #6366f1; font-size: 14px; margin: 0 0 10px 0; uppercase font-mono tracking-wider">Digital Vault Downloads</h3>
                ${downloads
                  .map(
                    (d) => `
                  <div style="margin-bottom: 12px; font-size: 12px;">
                    <span style="color: #fff; font-weight: bold;">${d.product.title}</span>
                    <p style="margin: 5px 0 0 0;">
                      <a href="${origin}/api/downloads/${d.downloadToken}" style="display: inline-block; padding: 6px 12px; background: #6366f1; color: #fff; text-decoration: none; border-radius: 4px; font-size: 11px; font-weight: bold; font-family: sans-serif;">Download Tracklist</a>
                    </p>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : '';

            const billingDetailsHtml = `
              <div style="margin-top: 20px; font-size: 12px; color: #aaa; text-align: right; line-height: 1.5;">
                <div>Subtotal: $${((order.totalAmountCents - order.taxCents - order.shippingCents) / 100).toFixed(2)}</div>
                ${order.shippingCents > 0 ? `<div>Shipping: $${(order.shippingCents / 100).toFixed(2)}</div>` : ''}
                ${order.taxCents > 0 ? `<div>Sales Tax (8%): $${(order.taxCents / 100).toFixed(2)}</div>` : ''}
                <div style="font-size: 14px; color: #fff; font-weight: bold; margin-top: 5px;">Total Paid: $${(order.totalAmountCents / 100).toFixed(2)}</div>
              </div>
            `;

            const emailHtml = `
              <div style="font-family: sans-serif; background-color: #0b0b0b; color: #ffffff; padding: 30px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #222;">
                <h1 style="color: #ff3366; text-align: center; font-size: 24px; font-weight: 800; margin-bottom: 5px;">AfroNile Purchase Receipt</h1>
                <p style="text-align: center; color: #888; font-size: 12px; margin-top: 0; margin-bottom: 20px;">Order Reference: ${order.orderNumber || orderId}</p>
                <p style="font-size: 14px; color: #ccc; line-height: 1.6;">Hi there, thank you for your order! We have successfully processed your payment. Below are your purchase details:</p>
                <div style="background: #111; padding: 15px; border-radius: 8px; border: 1px solid #222; margin-top: 15px;">
                  ${itemsListHtml}
                  ${billingDetailsHtml}
                </div>
                ${ticketsHtml}
                ${downloadsHtml}
                ${
                  receiptUrl
                    ? `
                  <p style="text-align: center; margin-top: 25px;">
                    <a href="${receiptUrl}" style="color: #ff3366; font-size: 12px; font-weight: bold; text-decoration: underline;">View Official Stripe Receipt</a>
                  </p>
                `
                    : ''
                }
                <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;" />
                <p style="font-size: 11px; color: #555; text-align: center; margin-top: 20px;">This is a secure system-generated transaction record. AfroNile Monolith.</p>
              </div>
            `;

            await sendEmailNotification(
              order.user.email,
              `Your AfroNile Receipt & Order Confirmation [${order.orderNumber || 'Artifacts'}]`,
              emailHtml
            );
          }
        }

        if (metadata?.contributionId) {
          const contributionId = metadata.contributionId;

          const contribution = await prisma.supportContribution.findUnique({
            where: { id: contributionId },
            include: { user: true },
          });

          if (contribution) {
            const contributionAmount = session.amount_total || contribution.amountCents;
            const fulfilledContribution =
              session.payment_status === 'paid' &&
              session.amount_total === contribution.amountCents
              ? await prisma.$transaction(async (tx) => {
                  const markedPaid = await tx.supportContribution.updateMany({
                    where: { id: contributionId, stripeSessionId: null },
                    data: {
                      stripeSessionId: session.id,
                      amountCents: contributionAmount,
                    },
                  });
                  if (markedPaid.count === 0) return false;

                  await tx.transaction.create({
                    data: {
                      type: 'DONATION',
                      amountCents: contributionAmount,
                      stripeSessionId: session.id,
                    },
                  });
                  await tx.analyticsEvent.create({
                    data: {
                      eventType: 'DONATION_SUCCESS',
                      userId: contribution.userId || null,
                      details: JSON.stringify({
                        contributionId: contribution.id,
                        amountCents: contributionAmount,
                      }),
                    },
                  });
                  const today = new Date();
                  today.setUTCHours(0, 0, 0, 0);
                  await tx.revenueReport.upsert({
                    where: { date: today },
                    update: {
                      grossRevenueCents: { increment: contributionAmount },
                      netRevenueCents: { increment: contributionAmount },
                      donationsCents: { increment: contributionAmount },
                    },
                    create: {
                      date: today,
                      grossRevenueCents: contributionAmount,
                      netRevenueCents: contributionAmount,
                      salesCents: 0,
                      donationsCents: contributionAmount,
                      refundsCents: 0,
                      orderCount: 0,
                    },
                  });
                  return true;
                })
              : false;

            if (fulfilledContribution) {
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
            }
          } else {
            console.error(`Support contribution ${contributionId} not found for webhook session.`);
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata?.orderId) {
          await prisma.$transaction(async (tx) => {
            const order = await tx.order.findFirst({
              where: {
                id: metadata.orderId,
                stripeSessionId: session.id,
                status: 'PENDING',
              },
              include: { orderItems: true },
            });

            if (!order) return;

            await Promise.all(
              order.orderItems.map((item) =>
                tx.product.update({
                  where: { id: item.productId },
                  data: { stockQuantity: { increment: item.quantity } },
                })
              )
            );
            await tx.order.update({
              where: { id: order.id },
              data: { status: 'FAILED', fulfillmentStatus: 'FAILED' },
            });
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
        break;
      }

      case 'payment_intent.succeeded': {
        break;
      }

      case 'payment_intent.payment_failed': {
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const order = await prisma.order.findFirst({
          where: { stripePaymentIntentId: charge.payment_intent as string },
          include: { orderItems: true },
        });

        if (order && charge.amount_refunded >= order.totalAmountCents && order.status !== 'REFUNDED') {
          await prisma.$transaction(async (tx) => {
            await tx.order.update({
              where: { id: order.id },
              data: {
                status: 'REFUNDED',
                refundStatus: 'REFUNDED',
                fulfillmentStatus: 'REFUNDED',
              },
            });
            await tx.payment.updateMany({
              where: { orderId: order.id },
              data: { status: 'refunded' },
            });
            await tx.transaction.create({
              data: {
                orderId: order.id,
                type: 'REFUND',
                amountCents: -charge.amount_refunded,
                stripeSessionId: order.stripeSessionId,
              },
            });
            await Promise.all(
              order.orderItems.map((item) =>
                tx.product.update({
                  where: { id: item.productId },
                  data: { stockQuantity: { increment: item.quantity } },
                })
              )
            );
            await tx.ticket.deleteMany({
              where: { orderItemId: { in: order.orderItems.map((i) => i.id) } },
            });
            await tx.download.deleteMany({
              where: { orderId: order.id },
            });

            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            await tx.revenueReport.upsert({
              where: { date: today },
              update: {
                netRevenueCents: { decrement: charge.amount_refunded },
                refundsCents: { increment: charge.amount_refunded },
              },
              create: {
                date: today,
                grossRevenueCents: 0,
                netRevenueCents: -charge.amount_refunded,
                salesCents: 0,
                donationsCents: 0,
                refundsCents: charge.amount_refunded,
                orderCount: 0,
              },
            });
          });
          await AuditService.record({
            action: 'COMMERCE_ORDER_REFUNDED',
            details: `Order ID ${order.id} refunded. Value: $${(charge.amount_refunded / 100).toFixed(2)}`,
            ipAddress: clientIp,
          });
        }
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        await AuditService.record({
          action: 'PAYMENT_DISPUTE_CREATED',
          details: `Stripe charge dispute created. ID: ${dispute.id}, Amount: $${(dispute.amount / 100).toFixed(2)}. Status: ${dispute.status}`,
          ipAddress: clientIp,
        });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await AuditService.record({
          action: 'BILLING_INVOICE_PAID',
          details: `Stripe invoice paid. ID: ${invoice.id}, Total: $${((invoice.amount_paid || 0) / 100).toFixed(2)}`,
          ipAddress: clientIp,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await AuditService.record({
          action: 'BILLING_INVOICE_FAILED',
          details: `Stripe invoice payment failed. ID: ${invoice.id}, Amount Due: $${((invoice.amount_due || 0) / 100).toFixed(2)}`,
          ipAddress: clientIp,
        });
        break;
      }

      default: {
        console.log(`Unhandled Stripe event type: ${event.type}`);
      }
    }

    // Saveprocessed webhook event id into AuditLog for idempotency guard
    await AuditService.record({
      action: 'STRIPE_WEBHOOK_PROCESSED',
      details: `Stripe webhook event processed. Event ID: ${event.id}, Type: ${event.type}`,
      ipAddress: clientIp,
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: unknown) {
    if (claimedEventId) {
      await prisma.processedStripeEvent.deleteMany({
        where: { eventId: claimedEventId },
      }).catch((deleteError) => {
        console.error('Failed to release Stripe webhook event claim:', deleteError);
      });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Stripe Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message }, { status: 500 });
  }
}
