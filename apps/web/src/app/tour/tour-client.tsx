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
    <div className="space-y-16 pt-16 select-none text-left">
      
      {/* Banner */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-serif font-black text-white tracking-wide flex items-center gap-3">
          <Calendar className="h-7 w-7 text-primary" />
          <span>LIVE EVENTS</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-2 font-mono uppercase tracking-widest">
          Nile Waves Experience • Peer-to-Peer Gate verification
        </p>
      </div>

      {/* Shows List */}
      <div className="space-y-6">
        {events.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/5 rounded-[2.5rem] bg-zinc-950/40">
            <Calendar className="h-8 w-8 text-zinc-700 mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-zinc-550 font-mono uppercase tracking-wider">No upcoming events scheduled</p>
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
