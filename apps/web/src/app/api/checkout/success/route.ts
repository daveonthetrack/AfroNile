import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.redirect(new URL('/shop?error=missing_order_id', req.url));
  }

  try {
    // 1. Resolve order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.redirect(new URL(`/shop?error=order_not_found&order_id=${orderId}`, req.url));
    }

    // 2. If already PAID, just redirect to tickets
    if (order.status === 'PAID') {
      return NextResponse.redirect(new URL(`/tickets?success=true&order_id=${orderId}`, req.url));
    }

    // 3. Verify Stripe payment status
    if (sessionId && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-04-10' as any,
      });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== 'paid') {
        return NextResponse.redirect(new URL(`/shop?error=payment_failed&order_id=${orderId}`, req.url));
      }
    }

    // 4. Update order status to PAID and generate tickets for TICKET_DIGITAL products
    await prisma.$transaction(async (tx) => {
      // Mark order as paid
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      });

      // Generate tickets
      for (const item of order.orderItems) {
        if (item.product.type === 'TICKET_DIGITAL') {
          // SKU format is TICKET_[EVENT_ID]
          const eventId = item.product.sku.replace('TICKET_', '');
          
          const event = await tx.event.findUnique({ where: { id: eventId } });
          if (!event) continue;

          for (let i = 0; i < item.quantity; i++) {
            const randomBytes = crypto.randomBytes(32).toString('hex');
            const qrCodeHash = crypto.createHash('sha256').update(randomBytes).digest('hex');

            await tx.ticket.create({
              data: {
                orderItemId: item.id,
                eventId: event.id,
                qrCodeHash: qrCodeHash,
              },
            });
          }
        }
      }
    });

    return NextResponse.redirect(new URL(`/tickets?success=true&order_id=${orderId}`, req.url));

  } catch (error: any) {
    console.error('Checkout success verification error:', error);
    return NextResponse.redirect(new URL(`/shop?error=verification_failed&message=${encodeURIComponent(error.message || '')}`, req.url));
  }
}
