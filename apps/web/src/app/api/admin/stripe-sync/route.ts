import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@repo/database';
import Stripe from 'stripe';
import { verifyAdminFromRequest } from '@/lib/auth';
import { getStripeSecretKey } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminFromRequest(req)) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const secretKey = getStripeSecretKey();

    const stripe = new Stripe(secretKey, {
      apiVersion: '2024-04-10' as any,
    });

    // 2. Fetch all active products from Stripe
    const stripeProducts = await stripe.products.list({ active: true, limit: 100 });

    const syncedList: string[] = [];

    if (stripeProducts.data.length > 0) {
      // SCENARIO A: Stripe has products. Import/Sync them to local Database
      for (const sp of stripeProducts.data) {
        const prices = await stripe.prices.list({ product: sp.id, active: true });
        const priceCents = prices.data[0]?.unit_amount || 0;
        
        const sku = sp.metadata.sku || `STRIPE_${sp.id}`;
        const title = sp.name;
        const type = (sp.metadata.type as any) || (title.toLowerCase().includes('ticket') ? 'TICKET_DIGITAL' : 'MERCHANDISE');
        const stockQuantity = sp.metadata.stock ? parseInt(sp.metadata.stock) : 100;

        await prisma.product.upsert({
          where: { sku },
          update: {
            title,
            priceCents,
            type,
            stockQuantity,
          },
          create: {
            sku,
            title,
            priceCents,
            type,
            stockQuantity,
          }
        });

        syncedList.push(`Imported Stripe Product: "${title}" ($${(priceCents/100).toFixed(2)})`);
      }

      return NextResponse.json({
        success: true,
        action: 'import',
        message: `Synced ${syncedList.length} products from Stripe to your local database catalog.`,
        details: syncedList,
      });

    } else {
      // SCENARIO B: Stripe is empty. Export local catalog products to Stripe account
      const localProducts = await prisma.product.findMany();
      if (localProducts.length === 0) {
        return NextResponse.json({ error: 'No database catalog items to seed. Please run seed script first.' }, { status: 404 });
      }

      for (const lp of localProducts) {
        // Skip digital album placeholder if it has SKU prefix ALBUM_ but is mock
        const sp = await stripe.products.create({
          name: lp.title,
          description: `AfroNile catalog item: ${lp.title}`,
          metadata: {
            sku: lp.sku,
            type: lp.type,
            stock: String(lp.stockQuantity),
          }
        });

        await stripe.prices.create({
          product: sp.id,
          unit_amount: lp.priceCents,
          currency: 'usd'
        });

        syncedList.push(`Exported local Product: "${lp.title}" ($${(lp.priceCents/100).toFixed(2)})`);
      }

      return NextResponse.json({
        success: true,
        action: 'export',
        message: `Registered ${syncedList.length} local products directly into your Stripe Dashboard catalog.`,
        details: syncedList,
      });
    }

  } catch (error: any) {
    console.error('Stripe Catalog Sync Error:', error);
    return NextResponse.json({ error: 'Internal server error occurred.', details: error.message }, { status: 500 });
  }
}
