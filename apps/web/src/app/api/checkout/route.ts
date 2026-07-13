import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey, getAppOrigin } from '@/lib/env';
import { getTokenFromRequest, requireSessionUser } from '@/lib/auth';
import { CheckoutCartSchema } from '@/lib/validation';
import { AuditService } from '@/lib/services/audit.service';

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';
  let userId = '';

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
      let calculatedTotalCents = 0;
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

        if (product.stockQuantity < item.quantity) {
          throw new Error(`OUT_OF_STOCK:${product.title}`);
        }

        calculatedTotalCents += product.priceCents * item.quantity;
        verifiedItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
        });
      }

      // Create order row in PENDING state
      const order = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          totalAmountCents: calculatedTotalCents,
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
        totalAmountCents: calculatedTotalCents,
        lineItems,
      };
    });

    // Initialize Stripe session creation
    const stripe = new Stripe(getStripeSecretKey(), {
      apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
    });

    const origin = getAppOrigin(req);

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded' as Stripe.Checkout.SessionCreateParams.UiMode,
      payment_method_types: ['card'],
      line_items: transactionResult.lineItems.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            metadata: {
              sku: item.sku,
            },
          },
          unit_amount: item.unitPriceCents,
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      return_url: `${origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${transactionResult.orderId}`,
      metadata: {
        orderId: transactionResult.orderId,
        userId,
      },
    });

    if (!session.client_secret) {
      await prisma.order.update({
        where: { id: transactionResult.orderId },
        data: { status: 'FAILED' },
      });
      return NextResponse.json(
        { error: 'PAYMENT_PORTAL_UNAVAILABLE', message: 'Unable to initialize Stripe payment session.' },
        { status: 500 }
      );
    }

    await prisma.order.update({
      where: { id: transactionResult.orderId },
      data: {
        stripePaymentIntentId: session.id,
      },
    });

    // Audit checkout logging
    await AuditService.record({
      userId,
      action: 'COMMERCE_CHECKOUT_INITIATED',
      details: `Stripe checkout session initialized for Order ID: ${transactionResult.orderId}. Total: $${(transactionResult.totalAmountCents / 100).toFixed(2)}`,
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        success: true,
        orderId: transactionResult.orderId,
        totalAmountCents: transactionResult.totalAmountCents,
        clientSecret: session.client_secret,
        stripePaymentIntentId: session.id,
      },
      { status: 201 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '';

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
