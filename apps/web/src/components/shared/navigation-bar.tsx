'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  User, 
  ShoppingBag, 
  Ticket as TicketIcon, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  ShoppingCart
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useCartStore } from '../../modules/commerce/hooks/useCartStore';

export interface NavigationUser {
  name: string;
  email: string;
  avatarUrl?: string;
  isAdmin: boolean;
}

export interface NavigationBarProps {
  user?: NavigationUser | null;
}

export function NavigationBar({ user }: NavigationBarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setIsOpen, getItemCount } = useCartStore();
  const itemCount = getItemCount();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.reload();
      }
    } catch (e) {
      console.error('Logout request failed:', e);
    }
  };

  const navLinks = [
    { label: 'Music', href: '/music' },
    { label: 'Tour', href: '/tour' },
    { label: 'Shop', href: '/shop' },
    { label: 'Live', href: '/live' },
    { label: 'News', href: '/news' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/75 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-white font-extrabold text-xl tracking-wider select-none hover:opacity-90 transition-opacity"
          >
            <img src="/Logo_transparent.png" alt="AfroNile Logo" className="h-8 w-8 object-contain" />
            <span>AFRONILE</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative py-2 transition-colors hover:text-white',
                  isActive ? 'text-white font-semibold' : 'text-zinc-400'
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
          
          {user?.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary transition-all hover:bg-primary/20',
                pathname?.startsWith('/admin') ? 'ring-1 ring-primary' : ''
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}
        </nav>

        {/* Right Section: User Controls */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/live"
            className="h-9 px-3.5 flex items-center justify-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/50 text-xs font-bold text-red-400 hover:text-red-300 transition-all select-none"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>LIVE</span>
          </Link>

          {/* Shopping Cart Trigger */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-zinc-950 font-mono">
                {itemCount}
              </span>
            )}
          </button>

          {user ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button 
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 border border-white/10 hover:border-white/20 transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-black overflow-hidden"
                  aria-label="User menu"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-4 w-4 text-zinc-400" />
                  )}
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[220px] rounded-lg border border-white/5 bg-zinc-900 p-1 shadow-2xl animate-in fade-in-80 slide-in-from-top-1 duration-200 z-50"
                  align="end"
                  sideOffset={6}
                >
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  <DropdownMenu.Item asChild>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none cursor-pointer transition-colors"
                    >
                      <ShoppingBag className="h-4 w-4 text-zinc-400" />
                      <span>My Orders</span>
                    </Link>
                  </DropdownMenu.Item>

                  <DropdownMenu.Item asChild>
                    <Link
                      href="/tickets"
                      className="flex items-center gap-2 px-3 py-2 rounded text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none cursor-pointer transition-colors"
                    >
                      <TicketIcon className="h-4 w-4 text-zinc-400" />
                      <span>My Tickets</span>
                    </Link>
                  </DropdownMenu.Item>

                  {user.isAdmin && (
                    <DropdownMenu.Item asChild>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 rounded text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none cursor-pointer transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4 text-zinc-400" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenu.Item>
                  )}

                  <DropdownMenu.Separator className="h-px bg-white/5 my-1" />

                  <DropdownMenu.Item 
                    onSelect={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:outline-none cursor-pointer transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <Link
              href="/login"
              className="h-9 px-4 flex items-center justify-center rounded-md border border-white/10 hover:bg-white/5 hover:border-white/20 text-sm font-medium text-white transition-all"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile Navigation Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/live"
            className="h-8 px-2.5 flex items-center justify-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/50 text-[10px] font-bold text-red-400 hover:text-red-300 transition-all select-none mr-1"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
            </span>
            <span>LIVE</span>
          </Link>

          {/* Mobile Shopping Cart Trigger */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2 text-zinc-400 hover:text-white focus:outline-none"
            aria-label="Shopping cart"
          >
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white ring-2 ring-zinc-950 font-mono">
                {itemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-zinc-950 px-4 py-3 flex flex-col gap-3 animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const isActive = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive ? 'bg-white/5 text-white' : 'text-zinc-400 hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            );
          })}
          
          {user?.isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-primary bg-primary/10"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          )}

          <hr className="border-white/5 my-1" />

          {user ? (
            <>
              <div className="px-3 py-1.5">
                <p className="text-sm font-semibold text-white">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate mt-0.5">{user.email}</p>
              </div>
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-white/5"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>My Orders</span>
              </Link>
              <Link
                href="/tickets"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 hover:bg-white/5"
              >
                <TicketIcon className="h-4 w-4" />
                <span>My Tickets</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-md text-sm text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="h-10 w-full flex items-center justify-center rounded-md border border-white/10 hover:bg-white/5 text-sm font-medium text-white"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
