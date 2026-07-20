'use client';

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ArrowLeft, ShieldCheck, Ticket as TicketIcon, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { StripePaymentForm } from '@/modules/commerce/components/stripe-payment-form';

interface CheckoutClientProps {
  clientSecret: string;
  publishableKey: string;
  orderId: string;
  paymentIntentId: string;
}

export function CheckoutClient({ clientSecret, publishableKey, orderId, paymentIntentId }: CheckoutClientProps) {
  const stripePromise = loadStripe(publishableKey);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start select-none pt-12 text-left">
      
      {/* Checkout form container */}
      <div className="lg:col-span-8 space-y-6">
        <Link 
          href="/shop" 
          className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Boutique</span>
        </Link>
        
        <div className="glass-card rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative min-h-[450px] flex flex-col justify-center overflow-hidden">
          {/* Backglow decor */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-primary/5 blur-[90px] pointer-events-none" />

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: 'night', variables: { colorPrimary: '#ff3366' } },
            }}
          >
            <StripePaymentForm
              clientSecret={clientSecret}
              returnUrl={`/api/checkout/success?payment_intent=${encodeURIComponent(paymentIntentId)}&order_id=${encodeURIComponent(orderId)}`}
              submitLabel="Complete purchase"
            />
          </Elements>
        </div>
      </div>

      {/* Sidebar Details */}
      <div className="lg:col-span-4 space-y-8 glass-card p-6 md:p-8 rounded-[2.5rem]">
        <div className="space-y-3">
          <h2 className="text-lg font-serif font-bold text-white tracking-wide flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            <span>SECURE GATE</span>
          </h2>
          <p className="text-xs text-zinc-450 leading-relaxed font-light">
            Your credentials and card details are encrypted and securely processed directly on-site via Stripe.
          </p>
        </div>

        <div className="border-t border-white/5 pt-6 space-y-6">
          <h3 className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest font-mono">Fulfillment Rules</h3>
          
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <TicketIcon className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Digital Access Tickets</h4>
                <p className="text-[10px] text-zinc-450 leading-relaxed">
                  Generated instantly. View your QR codes on your dashboard under <span className="font-semibold text-white">My Tickets</span> to scan at entry.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wide">Physical Artifacts</h4>
                <p className="text-[10px] text-zinc-450 leading-relaxed">
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
