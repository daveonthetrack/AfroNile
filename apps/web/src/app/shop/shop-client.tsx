'use client';

import React from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import { useCartStore } from '../../modules/commerce/hooks/useCartStore';

export interface ShopClientProps {
  products: {
    id: string;
    title: string;
    priceCents: number;
    sku: string;
    stockQuantity: number;
  }[];
}

export function ShopClient({ products }: ShopClientProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = (product: typeof products[number]) => {
    addItem({
      id: product.id,
      title: product.title,
      priceCents: product.priceCents,
      sku: product.sku,
      type: 'MERCHANDISE',
    });
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const renderProductGraphic = (title: string) => {
    const name = title.toLowerCase();
    
    // Vinyl/Record styling
    if (name.includes('vinyl') || name.includes('record')) {
      return (
        <img 
          src="/nile_waves_album_art.jpg" 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      );
    }
    
    // Hoodie/T-Shirt styling
    if (name.includes('shirt') || name.includes('tee') || name.includes('hoodie') || name.includes('apparel')) {
      return (
        <img 
          src="/Tshirt.png" 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      );
    }
    
    // Cap/Hat styling
    if (name.includes('hat') || name.includes('cap') || name.includes('beanie')) {
      return (
        <svg className="w-20 h-20 text-zinc-700 stroke-[0.75] transition-transform duration-500 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 17 C3 9, 13 9, 13 17 Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11 17 C 14 17, 21 18, 21 16 C 21 14, 13 15, 11 17" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="11" r="1.5" />
        </svg>
      );
    }

    // Default Vinyl/Release styling
    return (
      <svg className="w-20 h-20 text-zinc-700 stroke-[0.75] transition-transform duration-500 group-hover:scale-105" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="3" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    );
  };

  return (
    <div className="space-y-12">
      {/* Banner */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span>Official Store</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-2 font-light">Exclusive physical and digital merch. Secure checkout processed directly.</p>
      </div>

      {/* Merch grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-12 text-zinc-500">
            No merchandise catalog items currently listed.
          </div>
        ) : (
          products.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900/10 border border-white/5 p-6 rounded-3xl flex flex-col justify-between hover:border-white/10 hover:bg-zinc-900/20 transition-all duration-300 group shadow-md"
            >
              <div className="space-y-6">
                {/* Image Placeholder Box */}
                <div className="aspect-square w-full rounded-2xl bg-zinc-950/65 border border-white/5 flex items-center justify-center relative overflow-hidden">
                  {renderProductGraphic(item.title)}
                  
                  {item.stockQuantity <= 10 && item.stockQuantity > 0 && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-500 uppercase tracking-wider animate-pulse">
                      Low Stock
                    </span>
                  )}
                  {item.stockQuantity === 0 && (
                    <span className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-bold text-zinc-400">
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Limited Edition</span>
                  <h3 className="text-base font-bold text-white truncate">{item.title}</h3>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-8">
                <span className="text-xl font-extrabold text-white tabular-nums">
                  {formatPrice(item.priceCents)}
                </span>
                
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={item.stockQuantity === 0}
                  className="h-10 px-5 rounded-full bg-primary hover:bg-primary/95 text-white text-xs font-semibold transition flex items-center gap-1.5 active:scale-98 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
