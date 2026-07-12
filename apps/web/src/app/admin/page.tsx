import React from 'react';
export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './admin-dashboard-client';
import { verifyToken } from '@repo/auth';
import { getJwtSecret } from '@/lib/env';

export default async function AdminPage() {
  const token = cookies().get('token')?.value;

  if (!token) {
    redirect('/login?redirect=/admin');
  }

  try {
    const decoded = verifyToken(token, getJwtSecret());
    if (!decoded || decoded.role !== 'ADMIN') {
      redirect('/?error=UNAUTHORIZED_ACCESS');
    }
  } catch (e) {
    console.error('Admin page SSR authorization failed:', e);
    redirect('/login?redirect=/admin');
  }

  return <AdminDashboardClient />;
}

