'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '../../lib/utils';

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isFullBleed = pathname === '/' || pathname.startsWith('/live') || isAdmin;

  if (isFullBleed) {
    return (
      <main className={cn('flex-1 w-full', isAdmin && 'pt-24')}>
        {children}
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-32">
      {children}
    </main>
  );
}
