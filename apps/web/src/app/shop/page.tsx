import React from 'react';
import { prisma } from '@repo/database';
import { ShopClient } from './shop-client';

export const revalidate = 300;

export default async function ShopPage() {
  // 1. Fetch products of type MERCHANDISE
  const products = await prisma.product.findMany({
    where: { type: 'MERCHANDISE' },
    orderBy: { priceCents: 'asc' },
  });

  return (
    <ShopClient
      products={products.map((p) => ({
        id: p.id,
        title: p.title,
        priceCents: p.priceCents,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        imageUrl: p.imageUrl,
      }))}
    />
  );
}
