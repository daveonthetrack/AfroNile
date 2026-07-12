import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { getStripeSecretKey, getAppOrigin } from '@/lib/env';
import { getTokenFromRequest, requireSessionUser } from '@/lib/auth';

interface CheckoutItem {
  productId: string;
  quantity: number;
}

interface CheckoutRequest {
  items: CheckoutItem[];
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = requireSessionUser(getTokenFromRequest(req));
    if (!sessionUser) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body: CheckoutRequest = await req.json();
    const { items } = body;
    const userId = sessionUser.userId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'CART_ITEMS_REQUIRED' }, { status: 400 });
    }

    const transactionResult = await prisma.$transaction(async (tx) => {
      let calculatedTotalCents = 0;
      const verifiedItems: { productId: string; quantity: number; unitPriceCents: number }[] = [];

      for (const item of items) {
        if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new Error('INVALID_ITEM_SPECIFICATION');
        }

        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const isUuid = uuidRegex.test(item.productId);

        const product = await tx.product.findFirst({
          where: {
            OR: [
              ...(isUuid ? [{ id: item.productId }] : []),
              { sku: item.productId },
            ],
          },
        });

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
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

      const lineItems = orderItemsWithProducts.map((item) => ({
        name: item.product.title,
        unitPriceCents: item.unitPriceCents,
        quantity: item.quantity,
        sku: item.product.sku,
        orderItemId: item.id,
        productId: item.productId,
      }));

      return {
        orderId: order.id,
        totalAmountCents: calculatedTotalCents,
        lineItems,
      };
    });

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
    if (errorMessage === 'INVALID_ITEM_SPECIFICATION') {
      return NextResponse.json({ error: 'INVALID_ITEM_SPECIFICATION' }, { status: 400 });
    }

    console.error('Checkout API Error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
