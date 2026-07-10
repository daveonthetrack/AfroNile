import React from 'react';
import { redirect } from 'next/navigation';
import { CheckoutClient } from './checkout-client';

export const revalidate = 0;

interface CheckoutPageProps {
  searchParams: {
    client_secret?: string;
  };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const clientSecret = searchParams.client_secret;
  if (!clientSecret) {
    redirect('/shop');
  }

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <CheckoutClient 
        clientSecret={clientSecret} 
        publishableKey={publishableKey} 
      />
    </div>
  );
}
