import React from 'react';
export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './admin-dashboard-client';

export default async function AdminPage() {
  const token = cookies().get('token')?.value;

  if (!token) {
    redirect('/login?redirect=/admin');
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed token.');
    }
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(payloadBase64));

    if (decoded.role !== 'ADMIN') {
      redirect('/?error=UNAUTHORIZED_ACCESS');
    }
  } catch (e) {
    console.error('Admin page SSR authorization failed:', e);
    redirect('/login?redirect=/admin');
  }

  return <AdminDashboardClient />;
}
