import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { prisma } from '@repo/database';
import { NavigationBar } from '../components/shared/navigation-bar';
import { GlobalAudioPlayer } from '../components/shared/global-audio-player';
import { CartDrawer } from '../modules/commerce/components/cart-drawer';
import { MainContainer } from '../components/shared/main-container';

const fontSans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'AfroNile | Official Artist Platform',
  description: 'Step into the sound. Access exclusive albums, cryptographic digital tickets, VIP experiences, and artist merchandise with zero middle-men.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { cookies } from 'next/headers';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultUser = await prisma.user.findFirst({
    where: { email: 'user@afronile.com' },
  });

  const token = cookies().get('token')?.value;
  let currentUser = null;

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(payloadBase64));
        
        currentUser = {
          name: decoded.email.split('@')[0],
          email: decoded.email,
          isAdmin: decoded.role === 'ADMIN',
        };
      }
    } catch (e) {
      console.error('Failed to parse layout session token:', e);
    }
  }

  return (
    <html lang="en" className={`${fontSans.variable} dark scroll-smooth`}>
      <body className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
        {/* Navigation Shell */}
        <NavigationBar user={currentUser} />
        
        {/* Main Content Area */}
        <MainContainer>
          {children}
        </MainContainer>
        
        {/* Persistent Floating Bottom Audio Player */}
        <GlobalAudioPlayer />

        {/* Global Slide-out Shopping Cart Sidebar */}
        <CartDrawer userId={defaultUser?.id || ''} />
      </body>
    </html>
  );
}
