import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/database';
import { TicketsClient } from './tickets-client';

export const revalidate = 0;

export default async function MyTicketsPage() {
  const token = cookies().get('token')?.value;

  if (!token) {
    redirect('/login?redirect=/tickets');
  }

  let userEmail = '';

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(payloadBase64));
      userEmail = decoded.email;
    }
  } catch (e) {
    console.error('Failed to parse cookies token in tickets page:', e);
    redirect('/login?redirect=/tickets');
  }

  if (!userEmail) {
    redirect('/login?redirect=/tickets');
  }

  // Fetch the user ID
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    redirect('/login?redirect=/tickets');
  }

  // Fetch all user's tickets where the order status is PAID
  const tickets = await prisma.ticket.findMany({
    where: {
      orderItem: {
        order: {
          userId: user.id,
          status: 'PAID',
        },
      },
    },
    include: {
      event: true,
      orderItem: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      event: {
        eventDate: 'asc',
      },
    },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <TicketsClient tickets={tickets} />
    </div>
  );
}
