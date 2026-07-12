import { prisma } from '@repo/database';
import crypto from 'crypto';

type OrderWithItems = {
  id: string;
  orderItems: Array<{
    id: string;
    productId: string;
    quantity: number;
    product: {
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

/**
 * Atomically fulfills a PENDING order: marks PAID, decrements stock, generates tickets.
 * Returns null if the order was already fulfilled.
 */
export async function fulfillOrder(
  order: OrderWithItems,
  stripeSessionId: string
): Promise<CreatedTicket[] | null> {
  const createdTickets: CreatedTicket[] = [];

  const fulfilled = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: 'PENDING' },
      data: {
        status: 'PAID',
        stripePaymentIntentId: stripeSessionId,
      },
    });

    if (updated.count === 0) {
      return false;
    }

    for (const item of order.orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: item.quantity } },
      });

      if (item.product.type === 'TICKET_DIGITAL') {
        const eventId = item.product.sku.replace('TICKET_', '');
        const eventRecord = await tx.event.findUnique({ where: { id: eventId } });

        if (!eventRecord) {
          console.error(`Event record not found for ticket SKU: ${item.product.sku}`);
          continue;
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
    }

    return true;
  });

  return fulfilled ? createdTickets : null;
}
