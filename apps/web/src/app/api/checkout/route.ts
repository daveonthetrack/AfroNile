import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey } from '@/lib/env';
import { getTokenFromRequest, requireSessionUser } from '@/lib/auth';
import { CheckoutCartSchema } from '@/lib/validation';
import { AuditService } from '@/lib/services/audit.service';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  let userId = '';
  let reservedOrderId: string | null = null;

  const releaseReservation = async (orderId: string) => {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      if (!order || order.status !== 'PENDING') return;

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
  };

  try {
    const sessionUser = requireSessionUser(getTokenFromRequest(req));
    if (!sessionUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    userId = sessionUser.userId;

    // Validate body using Zod schema
    const body = await req.json();
    const parseResult = CheckoutCartSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({
        error: 'INVALID_CART_PAYLOAD',
        message: parseResult.error.issues[0]?.message || 'Invalid cart specification.'
      }, { status: 400 });
    }

    const { items } = parseResult.data;

    // Execute atomic transaction for validation and order creation
    const transactionResult = await prisma.$transaction(async (tx) => {
      // 1. Verify user exists in the database to prevent foreign key errors
      const dbUser = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true, stripeCustomerId: true },
      });

      if (!dbUser) {
        throw new Error('USER_NOT_FOUND');
      }

      let calculatedTotalCents = 0;
      let merchandiseSubtotal = 0;
      let hasPhysicalMerch = false;
      const verifiedItems: { productId: string; quantity: number; unitPriceCents: number }[] = [];

      for (const item of items) {
        // Validate UUID structure
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const isUuid = uuidRegex.test(item.id);

        const product = await tx.product.findFirst({
          where: {
            OR: [
              ...(isUuid ? [{ id: item.id }] : []),
              { sku: item.id },
            ],
          },
        });

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.id}`);
        }

        const reservation = await tx.product.updateMany({
          where: {
            id: product.id,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (reservation.count === 0) {
          throw new Error(`OUT_OF_STOCK:${product.title}`);
        }

        if (product.type === 'MERCHANDISE') {
          hasPhysicalMerch = true;
          merchandiseSubtotal += product.priceCents * item.quantity;
        }

        calculatedTotalCents += product.priceCents * item.quantity;
        verifiedItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
        });
      }

      const shippingCents = hasPhysicalMerch ? 500 : 0;
      const taxCents = hasPhysicalMerch ? Math.round(merchandiseSubtotal * 0.08) : 0;
      const finalTotalCents = calculatedTotalCents + shippingCents + taxCents;

      // Unique order number: AN-XXXXXX
      const orderNumber = `AN-${randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()}`;

      // Create order row in PENDING state
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber,
          status: 'PENDING',
          totalAmountCents: finalTotalCents,
          taxCents,
          shippingCents,
          discountCents: 0,
          orderItems: {
            create: verifiedItems.map((v) => ({
              productId: v.productId,
              quantity: v.quantity,
              unitPriceCents: v.unitPriceCents,
            })),
          },
        },
      });

      const orderItemsWithProducts = await tx.orderItem.findMany({
        where: { orderId: order.id },
        include: { product: true },
      });

      const lineItems = orderItemsWithProducts.map((oItem) => ({
        name: oItem.product.title,
        unitPriceCents: oItem.unitPriceCents,
        quantity: oItem.quantity,
        sku: oItem.product.sku,
        orderItemId: oItem.id,
        productId: oItem.productId,
      }));

      return {
        orderId: order.id,
        orderNumber,
        totalAmountCents: finalTotalCents,
        shippingCents,
        taxCents,
        lineItems,
        dbUser,
      };
    });
    reservedOrderId = transactionResult.orderId;

    // Create a PaymentIntent for the custom Elements checkout. The client renders
    // Apple Pay in the Express Checkout Element before the standard payment form.
    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
    });

    const stripeCustomerOption = transactionResult.dbUser?.stripeCustomerId
      ? { customer: transactionResult.dbUser.stripeCustomerId }
      : {};

    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create(
        {
          amount: transactionResult.totalAmountCents,
          currency: 'usd',
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
          ...(transactionResult.dbUser?.email
            ? { receipt_email: transactionResult.dbUser.email }
            : {}),
          ...stripeCustomerOption,
          metadata: {
            orderId: transactionResult.orderId,
            userId,
          },
        },
        {
          idempotencyKey: req.headers.get('idempotency-key') || `payment-intent:${transactionResult.orderId}`,
        }
      );
    } catch (error) {
      await releaseReservation(transactionResult.orderId);
      reservedOrderId = null;
      throw error;
    }

    if (!paymentIntent.client_secret) {
      await releaseReservation(transactionResult.orderId);
      reservedOrderId = null;
      return NextResponse.json(
        { error: 'PAYMENT_PORTAL_UNAVAILABLE', message: 'Unable to initialize Stripe payment session.' },
        { status: 500 }
      );
    }

    await prisma.order.update({
      where: { id: transactionResult.orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });
    reservedOrderId = null;

    // Log a CHECKOUT_INIT event in our AnalyticsEvent table
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'CHECKOUT_INIT',
        userId,
        details: JSON.stringify({
          orderId: transactionResult.orderId,
          orderNumber: transactionResult.orderNumber,
          totalAmountCents: transactionResult.totalAmountCents,
        }),
      },
    });

    // Audit checkout logging
    await AuditService.record({
      userId,
      action: 'COMMERCE_CHECKOUT_INITIATED',
      details: `Stripe checkout session initialized for Order Number: ${transactionResult.orderNumber} (ID: ${transactionResult.orderId}). Total: $${(transactionResult.totalAmountCents / 100).toFixed(2)}`,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: transactionResult.orderId,
        orderNumber: transactionResult.orderNumber,
        totalAmountCents: transactionResult.totalAmountCents,
        stripePaymentIntentId: paymentIntent.id,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    if (reservedOrderId) {
      try {
        await releaseReservation(reservedOrderId);
      } catch (releaseError) {
        console.error('Checkout stock reservation release failed:', releaseError);
      }
    }
    const errorMessage = error instanceof Error ? error.message : '';

    if (errorMessage === 'USER_NOT_FOUND') {
      const response = NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'User session is invalid. Please log in again.' },
        { status: 401 }
      );
      response.cookies.delete('token');
      return response;
    }

    if (errorMessage.startsWith('PRODUCT_NOT_FOUND:')) {
      return NextResponse.json({ error: 'PRODUCT_NOT_FOUND', details: errorMessage.split(':')[1] }, { status: 404 });
    }
    if (errorMessage.startsWith('OUT_OF_STOCK:')) {
      return NextResponse.json({ error: 'OUT_OF_STOCK', details: errorMessage.split(':')[1] }, { status: 409 });
    }

    await AuditService.record({
      ...(userId ? { userId } : {}),
      action: 'COMMERCE_CHECKOUT_FAILED',
      details: `Checkout transaction aborted: ${errorMessage || 'Unknown checkout error'}`,
      ipAddress: clientIp,
    });

    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
