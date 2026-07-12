'use client';

import React, { useState } from 'react';
import { Ticket as TicketIcon, Calendar, MapPin, Copy, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Ticket {
  id: string;
  qrCodeHash: string;
  isScanned: boolean;
  scannedAt: Date | null;
  event: {
    title: string;
    venueName: string;
    venueAddress: string;
    eventDate: Date | string;
  };
}

interface TicketsClientProps {
  tickets: Ticket[];
}

export function TicketsClient({ tickets }: TicketsClientProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (hash: string, index: number) => {
    navigator.clipboard.writeText(hash);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-12 select-none">
      {/* Page Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <TicketIcon className="h-7 w-7 text-primary" />
          <span>My Tickets</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2 font-light">
          Your cryptographic access tickets. Copy the hashes below and verify them on the scanner.
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/10 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 border border-white/10 text-zinc-500">
            <TicketIcon className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">No Tickets Found</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              You haven't purchased any digital tickets yet. Check out the tour dates to secure your spot.
            </p>
          </div>
          <Link
            href="/tour"
            className="inline-flex h-10 px-6 items-center justify-center rounded-full bg-primary hover:bg-primary/95 text-xs font-semibold text-white transition active:scale-98"
          >
            Browse Tour Dates
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tickets.map((ticket, index) => (
            <div
              key={ticket.id}
              className="bg-zinc-900/10 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col justify-between hover:border-white/10 hover:bg-zinc-900/20 transition-all duration-300 relative overflow-hidden group shadow-xl"
            >
              {/* Gold glow top corner */}
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

              <div className="space-y-6 relative z-10">
                {/* Status Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                    Active Pass
                  </span>
                  
                  {ticket.isScanned ? (
                    <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                      Scanned / Used
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Valid / Unused
                    </span>
                  )}
                </div>

                {/* Event Details */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
                    {ticket.event.title}
                  </h3>
                  
                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{formatDate(ticket.event.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="truncate">{ticket.event.venueName}, {ticket.event.venueAddress}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code and Hash Details Block */}
                <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-center bg-white p-3 rounded-xl max-w-[150px] mx-auto">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=000000&bgcolor=ffffff&data=${encodeURIComponent(ticket.qrCodeHash)}`}
                      alt="Concert Ticket QR Code"
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  
                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Ticket Hash</span>
                      <button
                        onClick={() => handleCopy(ticket.qrCodeHash, index)}
                        className="text-zinc-500 hover:text-white transition p-1 hover:bg-white/5 rounded-md flex items-center gap-1 text-[10px]"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Hash</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-400 break-all select-all leading-relaxed text-center">
                      {ticket.qrCodeHash}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                <span className="text-[10px] text-zinc-500 font-mono">
                  ID: {ticket.id.substring(0, 8)}...
                </span>
                
                <Link
                  href="/verify"
                  className="inline-flex h-9 px-4 items-center justify-center rounded-lg border border-white/10 hover:bg-white/5 hover:border-white/20 text-xs font-semibold text-white transition gap-1.5"
                >
                  <span>Go Verify</span>
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
