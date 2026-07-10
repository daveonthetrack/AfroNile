'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { EventRow, TicketStatus } from '../../modules/commerce/components/event-row';
import { useCartStore } from '../../modules/commerce/hooks/useCartStore';

export interface TourClientProps {
  events: {
    id: string;
    title: string;
    venueName: string;
    venueAddress: string;
    eventDate: Date | string;
  }[];
  ticketProducts: {
    id: string;
    priceCents: number;
    sku: string;
    stockQuantity: number;
  }[];
}

export function TourClient({ events, ticketProducts }: TourClientProps) {
  const { addItem } = useCartStore();

  const handleAddTicketToCart = (event: typeof events[number], product: typeof ticketProducts[number]) => {
    addItem({
      id: product.id,
      title: `${event.title} (Digital Ticket)`,
      priceCents: product.priceCents,
      sku: product.sku,
      type: 'TICKET_DIGITAL',
    });
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <Calendar className="h-7 w-7 text-primary" />
          <span>Tour & Live Events</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2 font-light">Join the Nile Waves experience live. Cryptographic ticket verification enforced at gate check-in.</p>
      </div>

      {/* Shows List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-zinc-900/10">
            <Calendar className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No upcoming events scheduled.</p>
          </div>
        ) : (
          events.map((event) => {
            const ticketProd = ticketProducts.find((p) => p.sku === `TICKET_${event.id}`);
            const status: TicketStatus = 
              !ticketProd || ticketProd.stockQuantity === 0 
                ? 'SOLD_OUT' 
                : ticketProd.stockQuantity < 15 
                ? 'LOW_STOCK' 
                : 'AVAILABLE';

            return (
              <EventRow
                key={event.id}
                id={event.id}
                title={event.title}
                venueName={event.venueName}
                venueAddress={event.venueAddress}
                eventDate={event.eventDate}
                priceCents={ticketProd?.priceCents || 4500}
                ticketStatus={status}
                stockLeft={ticketProd?.stockQuantity ?? 0}
                onBuyTickets={() => {
                  if (ticketProd) handleAddTicketToCart(event, ticketProd);
                }}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
