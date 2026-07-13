'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';

interface CommentEntry {
  id: string;
  comment: string;
  createdAt: string;
  amountCents: number;
}

const DEFAULT_WELCOME_STORIES = [
  "Welcome to the AfroNile Experience. Scan the QR code and share your story.",
  "Deep Nile frequencies active tonight. Share your story, vibe, or concert reflection.",
  "East African rhythms, modern echoes. You are part of the sound tonight.",
  "Keep the soundwaves flowing. Support the performance and elevate the momentum.",
  "Join the Circle of Family. We build this journey together."
];

export default function LiveScreenPage() {
  const [comments, setComments] = useState<CommentEntry[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [flashNewComment, setFlashNewComment] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Transition states for cinematic slide swaps
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fullscreen tracking state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track seen IDs to trigger the live ripple alert on new submissions
  const seenIds = useRef<Set<string>>(new Set());

  // Connect to live SSE event stream
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    const eventSource = new EventSource('/api/live/stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && Array.isArray(data.comments)) {
          const fetched: CommentEntry[] = data.comments;
          
          if (fetched.length > 0) {
            // Check if we have a brand new comment
            const latest = fetched[0];
            const isFirstLoad = seenIds.current.size === 0;

            // If it's a new ID we haven't seen since load, trigger flash alert!
            if (!isFirstLoad && !seenIds.current.has(latest.id)) {
              setNewCommentText(latest.comment);
              setFlashNewComment(true);
              // Auto dismiss flash after 3.2 seconds
              if (timerId) clearTimeout(timerId);
              timerId = setTimeout(() => setFlashNewComment(false), 3200);
            }

            // Update seen list
            fetched.forEach(c => seenIds.current.add(c.id));
            setComments(fetched);
          }
        }
      } catch (err) {
        console.error('Failed to process live screen SSE comment update:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE EventSource connection error on live screen:', err);
    };

    return () => {
      eventSource.close();
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  // Slide carousel every 60 seconds with cinematic dissolve
  useEffect(() => {
    const slideInterval = setInterval(() => {
      // Don't cycle if active flash is occupying the screen
      if (flashNewComment) return;

      // Start fade out transition
      setIsTransitioning(true);

      // Change index after transition-out completes (600ms)
      setTimeout(() => {
        setActiveIdx((prev) => {
          const listLength = getDisplayComments().length;
          if (listLength <= 1) return 0;
          return (prev + 1) % listLength;
        });
        setIsTransitioning(false);
      }, 600);

    }, 60000); // 1 minute (60,000ms)

    return () => clearInterval(slideInterval);
  }, [flashNewComment]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (typeof window === 'undefined') return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error('Failed to enter fullscreen:', err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error('Failed to exit fullscreen:', err));
    }
  };

  // Sync fullscreen change with ESC key exits
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  // Compute comments queue, falling back to default welcome slides if db is empty
  const getDisplayComments = (): CommentEntry[] => {
    if (comments.length > 0) return comments;
    
    return DEFAULT_WELCOME_STORIES.map((text, i) => ({
      id: `welcome-${i}`,
      comment: text,
      email: 'live@afronile.com',
      createdAt: new Date().toISOString(),
      amountCents: 0
    }));
  };

  const currentDisplayList = getDisplayComments();
  const activeComment = currentDisplayList[activeIdx] || null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-8 md:p-16 select-none relative overflow-hidden font-mono">
      
      {/* Cinematic animated ambient gradient spots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-pink-500/5 blur-[140px] animate-pulse duration-[10000ms]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 bg-red-500 rounded-full animate-ping" />
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-400 font-bold">AFRONILE LIVE DISPLAY</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{comments.length} STORIES SHARED</span>
          </div>

          {/* Fullscreen Button Toggle */}
          <button 
            onClick={handleToggleFullscreen}
            className="flex items-center justify-center p-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Screen display (Cinematic Desktop Bleed) */}
      <main className="relative z-10 my-auto max-w-[90vw] mx-auto w-full text-center py-12">
        
        {/* Flash Overlay when a brand new story arrives (Dopamine casino loop) */}
        {flashNewComment ? (
          <div className="space-y-10 animate-in fade-in zoom-in duration-300">
            <div className="inline-flex items-center gap-2.5 bg-primary/10 border border-primary/20 text-primary px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest animate-bounce">
              <Sparkles className="h-4 w-4" />
              <span>New Family Vibe Connected</span>
            </div>
            
            <p className="text-3xl md:text-6xl lg:text-7xl xl:text-[5.5rem] font-mono tracking-tight font-bold text-white leading-tight uppercase max-w-[85vw] mx-auto">
              "{newCommentText}"
            </p>
            
            <div className="flex justify-center gap-1.5 pt-4">
              <div className="h-1.5 w-12 bg-primary rounded-full animate-pulse" />
              <div className="h-1.5 w-3.5 bg-primary/40 rounded-full" />
              <div className="h-1.5 w-3.5 bg-primary/20 rounded-full" />
            </div>
          </div>
        ) : activeComment ? (
          /* Normal carousel comment with cinematic cross-dissolve transformation classes */
          <div 
            className={`space-y-8 transition-all duration-[600ms] transform ease-out ${
              isTransitioning 
                ? 'opacity-0 scale-[0.97] blur-[6px]' 
                : 'opacity-100 scale-100 blur-none'
            }`}
          >
            <p className="text-2xl md:text-5xl lg:text-6xl xl:text-[4.5rem] font-mono font-light tracking-tight text-white/90 leading-tight uppercase max-w-[85vw] mx-auto">
              "{activeComment.comment}"
            </p>
            
            <div className="text-[10px] uppercase text-zinc-500 tracking-widest font-semibold flex items-center justify-center gap-2">
              <span>{activeComment.id.startsWith('welcome-') ? 'AFRONILE REFLECTION' : 'FAMILY MEMBER STORY'}</span>
              <span>•</span>
              <span>{new Date(activeComment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        ) : (
          /* Empty screen status */
          <div className="space-y-6 text-zinc-400 animate-pulse">
            <p className="text-2xl uppercase tracking-[0.2em] font-light">Welcome to the AfroNile Experience</p>
            <p className="text-sm">Scan the QR code and share your story</p>
          </div>
        )}

      </main>

      {/* Immersive centered footer instructions */}
      <footer className="relative z-10 text-center pb-2 text-[10px] tracking-[0.25em] text-zinc-600 uppercase">
        Welcome to the AfroNile Experience • Scan the QR code & share your story
      </footer>



    </div>
  );
}
