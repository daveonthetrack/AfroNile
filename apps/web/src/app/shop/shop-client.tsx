'use client';

import React, { useState } from 'react';
import { ShoppingBag, Plus, AlertCircle } from 'lucide-react';
import { useCartStore } from '../../modules/commerce/hooks/useCartStore';
import { cn } from '../../lib/utils';
import { resolveProductImageUrl } from '../../lib/product-image';

export interface ShopClientProps {
  products: {
    id: string;
    title: string;
    priceCents: number;
    sku: string;
    stockQuantity: number;
    imageUrl: string | null;
  }[];
}

export function ShopClient({ products }: ShopClientProps) {
  const { addItem } = useCartStore();
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  const handleAddToCart = (product: typeof products[number]) => {
    const size = selectedSizes[product.id] ? ` (${selectedSizes[product.id]})` : '';
    addItem({
      id: product.id,
      title: `${product.title}${size}`,
      priceCents: product.priceCents,
      sku: product.sku,
      type: 'MERCHANDISE',
    });
  };

  const handleSelectSize = (productId: string, size: string) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: size,
    }));
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  const renderProductGraphic = (title: string, imageUrl: string | null) => {
    const src = resolveProductImageUrl(imageUrl, title);

    if (src) {
      return (
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
        />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 text-zinc-600 gap-2">
        <ShoppingBag className="w-12 h-12 stroke-[0.75] text-zinc-700 animate-pulse" />
        <span className="text-[8px] font-mono tracking-widest uppercase">Premium Artifact</span>
      </div>
    );
  };

  return (
    <div className="space-y-16 pt-16 select-none">
      
      {/* Banner */}
      <div className="border-b border-white/5 pb-6 text-left">
        <h1 className="text-4xl font-serif font-black text-white tracking-wide flex items-center gap-3">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <span>BOUTIQUE</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-2 font-mono uppercase tracking-widest">
          Premium Artifacts & Physical Releases
        </p>
      </div>

      {/* Merch grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-20 text-zinc-500 font-mono border border-dashed border-white/5 rounded-[2.5rem]">
            No catalog items currently listed.
          </div>
        ) : (
          products.map((item) => {
            const isClothing = item.title.toLowerCase().includes('shirt') || item.title.toLowerCase().includes('tee') || item.title.toLowerCase().includes('hoodie');
            const sizes = ['S', 'M', 'L', 'XL'];
            const activeSize = selectedSizes[item.id] || '';

            return (
              <div
                key={item.id}
                className="glass-card rounded-[2.5rem] p-5 flex flex-col justify-between hover:border-white/10 hover:bg-zinc-900/20 transition-all duration-500 group shadow-lg"
              >
                <div className="space-y-6 text-left">
                  {/* Image Presentation Box */}
                  <div className="aspect-square w-full rounded-3xl bg-zinc-950/65 border border-white/5 flex items-center justify-center relative overflow-hidden shadow-inner">
                    {renderProductGraphic(item.title, item.imageUrl)}
                    
                    {item.stockQuantity <= 10 && item.stockQuantity > 0 && (
                      <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold font-mono text-amber-500 uppercase tracking-wider animate-pulse">
                        LOW STOCK
                      </span>
                    )}
                    
                    {item.stockQuantity === 0 && (
                      <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-6 h-6 text-zinc-500" />
                        <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest">
                          OUT OF STOCK
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">
                        {item.sku.startsWith('ALBUM_') ? 'Physical Wax Release' : 'Boutique Collection'}
                      </span>
                      <h3 className="text-base font-bold text-white truncate">{item.title}</h3>
                    </div>

                    {/* Clothing Size Selector */}
                    {isClothing && item.stockQuantity > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest font-mono block">Select Size</span>
                        <div className="flex gap-1.5">
                          {sizes.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSelectSize(item.id, s)}
                              className={cn(
                                "h-6 w-8 rounded text-[9px] font-bold font-mono border transition-all",
                                activeSize === s 
                                  ? "bg-white border-white text-black" 
                                  : "bg-zinc-950/60 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-8">
                  <span className="text-lg font-bold text-white font-mono tabular-nums">
                    {formatPrice(item.priceCents)}
                  </span>
                  
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={item.stockQuantity === 0}
                    className="h-9 px-5 rounded-full bg-primary hover:bg-primary/95 text-white text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 active:scale-98 disabled:bg-zinc-850 disabled:text-zinc-600 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Purchase</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
