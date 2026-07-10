'use client';

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCartStore } from '../hooks/useCartStore';

export interface CartDrawerProps {
  userId: string;
}

export function CartDrawer({ userId }: CartDrawerProps) {
  const { 
    items, 
    isOpen, 
    setIsOpen, 
    updateQuantity, 
    removeItem, 
    getCartTotal, 
    clearCart 
  } = useCartStore();

  const [checkoutStatus, setCheckoutStatus] = useState<{
    loading: boolean;
    success?: boolean;
    orderId?: string;
    clientSecret?: string;
    error?: string;
  } | null>(null);

  // Prevent scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setCheckoutStatus({ loading: true });
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      if (data.clientSecret) {
        clearCart();
        window.location.href = `/checkout?client_secret=${data.clientSecret}`;
        return;
      }

      setCheckoutStatus({
        loading: false,
        success: true,
        orderId: data.orderId,
        clientSecret: data.stripeClientSecret,
      });

      // Clear local cart
      clearCart();

    } catch (err: any) {
      setCheckoutStatus({
        loading: false,
        error: err.message || 'An error occurred during checkout',
      });
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in-0"
        onClick={() => setIsOpen(false)}
      />

      {/* Sliding Drawer Container */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md bg-zinc-950 border-l border-white/5 shadow-2xl flex flex-col justify-between h-full animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Shopping Cart</h2>
              <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-zinc-400 font-mono">
                {items.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
            {checkoutStatus && (
              <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 text-center space-y-4 animate-in zoom-in-95 duration-200">
                {checkoutStatus.loading && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-3">
                    <div className="h-8 w-8 border-t-2 border-primary rounded-full animate-spin" />
                    <p className="text-sm font-semibold text-zinc-300">Reserving stocks & creating order...</p>
                  </div>
                )}

                {checkoutStatus.success && (
                  <div className="space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Order Success!</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">Ref: {checkoutStatus.orderId?.substring(0, 12)}...</p>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-white/5 text-left text-xs font-mono break-all space-y-1">
                      <span className="text-zinc-500 block">Stripe secret token:</span>
                      <span className="text-primary">{checkoutStatus.clientSecret}</span>
                    </div>
                    <button
                      onClick={() => setCheckoutStatus(null)}
                      className="w-full h-9 rounded bg-white hover:bg-zinc-200 text-xs font-bold text-black transition"
                    >
                      Continue Shopping
                    </button>
                  </div>
                )}

                {checkoutStatus.error && (
                  <div className="space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                      <AlertCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Order Declined</h3>
                      <p className="text-xs text-red-400 mt-1 leading-relaxed">{checkoutStatus.error}</p>
                    </div>
                    <button
                      onClick={() => setCheckoutStatus(null)}
                      className="w-full h-9 rounded bg-zinc-800 text-xs font-semibold text-white transition"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}

            {!checkoutStatus && items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
                <div className="h-12 w-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-600">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-400">Your cart is empty</p>
                  <p className="text-xs text-zinc-600 mt-1">Browse music or tour products to add them.</p>
                </div>
              </div>
            ) : (
              !checkoutStatus && items.map((item) => (
                <div 
                  key={item.id} 
                  className="flex gap-4 p-4 rounded-xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition"
                >
                  {/* Cart Item Detail */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{item.type}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-white/10 rounded bg-zinc-950">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-zinc-500 hover:text-white transition"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2 text-xs font-semibold text-white min-w-4 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-zinc-500 hover:text-white transition"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Price & Trash */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white tabular-nums">
                          {formatPrice(item.priceCents * item.quantity)}
                        </span>
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="text-zinc-600 hover:text-red-400 p-1 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkouts */}
          {items.length > 0 && !checkoutStatus && (
            <div className="p-6 border-t border-white/5 bg-zinc-900/20 space-y-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-zinc-400">Total Subtotal</span>
                <span className="text-lg font-bold text-white tabular-nums">{formatPrice(getCartTotal())}</span>
              </div>
              
              {userId ? (
                <button
                  onClick={handleCheckout}
                  className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition active:scale-95"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Confirm Purchase</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
                  }}
                  className="w-full h-11 bg-zinc-900 border border-white/10 hover:bg-white/5 hover:border-white/20 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Sign In to Checkout</span>
                </button>
              )}
              
              <div className="text-[10px] text-zinc-600 text-center">
                Secure SSL checkouts. Tickets generated immediately upon payment approval.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
