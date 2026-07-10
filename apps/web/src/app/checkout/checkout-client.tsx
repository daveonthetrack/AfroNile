'use client';

import React, { useEffect, useRef, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, ShieldCheck, Ticket as TicketIcon, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface CheckoutClientProps {
  clientSecret: string;
  publishableKey: string;
}

export function CheckoutClient({ clientSecret, publishableKey }: CheckoutClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const checkoutInstanceRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientSecret || !publishableKey || !containerRef.current) return;

    let active = true;

    async function initializeCheckout() {
      try {
        const stripe = await loadStripe(publishableKey);
        if (!stripe || !active) return;

        const checkout = await (stripe as any).createEmbeddedCheckoutPage({
          clientSecret,
        });

        if (active) {
          checkout.mount(containerRef.current);
          checkoutInstanceRef.current = checkout;
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading Stripe checkout:', err);
        if (active) {
          setError(err.message || 'Failed to initialize payment form.');
          setLoading(false);
        }
      }
    }

    initializeCheckout();

    return () => {
      active = false;
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.destroy();
      }
    };
  }, [clientSecret, publishableKey]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start select-none">
      
      {/* Checkout form container */}
      <div className="lg:col-span-2 space-y-6">
        <Link 
          href="/shop" 
          className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Shop</span>
        </Link>
        
        <div className="bg-zinc-900/10 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative min-h-[450px] flex flex-col justify-center">
          
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-4 py-20">
              <div className="h-10 w-10 border-t-2 border-primary rounded-full animate-spin" />
              <p className="text-sm font-medium text-zinc-400">Loading secure payment portal...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-20 space-y-4 max-w-sm mx-auto">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-white">Payment Portal Error</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
              <Link
                href="/shop"
                className="inline-flex h-9 px-5 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-white transition hover:bg-zinc-700"
              >
                Go back to shop
              </Link>
            </div>
          )}

          {/* Stripe Mount Point */}
          <div 
            ref={containerRef} 
            id="checkout" 
            className={`${loading || error ? 'hidden' : 'block'} w-full transition-opacity duration-300`}
          />
        </div>
      </div>

      {/* Sidebar Details */}
      <div className="lg:col-span-1 space-y-8 bg-zinc-900/10 border border-white/5 p-6 md:p-8 rounded-3xl backdrop-blur-md">
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Secure Payment</span>
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-light">
            Your credentials and card details are encrypted and securely processed directly on-site via Stripe.
          </p>
        </div>

        <div className="border-t border-white/5 pt-6 space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Post-Purchase Fulfillment</h3>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <TicketIcon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Digital Tickets</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">
                  Generated instantly. View your QR codes on your dashboard under <span className="font-semibold text-white">My Tickets</span> to scan at entry.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Merch & Products</h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed mt-0.5">
                  Order status updates will be logged to your account. Shipping confirmation emails will be sent out within 48 hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
