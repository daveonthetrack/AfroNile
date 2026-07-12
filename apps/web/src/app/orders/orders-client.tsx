'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Calendar, ArrowRight, Ticket as TicketIcon } from 'lucide-react';

interface OrderItem {
  title: string;
  quantity: number;
  unitPriceCents: number;
  type: string;
}

interface Order {
  id: string;
  status: string;
  totalAmountCents: number;
  createdAt: string;
  itemCount: number;
  items: OrderItem[];
}

interface OrdersClientProps {
  orders: Order[];
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusStyles(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'PENDING':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'FAILED':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'REFUNDED':
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    default:
      return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const hasTickets = (order: Order) =>
    order.status === 'PAID' && order.items.some((item) => item.type === 'TICKET_DIGITAL');

  return (
    <div className="space-y-12 select-none">
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span>My Orders</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2 font-light">
          Your purchase history and order status.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/10 border border-white/5 rounded-3xl p-8 backdrop-blur-md space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 border border-white/10 text-zinc-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">No Orders Yet</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              You haven&apos;t placed any orders. Browse the shop or tour dates to get started.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="inline-flex h-10 px-6 items-center justify-center rounded-full bg-primary hover:bg-primary/95 text-xs font-semibold text-white transition active:scale-98"
            >
              Browse Shop
            </Link>
            <Link
              href="/tour"
              className="inline-flex h-10 px-6 items-center justify-center rounded-full bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-semibold text-zinc-300 hover:text-white transition active:scale-98"
            >
              View Tour
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-zinc-900/10 border border-white/5 rounded-2xl p-6 hover:border-white/10 hover:bg-zinc-900/20 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-zinc-500">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusStyles(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold text-white">{formatCurrency(order.totalAmountCents)}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                    </p>
                  </div>
                  {hasTickets(order) && (
                    <Link
                      href="/tickets"
                      className="inline-flex h-9 px-4 items-center gap-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                    >
                      <TicketIcon className="h-3.5 w-3.5" />
                      <span>Tickets</span>
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-zinc-400">
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <span>{formatCurrency(item.unitPriceCents * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {order.status === 'PENDING' && (
                <p className="mt-4 text-[10px] text-amber-400/80 font-mono uppercase tracking-wider">
                  Payment processing — refresh if you completed checkout.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-center">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition"
        >
          <span>Continue shopping</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
