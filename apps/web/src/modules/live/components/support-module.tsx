'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { SUPPORT_TIERS } from '../constants';

interface SupportModuleProps {
  eventId: string;
  selectedTier: number | null;
  setSelectedTier: (tier: number | null) => void;
  customAmount: string;
  setCustomAmount: (amount: string) => void;
  email: string;
  setEmail: (email: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  comment: string;
  setComment: (comment: string) => void;
}

export function SupportModule({
  eventId,
  selectedTier,
  setSelectedTier,
  customAmount,
  setCustomAmount,
  email,
  setEmail,
  phone,
  setPhone,
  comment,
  setComment,
}: SupportModuleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stripe Embedded states
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const checkoutContainerRef = useRef<HTMLDivElement>(null);
  const checkoutInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!stripeClientSecret || !checkoutContainerRef.current) return;

    let active = true;

    async function initializeEmbeddedCheckout() {
      try {
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
        const stripe = await loadStripe(publishableKey);
        if (!stripe || !active) return;

        const checkout = await (stripe as any).createEmbeddedCheckoutPage({
          clientSecret: stripeClientSecret,
        });

        if (active) {
          checkout.mount(checkoutContainerRef.current);
          checkoutInstanceRef.current = checkout;
          
          // Smooth scroll to the checkout portal after rendering
          setTimeout(() => {
            checkoutContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }
      } catch (err: any) {
        console.error('Failed to initialize embedded Stripe Checkout locally:', err);
        if (active) {
          setError(err.message || 'Could not load payment form.');
        }
      }
    }

    initializeEmbeddedCheckout();

    return () => {
      active = false;
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.destroy();
      }
    };
  }, [stripeClientSecret]);

  const handleSupportSubmit = async () => {
    setError(null);
    let finalAmountCents = 0;

    if (selectedTier !== null) {
      finalAmountCents = selectedTier * 100;
    } else {
      const parsedCustom = parseFloat(customAmount);
      if (isNaN(parsedCustom) || parsedCustom <= 0) {
        setError('Please select or enter support amount first.');
        return;
      }
      finalAmountCents = Math.round(parsedCustom * 100);
    }

    if (!email.trim() || !email.includes('@')) {
      setError('YOUR EMAIL is required to receive your concert keepsake.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        amountCents: finalAmountCents,
        eventId,
        email: email.trim(),
        phone: phone.trim() || null,
        comment: comment.trim() || null,
        paymentType: 'CARD', // default wrapper
      };

      const res = await fetch('/api/live/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit backing.');
      }

      if (data.clientSecret) {
        setStripeClientSecret(data.clientSecret);
      } else {
        // Demo Mode Fallback: Simulated network check-in latency
        await new Promise((resolve) => setTimeout(resolve, 1500));
        router.push(`/live/memory/${data.contributionId}`);
      }
    } catch (err: any) {
      console.error('Support backing failed:', err);
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Get active energy rating
  const getEnergyLevel = () => {
    if (selectedTier === 5) return 'Gentle Vibe';
    if (selectedTier === 10) return 'Deep Pulse';
    if (selectedTier === 20) return 'Sonic Storm 🔥';
    if (selectedTier === 50) return 'Giza Overload ⚡';
    if (customAmount) return 'Custom Momentum';
    return 'Calm Vibe';
  };

  return (
    <div className="space-y-6 max-w-sm mx-auto select-none text-left">
      
      {error && (
        <div className="p-3 text-[11px] font-mono text-center text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl uppercase tracking-wider animate-in fade-in duration-200">
          {error}
        </div>
      )}

      {/* 1. Share Your Story Card */}
      <div className="bg-[#f4efe6] text-[#2c2a27] rounded-[28px] p-5 space-y-3 shadow-lg hover:shadow-xl transition-all duration-300 relative group overflow-hidden border border-transparent hover:border-zinc-300">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold tracking-tight">Share Your Story</h4>
          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-bold bg-zinc-200/60 px-2 py-0.5 rounded-full">Family Share</span>
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="SHARE YOUR CONCERT EXPERIENCE OR VIBE..."
          rows={3}
          className="w-full bg-transparent border-0 text-xs font-mono font-medium placeholder-zinc-500/75 text-zinc-900 focus:outline-none resize-none uppercase"
          disabled={!!stripeClientSecret}
        />
      </div>

      {/* 2. Join the Family Card */}
      <div className="bg-[#f4efe6] text-[#2c2a27] rounded-[28px] p-5 space-y-3.5 shadow-lg hover:shadow-xl transition-all duration-300 border border-transparent hover:border-zinc-300">
        <h4 className="text-sm font-bold tracking-tight">Join the AfroNile Family</h4>
        <div className="space-y-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="YOUR EMAIL"
            className="w-full h-10 px-4 rounded-full bg-black/[0.04] border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs font-mono text-zinc-900 focus:outline-none uppercase placeholder-zinc-500/65 focus:bg-white transition-all duration-200"
            disabled={!!stripeClientSecret}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="YOUR PHONE NUMBER"
            className="w-full h-10 px-4 rounded-full bg-black/[0.04] border border-black/10 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs font-mono text-zinc-900 focus:outline-none uppercase placeholder-zinc-500/65 focus:bg-white transition-all duration-200"
            disabled={!!stripeClientSecret}
          />
        </div>
      </div>

      {/* 3. Support Tiers Grid */}
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Select Support Tier</span>
          <span className="text-[9px] font-bold text-primary uppercase tracking-widest font-mono flex items-center gap-1">
            <Sparkles className="h-3 w-3 animate-spin duration-[5000ms]" />
            <span>{getEnergyLevel()}</span>
          </span>
        </div>
        
        <div className="grid grid-cols-4 gap-2 text-center">
          {SUPPORT_TIERS.map((amount) => {
            const isSelected = selectedTier === amount;
            const boostMapping: Record<number, string> = { 5: '+10', 10: '+25', 20: '+60', 50: '+200' };
            return (
              <button
                key={amount}
                disabled={!!stripeClientSecret}
                onClick={() => {
                  setSelectedTier(amount);
                  setCustomAmount('');
                  setError(null);
                }}
                className={`h-15 rounded-2xl flex flex-col justify-center items-center border transition-all duration-300 relative ${
                  isSelected
                    ? 'bg-white border-white text-black scale-105 shadow-[0_8px_20px_-4px_rgba(245,158,11,0.3)] ring-2 ring-primary z-10'
                    : 'bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/25 hover:scale-102 hover:text-white disabled:opacity-50'
                }`}
              >
                <span className="text-xs font-black font-mono tracking-tight">${amount}</span>
                <span className={`text-[6.5px] font-bold font-mono mt-1 px-1 py-0.5 rounded tracking-tighter uppercase transition-colors ${
                  isSelected 
                    ? 'bg-amber-500/10 text-amber-700' 
                    : 'bg-white/5 text-zinc-500'
                }`}>
                  {boostMapping[amount]} BOOST
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Amount Form */}
      <div className="relative group">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 font-mono">$</span>
        <input
          type="number"
          value={customAmount}
          onChange={(e) => {
            setCustomAmount(e.target.value);
            setSelectedTier(null);
            setError(null);
          }}
          disabled={!!stripeClientSecret}
          placeholder="OR ENTER CUSTOM AMOUNT..."
          className="w-full h-10 pl-7 pr-4 rounded-xl bg-zinc-900/50 border border-white/5 focus:border-primary/50 text-[10px] text-white focus:outline-none transition-all font-mono uppercase group-hover:border-white/10 disabled:opacity-50"
        />
      </div>

      {/* Single Contribute Trigger */}
      <div className="pt-3">
        <button
          onClick={handleSupportSubmit}
          disabled={loading || !!stripeClientSecret}
          className="w-full h-12 bg-primary hover:bg-primary/95 text-white rounded-full font-bold text-sm transition-all active:scale-98 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-xs uppercase font-mono tracking-widest text-zinc-300">Generating Portal...</span>
            </div>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>Contribute Cairo Waves</span>
            </>
          )}
        </button>
      </div>

      {/* Expandable Embedded Stripe Form */}
      {stripeClientSecret && (
        <div className="bg-zinc-950/65 border border-white/5 rounded-3xl p-4 md:p-6 shadow-2xl relative min-h-[350px] animate-in slide-in-from-top duration-500 mt-6">
          <div ref={checkoutContainerRef} id="checkout" className="w-full transition-opacity duration-300" />
        </div>
      )}

    </div>
  );
}
