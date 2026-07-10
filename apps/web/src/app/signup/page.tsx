'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      // Successful registration -> Redirect. Refresh layout router to reload session cookie
      router.push(redirect);
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'An error occurred during account creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12">
      <div className="w-full max-w-md bg-zinc-900/30 border border-white/5 p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-6">
        
        {/* Logo and Intro */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-xs text-zinc-500">Sign up to access tickets, downloads, and the music store.</p>
        </div>

        {/* Errors Block */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-zinc-950 border border-white/5 hover:border-white/10 focus:border-primary/50 text-sm text-white focus:outline-none transition"
              placeholder="Your Name (Optional)"
              disabled={loading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-zinc-950 border border-white/5 hover:border-white/10 focus:border-primary/50 text-sm text-white focus:outline-none transition"
              placeholder="name@example.com"
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-lg bg-zinc-950 border border-white/5 hover:border-white/10 focus:border-primary/50 text-sm text-white focus:outline-none transition"
              placeholder="Create a strong password"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary/95 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/35 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Register</span>
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="border-t border-white/5 pt-4 text-center">
          <p className="text-xs text-zinc-500">
            Already have an account?{' '}
            <Link 
              href={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="text-white hover:text-primary font-semibold inline-flex items-center gap-0.5 group transition"
            >
              <span>Sign In</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
