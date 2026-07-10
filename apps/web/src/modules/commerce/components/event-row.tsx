'use client';

import React from 'react';
import { Calendar, MapPin, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';

export type TicketStatus = 'AVAILABLE' | 'LOW_STOCK' | 'SOLD_OUT';

export interface EventRowProps {
  id: string;
  title: string;
  venueName: string;
  venueAddress: string;
  eventDate: Date | string;
  priceCents: number;
  ticketStatus: TicketStatus;
  stockLeft?: number;
  onBuyTickets?: (eventId: string) => void;
}

export function EventRow({
  id,
  title,
  venueName,
  venueAddress,
  eventDate,
  priceCents,
  ticketStatus,
  stockLeft,
  onBuyTickets,
}: EventRowProps) {
  const parsedDate = typeof eventDate === 'string' ? new Date(eventDate) : eventDate;

  // Formatting helpers
  const day = parsedDate.getDate();
  const month = parsedDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const year = parsedDate.getFullYear();
  const time = parsedDate.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
  const formattedPrice = (priceCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm transition-all duration-300 hover:bg-zinc-900/80 hover:border-white/10 hover:shadow-xl">
      {/* Event Date Block & Details */}
      <div className="flex items-center gap-5 min-w-0">
        {/* Date Calendar Graphic */}
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-zinc-950 border border-white/10 shrink-0 group-hover:border-primary/40 transition-colors">
          <span className="text-xs font-semibold text-zinc-500 tracking-wider">{month}</span>
          <span className="text-2xl font-bold text-white leading-none tracking-tight">{day}</span>
        </div>

        {/* Text Details */}
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-white truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-zinc-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="truncate">
                {venueName}, {venueAddress}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
              <span className="tabular-nums">
                {time} • {year}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Call to Action */}
      <div className="flex items-center justify-between md:justify-end gap-6 border-t border-white/5 pt-3 md:border-t-0 md:pt-0 shrink-0">
        <div className="flex flex-col md:items-end">
          <span className="text-xs text-zinc-500 font-medium">Tickets from</span>
          <span className="text-lg font-bold text-white tabular-nums">{formattedPrice}</span>
        </div>

        <div className="flex items-center gap-3">
          {ticketStatus === 'LOW_STOCK' && (
            <div className="hidden lg:flex items-center gap-1 text-amber-500 text-xs font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              <span>Only {stockLeft || 5} left</span>
            </div>
          )}

          <button
            onClick={() => onBuyTickets?.(id)}
            disabled={ticketStatus === 'SOLD_OUT'}
            className={cn(
              'h-10 px-6 rounded-md text-sm font-semibold transition-all duration-300 transform active:scale-95',
              ticketStatus === 'AVAILABLE' &&
                'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20',
              ticketStatus === 'LOW_STOCK' &&
                'bg-amber-600 text-white hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-600/20',
              ticketStatus === 'SOLD_OUT' &&
                'bg-zinc-800 text-zinc-500 cursor-not-allowed active:scale-100'
            )}
          >
            {ticketStatus === 'AVAILABLE' && 'Get Tickets'}
            {ticketStatus === 'LOW_STOCK' && 'Selling Fast'}
            {ticketStatus === 'SOLD_OUT' && 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
