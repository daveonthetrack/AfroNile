import React from 'react';
import { prisma } from '@repo/database';
import { TourClient } from './tour-client';

export const revalidate = 0;

export default async function TourPage() {
  // 1. Fetch events
  const events = await prisma.event.findMany({
    orderBy: { eventDate: 'asc' },
  });

  // 2. Fetch ticket products
  const ticketProducts = await prisma.product.findMany({
    where: { type: 'TICKET_DIGITAL' },
  });

  return (
    <TourClient
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        venueName: e.venueName,
        venueAddress: e.venueAddress,
        eventDate: e.eventDate,
      }))}
      ticketProducts={ticketProducts.map((p) => ({
        id: p.id,
        priceCents: p.priceCents,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
      }))}
    />
  );
}
