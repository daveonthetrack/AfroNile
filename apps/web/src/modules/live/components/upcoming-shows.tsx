'use client';

import React from 'react';
import { Calendar, Ticket } from 'lucide-react';
import { useCartStore } from '../../commerce/hooks/useCartStore';

interface LiveEvent {
  id: string;
  title: string;
  venueName: string;
  venueAddress: string;
  eventDate: Date | string;
}

interface UpcomingShowsProps {
  events: LiveEvent[];
  ticketProduct: {
    id: string;
    sku: string;
    priceCents: number;
    stockQuantity: number;
  } | null;
}

export function UpcomingShows({ events, ticketProduct }: UpcomingShowsProps) {
  const { addItem } = useCartStore();
  const nextEvent = events[0] || null;

  const handleBuyTicket = () => {
    if (!nextEvent || !ticketProduct) return;
    addItem({
      id: ticketProduct.id,
      title: `${nextEvent.title} (Digital Ticket)`,
      priceCents: ticketProduct.priceCents,
      sku: ticketProduct.sku,
      type: 'TICKET_DIGITAL',
    });
  };

  if (!nextEvent) {
    return null;
  }

  const dateStr = new Date(nextEvent.eventDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-zinc-900/10 border border-white/5 p-6 rounded-3xl backdrop-blur-md space-y-6 shadow-xl select-none">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-primary" />
          <span>Next Performance</span>
        </h3>
        <p className="text-xs text-zinc-500 font-light">Join us live on our upcoming tour dates.</p>
      </div>

      <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-4">
        <div className="space-y-1">
          <span className="text-[9px] font-bold text-primary uppercase tracking-widest block font-mono">
            {dateStr}
          </span>
          <h4 className="text-sm font-bold text-white tracking-tight leading-none">
            {nextEvent.title}
          </h4>
          <span className="text-xs text-zinc-500 font-light block">
            {nextEvent.venueName}, {nextEvent.venueAddress.split(',')[1]?.trim() || nextEvent.venueAddress}
          </span>
        </div>

        {ticketProduct && ticketProduct.stockQuantity > 0 && (
          <button
            onClick={handleBuyTicket}
            className="w-full h-10 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Ticket className="h-4 w-4" />
            <span>Get Tickets — ${(ticketProduct.priceCents / 100).toFixed(2)}</span>
          </button>
        )}
      </div>
    </div>
  );
}
