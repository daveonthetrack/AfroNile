import React from 'react';
import { Newspaper, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { prisma } from '@repo/database';

export const revalidate = 60; // Cache news pages for 60 seconds

export default async function NewsPage() {
  // Query content posts from the database
  const posts = await prisma.contentPost.findMany({
    orderBy: { publishedAt: 'desc' },
  });

  // Mock fallback posts to display if the database table is empty
  const fallbackPosts = [
    {
      id: 'mock-post-1',
      title: 'AfroNile Announces Nile Waves Album Release Tour',
      type: 'news',
      publishedAt: new Date('2026-06-30T12:00:00Z'),
      bodyHtml: `
        <p class="mb-4 text-zinc-300">We are thrilled to officially announce the release of our debut studio album <strong>Nile Waves</strong>, accompanied by a multi-city live tour starting this fall at the Pyramids Arena.</p>
        <p class="mb-4 text-zinc-300">The Nile Waves tour represents a full-immersion audio-visual experience. By combining ancient Nile instrumentation with modern synthesized Afrobeat structures, the live show will guide listeners through a musical odyssey.</p>
      `,
    },
    {
      id: 'mock-post-2',
      title: 'Designing a Cryptographic gate check ticketing infrastructure',
      type: 'blog',
      publishedAt: new Date('2026-06-25T10:30:00Z'),
      bodyHtml: `
        <p class="mb-4 text-zinc-300">In this engineering devlog, we explore our decision to build a zero-overhead ticketing platform using secure SHA-256 signature hashes and atomic double-scan gates locks instead of renting expensive proprietary ticketing software.</p>
        <p class="mb-4 text-zinc-300">By storing unique qr-code hashes directly inside a secure Postgres ledger and executing check-ins using single-row conditional database updates, we completely eliminate double-entry fraud and ticket scalping while retaining 100% data ownership.</p>
      `,
    },
  ];

  const activePosts = posts.length > 0 ? posts.map(p => ({
    id: p.id,
    title: p.title,
    type: p.type,
    publishedAt: p.publishedAt,
    bodyHtml: p.bodyHtml
  })) : fallbackPosts;

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
                
                <span className="capitalize px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>{post.type}</span>
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white tracking-tight hover:text-primary transition-colors cursor-pointer">
                  {post.title}
                </h2>
                
                {/* Compiled HTML Body Output */}
                <div 
                  className="text-sm text-zinc-400 line-clamp-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center">
              <button className="text-xs font-bold text-white flex items-center gap-1 hover:text-primary transition group">
                <span>Read Full Article</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
