import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@repo/database';
import { BackingStatusCheck } from './backing-status-check';

export const revalidate = 0;

interface MemoryPageProps {
  params: {
    id: string;
  };
}

export default async function ConcertMemoryPage({ params }: MemoryPageProps) {
  const contribution = await prisma.supportContribution.findUnique({
    where: { id: params.id },
  });

  if (!contribution) {
    notFound();
  }

  const isPaid = contribution.stripeSessionId !== null;

  const initialStatus = isPaid ? 'PAID' : 'PENDING';

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <BackingStatusCheck contributionId={contribution.id} initialStatus={initialStatus} />
    </div>
  );
}
