import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@repo/database';
import { CheckoutClient } from './checkout-client';

export const revalidate = 0;

interface CheckoutPageProps {
  searchParams: {
    client_secret?: string;
  };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const token = cookies().get('token')?.value;

  if (!token) {
    const redirectUrl = searchParams.client_secret 
      ? `/login?redirect=/checkout?client_secret=${searchParams.client_secret}`
      : '/login';
    redirect(redirectUrl);
  }

  let userEmail = '';

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(payloadBase64));
      userEmail = decoded.email;
    }
  } catch (e) {
    console.error('Failed to parse cookies token in checkout page:', e);
    redirect('/login');
  }

  if (!userEmail) {
    redirect('/login');
  }

  // Fetch the user to ensure they exist
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    redirect('/login');
  }

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
