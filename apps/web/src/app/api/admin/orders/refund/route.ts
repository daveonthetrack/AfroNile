import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/env';
import { verifyAdminFromRequest } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit.service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  let adminUserId = '';

  try {
    // 1. Authenticate Admin session
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Unauthorized. Admin session required.' }, { status: 403 });
    }

    // Resolve user ID if possible
    const token = req.cookies.get('token')?.value;
    if (token) {
      const { verifyToken } = await import('@repo/auth');
      const { getJwtSecret } = await import('@/lib/env');
      const decoded = verifyToken(token, getJwtSecret());
      adminUserId = decoded?.userId || '';
    }

    // 2. Parse request body
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    // 3. Retrieve order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'PAID' && order.status !== 'SHIPPED') {
      return NextResponse.json({ error: `Cannot refund order in status: ${order.status}` }, { status: 400 });
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json({ error: 'Order has no confirmed Stripe payment.' }, { status: 400 });
    }

    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
    });

    try {
      await stripe.refunds.create(
        { payment_intent: order.stripePaymentIntentId },
        { idempotencyKey: `refund:${order.id}` }
      );
    } catch (stripeErr: any) {
      console.error('Stripe refund api failure:', stripeErr);
      return NextResponse.json({ error: `Stripe Refund API error: ${stripeErr.message}` }, { status: 500 });
    }

    // Log admin audit event
    await AuditService.record({
      ...(adminUserId ? { userId: adminUserId } : {}),
      action: 'ADMIN_ORDER_REFUND_TRIGGERED',
      details: `Admin requested a Stripe refund for Order ID ${orderId} (Order Number: ${order.orderNumber}). Amount: $${(order.totalAmountCents / 100).toFixed(2)}`,
      ipAddress: clientIp,
    });

    return NextResponse.json({ success: true, status: 'REFUND_PENDING' });

  } catch (error: any) {
    console.error('Admin refund API error:', error);
    return NextResponse.json({ error: 'Internal server error processing refund.' }, { status: 500 });
  }
}
