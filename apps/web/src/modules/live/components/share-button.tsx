'use client';

import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleShare}
      className="flex-1 h-11 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-400" />
          <span>Keepsake Link Copied</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span>Share Keepsake</span>
        </>
      )}
    </button>
  );
}
