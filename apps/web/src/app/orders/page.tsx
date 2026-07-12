import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/database';
import { verifyToken } from '@repo/auth';
import { getJwtSecret } from '@/lib/env';
import { OrdersClient } from './orders-client';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'My Orders | AfroNile',
  description: 'View your purchase history, order status, and receipts.',
};

export default async function MyOrdersPage() {
  const token = cookies().get('token')?.value;

  if (!token) {
    redirect('/login?redirect=/orders');
  }

  const decoded = verifyToken(token, getJwtSecret());
  if (!decoded) {
    redirect('/login?redirect=/orders');
  }

  const user = await prisma.user.findUnique({
    where: { email: decoded.email },
  });

  if (!user) {
    redirect('/login?redirect=/orders');
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      orderItems: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedOrders = orders.map((order) => ({
    id: order.id,
    status: order.status,
    totalAmountCents: order.totalAmountCents,
    createdAt: order.createdAt.toISOString(),
    itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    items: order.orderItems.map((item) => ({
      title: item.product.title,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      type: item.product.type,
    })),
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <OrdersClient orders={serializedOrders} />
    </div>
  );
}
