import React from 'react';
import { Newspaper, Calendar, ArrowRight } from 'lucide-react';
import { prisma } from '@repo/database';
import Link from 'next/link';
import type { Metadata } from 'next';
import { sanitizeHtml } from '@/lib/sanitize';

export const revalidate = 60; // Cache news pages for 60 seconds

export const metadata: Metadata = {
  title: 'News & Devlog | AfroNile',
  description: 'Stay updated with the latest news, THE NEW WAVE tour announcements, and technical engineering logs from AfroNile.',
};

export default async function NewsPage() {
  // Query content posts from the database
  const posts = await prisma.contentPost.findMany({
    orderBy: { publishedAt: 'desc' },
  });

  if (posts.length === 0) {
    return (
      <div className="space-y-8">
        <div className="border-b border-white/5 pb-6">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-primary" />
            <span>News & Devlog</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Official announcements, behind-the-scenes logs, and technical press releases.</p>
        </div>
        <div className="flex h-[40vh] flex-col items-center justify-center text-center space-y-4 rounded-3xl bg-zinc-900/10 border border-white/5 backdrop-blur-sm">
          <Newspaper className="h-10 w-10 text-zinc-600 animate-pulse" />
          <h2 className="text-lg font-bold text-white">No Articles Published</h2>
          <p className="text-sm text-zinc-500 max-w-xs">Keep checking back for THE NEW WAVE tour announcements and technical updates.</p>
        </div>
      </div>
    );
  }

  const activePosts = posts.map(p => ({
    id: p.id,
    title: p.title,
    type: p.type,
    publishedAt: p.publishedAt,
    bodyHtml: p.bodyHtml,
    slug: p.slug,
  }));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Newspaper className="h-8 w-8 text-primary" />
          <span>News & Devlog</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Official announcements, behind-the-scenes logs, and technical press releases.</p>
      </div>

      {/* Editorial Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {activePosts.map((post) => (
          <article
            key={post.id}
            className="flex flex-col justify-between p-6 rounded-2xl bg-zinc-900/10 border border-white/5 backdrop-blur-sm hover:border-white/10 hover:bg-zinc-900/40 transition duration-300 shadow-xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1 text-zinc-500 tabular-nums">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(post.publishedAt)}</span>
                </span>
              </div>

              <div className="space-y-2">
                <Link href={`/news/${post.slug}`}>
                  <h2 className="text-xl font-bold text-white tracking-tight hover:text-primary transition-colors cursor-pointer">
                    {post.title}
                  </h2>
                </Link>
                
                {/* Compiled HTML Body Output */}
                <div 
                  className="text-sm text-zinc-400 line-clamp-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.bodyHtml) }}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center">
              <Link 
                href={`/news/${post.slug}`}
                className="text-xs font-bold text-white flex items-center gap-1 hover:text-primary transition group"
              >
                <span>Read Full Article</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

