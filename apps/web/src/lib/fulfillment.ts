import { prisma } from '@repo/database';
import crypto from 'crypto';

type OrderWithItems = {
  id: string;
  userId: string;
  totalAmountCents: number;
  orderItems: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: {
      id: string;
      type: string;
      sku: string;
    };
  }>;
};

export type CreatedTicket = {
  qrCodeHash: string;
  eventTitle: string;
  venueName: string;
};

export type FulfillmentResult = {
  tickets: CreatedTicket[];
  downloadTokens: string[];
};

/**
 * Atomically fulfills a stock-reserved PENDING order: marks PAID, generates tickets,
 * creates download records (if digital), logs payment & transaction entries, creates
 * analytics events, and increments the daily revenue report.
 * Returns null if the order was already fulfilled.
 */
export async function fulfillOrder(
  order: OrderWithItems,
  stripeSessionId: string,
  stripePaymentIntentId?: string,
  receiptUrl?: string
): Promise<FulfillmentResult | null> {
  const createdTickets: CreatedTicket[] = [];
  const downloadTokens: string[] = [];

  const fulfilled = await prisma.$transaction(async (tx) => {
    // Check if order is still pending to ensure idempotency and prevent duplicate updates
    const currentOrder = await tx.order.findUnique({
      where: { id: order.id },
      select: { status: true },
    });

    if (!currentOrder || currentOrder.status !== 'PENDING') {
      return false;
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        stripeSessionId,
        stripePaymentIntentId: stripePaymentIntentId || null,
        receiptUrl: receiptUrl || null,
        fulfillmentStatus: 'PAID',
      },
    });

    // Create Payment record
    await tx.payment.create({
      data: {
        orderId: order.id,
        stripePaymentIntentId: stripePaymentIntentId || null,
        amountCents: order.totalAmountCents,
        currency: 'usd',
        status: 'succeeded',
        receiptUrl: receiptUrl || null,
      },
    });

    // Create Transaction record
    await tx.transaction.create({
      data: {
        orderId: order.id,
        type: 'CHARGE',
        amountCents: order.totalAmountCents,
        stripeSessionId,
      },
    });

    // Process order items
    for (const item of order.orderItems) {
      // Handle Event Tickets
      if (item.product.type === 'TICKET_DIGITAL') {
        const eventId = item.product.sku.replace('TICKET_', '');
        const eventRecord = await tx.event.findUnique({ where: { id: eventId } });

        if (!eventRecord) {
          throw new Error(`TICKET_EVENT_NOT_FOUND:${item.product.sku}`);
        }

        for (let i = 0; i < item.quantity; i++) {
          const randomBytes = crypto.randomBytes(32).toString('hex');
          const qrCodeHash = crypto.createHash('sha256').update(randomBytes).digest('hex');

          await tx.ticket.create({
            data: {
              orderItemId: item.id,
              eventId: eventRecord.id,
              qrCodeHash,
            },
          });

          createdTickets.push({
            qrCodeHash,
            eventTitle: eventRecord.title,
            venueName: eventRecord.venueName,
          });
        }
      }

      // Handle Digital Downloads (SKUs starting with ALBUM_)
      if (item.product.sku.startsWith('ALBUM_')) {
        const downloadToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000); // 30 days validity

        await tx.download.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            productId: item.productId,
            downloadToken,
            expiresAt,
          },
        });
        downloadTokens.push(downloadToken);
      }
    }

    // Log a CHECKOUT_SUCCESS event in our AnalyticsEvent table
    await tx.analyticsEvent.create({
      data: {
        eventType: 'CHECKOUT_SUCCESS',
        userId: order.userId,
        details: JSON.stringify({
          orderId: order.id,
          amountCents: order.totalAmountCents,
        }),
      },
    });

    // Update Daily Revenue Report
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const report = await tx.revenueReport.findUnique({
      where: { date: today },
    });

    if (report) {
      await tx.revenueReport.update({
        where: { date: today },
        data: {
          grossRevenueCents: { increment: order.totalAmountCents },
          netRevenueCents: { increment: order.totalAmountCents },
          salesCents: { increment: order.totalAmountCents },
          orderCount: { increment: 1 },
        },
      });
    } else {
      await tx.revenueReport.create({
        data: {
          date: today,
          grossRevenueCents: order.totalAmountCents,
          netRevenueCents: order.totalAmountCents,
          salesCents: order.totalAmountCents,
          donationsCents: 0,
          refundsCents: 0,
          orderCount: 1,
        },
      });
    }

    return true;
  });

  return fulfilled ? { tickets: createdTickets, downloadTokens } : null;
}
