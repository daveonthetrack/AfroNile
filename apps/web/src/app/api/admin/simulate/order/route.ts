import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import { verifyToken } from '@repo/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-artist-monolith';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const payload = verifyToken(token, JWT_SECRET) as any;
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // 2. Fetch seed user
    const user = await prisma.user.findFirst({
      where: { email: 'user@afronile.com' }
    });
    if (!user) {
      return NextResponse.json({ error: 'Default seed user not found. Please run db:seed.' }, { status: 404 });
    }

    // 3. Select random product
    const products = await prisma.product.findMany();
    if (products.length === 0) {
      return NextResponse.json({ error: 'No products in database. Please run db:seed.' }, { status: 404 });
    }
    const randomProduct = products[Math.floor(Math.random() * products.length)];

    // 4. Quantities and calculations
    const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3
    const priceCents = randomProduct.priceCents;
    const totalAmountCents = priceCents * quantity;

    // 5. Create Order and OrderItem inside transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          status: 'PAID',
          totalAmountCents,
          orderItems: {
            create: {
              productId: randomProduct.id,
              quantity,
              unitPriceCents: priceCents,
            }
          }
        },
        include: {
          orderItems: true
        }
      });

      // If it's a ticket product, create a Ticket record as well
      if (randomProduct.sku.startsWith('TICKET_')) {
        const event = await tx.event.findFirst();
        if (event) {
          const orderItemId = newOrder.orderItems[0].id;
          const qrCodeHash = crypto.createHash('sha256').update(`ticket_sig_${Date.now()}_${Math.random()}`).digest('hex');
          await tx.ticket.create({
            data: {
              orderItemId,
              eventId: event.id,
              qrCodeHash,
              isScanned: false
            }
          });
        }
      }

      // Decrement stock
      if (randomProduct.stockQuantity > 0) {
        await tx.product.update({
          where: { id: randomProduct.id },
          data: {
            stockQuantity: {
              decrement: quantity
            }
          }
        });
      }

      return newOrder;
    });

    return NextResponse.json({ success: true, orderId: order.id });

  } catch (error: any) {
    console.error('Simulate order creation error:', error);
    return NextResponse.json({ error: 'Internal server error occurred.' }, { status: 500 });
  }
}
