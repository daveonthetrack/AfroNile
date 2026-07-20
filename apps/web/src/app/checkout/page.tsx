import React from 'react';
import { redirect } from 'next/navigation';
import { CheckoutClient } from './checkout-client';
import { cookies } from 'next/headers';
import { verifyToken } from '@repo/auth';
import Stripe from 'stripe';
import { prisma } from '@repo/database';
import { getJwtSecret, getStripeSecretKey } from '@/lib/env';

export const revalidate = 0;

interface CheckoutPageProps {
  searchParams: {
    order_id?: string;
  };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const orderId = searchParams.order_id;
  const token = cookies().get('token')?.value;
  const sessionUser = token ? verifyToken(token, getJwtSecret()) : null;

  if (!orderId || !sessionUser) {
    redirect('/shop');
  }

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId: sessionUser.userId,
      status: 'PENDING',
      stripePaymentIntentId: { not: null },
    },
    select: {
      stripePaymentIntentId: true,
    },
  });

  if (!order?.stripePaymentIntentId) {
    redirect('/orders');
  }

  const stripe = new Stripe(getStripeSecretKey(), {
    apiVersion: '2024-04-10' as Stripe.LatestApiVersion,
  });
  const paymentIntent = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

  if (
    paymentIntent.metadata.orderId !== orderId ||
    paymentIntent.status === 'canceled' ||
    paymentIntent.status === 'succeeded' ||
    !paymentIntent.client_secret
  ) {
    redirect('/orders');
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <CheckoutClient 
        clientSecret={paymentIntent.client_secret}
        publishableKey={publishableKey} 
        orderId={orderId}
        paymentIntentId={paymentIntent.id}
      />
    </div>
  );
}
