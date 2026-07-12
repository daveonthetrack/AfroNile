'use client';

import React from 'react';
import { Calendar, MapPin, AlertCircle, Sparkles } from 'lucide-react';
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
  const day = parsedDate.getDate().toString().padStart(2, '0');
  const month = parsedDate.toLocaleString('default', { month: 'short' }).toUpperCase();
  const year = parsedDate.getFullYear();
  const time = parsedDate.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
  const formattedPrice = (priceCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="group relative flex flex-col lg:flex-row justify-between items-stretch rounded-[2rem] border border-white/5 bg-zinc-950/40 backdrop-blur-md overflow-hidden transition-all duration-500 hover:border-primary/20 hover:bg-zinc-900/20 hover:shadow-2xl">
      
      {/* Dynamic Gold Left Accents */}
      <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors duration-300" />

      {/* Ticket Left Body: Event details */}
      <div className="flex-1 p-6 flex flex-col sm:flex-row items-center gap-6 text-left">
        {/* Date Ticket Block */}
        <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-zinc-900/80 border border-white/5 shrink-0 group-hover:border-primary/25 transition-all duration-300">
          <span className="text-[10px] font-bold text-zinc-550 font-mono tracking-wider">{month}</span>
          <span className="text-3xl font-black font-serif text-white leading-none tracking-wide mt-1">{day}</span>
        </div>

        {/* Text Details */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-bold text-primary uppercase tracking-widest font-mono flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5 animate-pulse" />
              <span>Concert Arena Access</span>
            </span>
          </div>

          <h3 className="text-lg font-serif font-bold text-white tracking-wide truncate group-hover:text-primary transition-colors">
            {title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
              <span className="truncate">{venueName}, {venueAddress}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <Calendar className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
              <span>{time} • {year}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Perforation Line divider (Visual Physical Ticket Tear-point) */}
      <div className="hidden lg:flex flex-col justify-between items-center py-2 relative shrink-0">
        <div className="w-4 h-4 rounded-full bg-[#020202] border-b border-white/5 -mt-4 absolute top-0" />
        <div className="w-0.5 h-full border-l border-dashed border-white/10" />
        <div className="w-4 h-4 rounded-full bg-[#020202] border-t border-white/5 -mb-4 absolute bottom-0" />
      </div>

      {/* Ticket Right Stub: Selections & Price */}
      <div className="w-full lg:w-72 p-6 bg-white/[0.01] border-t lg:border-t-0 lg:border-l border-white/5 flex flex-row lg:flex-col items-center lg:items-center justify-between lg:justify-center gap-4 shrink-0">
        
        <div className="flex flex-col lg:items-center text-left lg:text-center space-y-1">
          <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-mono">Access Ticket</span>
          <span className="text-xl font-bold text-white font-mono">{formattedPrice}</span>
        </div>

        <div className="flex items-center gap-3">
          {ticketStatus === 'LOW_STOCK' && (
            <div className="hidden sm:flex items-center gap-1 text-amber-500 text-[9px] font-bold uppercase font-mono tracking-wider bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 animate-pulse">
              <AlertCircle className="h-3 w-3" />
              <span>{stockLeft || 5} left</span>
            </div>
          )}

          <button
            onClick={() => onBuyTickets?.(id)}
            disabled={ticketStatus === 'SOLD_OUT'}
            className={cn(
              'h-9 px-6 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 transform active:scale-95 shadow-md',
              ticketStatus === 'AVAILABLE' &&
                'bg-primary text-white hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20',
              ticketStatus === 'LOW_STOCK' &&
                'bg-amber-600 text-white hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-600/20',
              ticketStatus === 'SOLD_OUT' &&
                'bg-zinc-850 text-zinc-600 cursor-not-allowed active:scale-100'
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
