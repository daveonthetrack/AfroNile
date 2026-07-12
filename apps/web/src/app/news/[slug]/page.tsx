import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@repo/database';
import { Calendar, ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { sanitizeHtml } from '@/lib/sanitize';

export const revalidate = 60; // Cache news articles for 60 seconds

interface NewsDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const post = await prisma.contentPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post) {
    return {
      title: 'Post Not Found | AfroNile',
    };
  }

  return {
    title: `${post.title} | AfroNile News`,
    description: post.title,
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const post = await prisma.contentPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      {/* Return to News Catalog */}
      <Link 
        href="/news" 
        className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to News & Devlog</span>
      </Link>

      <article className="p-6 md:p-10 rounded-3xl bg-zinc-900/10 border border-white/5 backdrop-blur-sm shadow-xl space-y-6">
        {/* Header Metadata */}
        <div className="flex items-center justify-between text-xs font-semibold border-b border-white/5 pb-4">
          <span className="flex items-center gap-1.5 text-zinc-500 tabular-nums">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(post.publishedAt)}</span>
          </span>
          
          <span className="capitalize px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{post.type}</span>
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
          {post.title}
        </h1>

        {/* Body content */}
        <div 
          className="text-zinc-300 leading-relaxed text-sm md:text-base space-y-4 pt-4 border-t border-white/5 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.bodyHtml) }}
        />
      </article>
    </div>
  );
}
