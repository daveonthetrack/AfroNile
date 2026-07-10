import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { stripeMock } from '../../../modules/commerce/stripe';
import Stripe from 'stripe';
import crypto from 'crypto';

interface CheckoutItem {
  productId: string;
  quantity: number;
}

interface CheckoutRequest {
  userId: string;
  items: CheckoutItem[];
}

export async function POST(req: NextRequest) {
  try {
    const body: CheckoutRequest = await req.json();
    const { userId, items } = body;

    // Validate inputs
    if (!userId) {
      return NextResponse.json({ error: 'USER_ID_REQUIRED' }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'CART_ITEMS_REQUIRED' }, { status: 400 });
    }

    // Atomic transaction for checking and updating stock
    const transactionResult = await prisma.$transaction(async (tx) => {
      let calculatedTotalCents = 0;
      const verifiedItems: { productId: string; quantity: number; unitPriceCents: number }[] = [];

      for (const item of items) {
        if (!item.productId || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new Error('INVALID_ITEM_SPECIFICATION');
        }

        // Check if the input is a valid UUID or an SKU
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const isUuid = uuidRegex.test(item.productId);

        // Fetch product details by ID or SKU
        const product = await tx.product.findFirst({
          where: {
            OR: [
              ...(isUuid ? [{ id: item.productId }] : []),
              { sku: item.productId }
            ]
          },
        });

        if (!product) {
          throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
        }

        // Check if sufficient stock is available
        if (product.stockQuantity < item.quantity) {
          throw new Error(`OUT_OF_STOCK:${product.title}`);
        }

        // Atomic stock decrement using the resolved product's UUID
        const updateCount = await tx.product.updateMany({
          where: {
            id: product.id,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        // Double check if another request finished first (optimistic lock guard)
        if (updateCount.count === 0) {
          throw new Error(`CONCURRENT_STOCK_DELETION:${product.title}`);
        }

        calculatedTotalCents += product.priceCents * item.quantity;
        verifiedItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPriceCents: product.priceCents,
        });
      }

      // Create primary order transaction
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

      // Fetch titles and SKUs for Stripe line items representation
      const orderItemsWithProducts = await tx.orderItem.findMany({
        where: { orderId: order.id },
        include: { product: true }
      });

      const lineItems = orderItemsWithProducts.map(item => ({
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

    let redirectUrl: string | null = null;
    let stripeSessionId: string | null = null;

    if (process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: '2024-04-10' as any,
        });

        const origin = req.headers.get('origin') || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
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
          success_url: `${origin}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${transactionResult.orderId}`,
          cancel_url: `${origin}/shop`,
          metadata: {
            orderId: transactionResult.orderId,
            userId,
          },
        });

        redirectUrl = session.url;
        stripeSessionId = session.id;

        await prisma.order.update({
          where: { id: transactionResult.orderId },
          data: {
            stripePaymentIntentId: session.id,
          },
        });

      } catch (stripeErr) {
        console.error('Stripe Checkout session creation failed, falling back to mock:', stripeErr);
      }
    }

    if (redirectUrl) {
      return NextResponse.json({
        success: true,
        orderId: transactionResult.orderId,
        totalAmountCents: transactionResult.totalAmountCents,
        redirectUrl: redirectUrl,
        stripePaymentIntentId: stripeSessionId,
      }, { status: 201 });
    }

    // fallback to Demo Mode: Auto-approve payment and generate tickets immediately
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: transactionResult.orderId },
        data: { status: 'PAID' },
      });

      for (const item of transactionResult.lineItems) {
        if (item.sku.startsWith('TICKET_')) {
          const eventId = item.sku.replace('TICKET_', '');
          const event = await tx.event.findUnique({ where: { id: eventId } });
          if (!event) continue;

          for (let i = 0; i < item.quantity; i++) {
            const randomBytes = crypto.randomBytes(32).toString('hex');
            const qrCodeHash = crypto.createHash('sha256').update(randomBytes).digest('hex');

            await tx.ticket.create({
              data: {
                orderItemId: item.orderItemId,
                eventId: event.id,
                qrCodeHash: qrCodeHash,
              }
            });
          }
        }
      }
    });

    const paymentIntent = await stripeMock.createPaymentIntent(transactionResult.totalAmountCents);
    await prisma.order.update({
      where: { id: transactionResult.orderId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
      },
    });

    return NextResponse.json({
      success: true,
      orderId: transactionResult.orderId,
      totalAmountCents: transactionResult.totalAmountCents,
      stripePaymentIntentId: paymentIntent.id,
      stripeClientSecret: paymentIntent.clientSecret,
    }, { status: 201 });

  } catch (error: any) {
    const errorMessage = error?.message || '';
    
    if (errorMessage.startsWith('PRODUCT_NOT_FOUND:')) {
      return NextResponse.json({ error: 'PRODUCT_NOT_FOUND', details: errorMessage.split(':')[1] }, { status: 404 });
    }
    if (errorMessage.startsWith('OUT_OF_STOCK:') || errorMessage.startsWith('CONCURRENT_STOCK_DELETION:')) {
      return NextResponse.json({ error: 'OUT_OF_STOCK', details: errorMessage.split(':')[1] }, { status: 409 });
    }
    if (errorMessage === 'INVALID_ITEM_SPECIFICATION') {
      return NextResponse.json({ error: 'INVALID_ITEM_SPECIFICATION' }, { status: 400 });
    }

    console.error('Checkout API Error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR', message: error.message }, { status: 500 });
  }
}
