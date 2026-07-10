'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function MainContainer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleed = pathname === '/' || pathname.startsWith('/live');

  if (isFullBleed) {
    return (
      <main className="flex-1 w-full">
        {children}
      </main>
    );
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {children}
    </main>
  );
}
