import type { Metadata, Viewport } from 'next';
import { Outfit, Cinzel } from 'next/font/google';
import './globals.css';
import { NavigationBar } from '../components/shared/navigation-bar';
import { GlobalAudioPlayer } from '../components/shared/global-audio-player';
import { CartDrawer } from '../modules/commerce/components/cart-drawer';
import { MainContainer } from '../components/shared/main-container';
import { cookies } from 'next/headers';
import { verifyToken } from '@repo/auth';
import { getJwtSecret } from '@/lib/env';

const fontSans = Outfit({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
});

const fontSerif = Cinzel({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700', '800', '900'],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = cookies().get('token')?.value;
  let currentUser = null;
  let currentUserId = '';

  if (token) {
    try {
      const decoded = verifyToken(token, getJwtSecret());
      if (decoded) {
        currentUser = {
          name: decoded.email.split('@')[0],
          email: decoded.email,
          isAdmin: decoded.role === 'ADMIN',
        };
        currentUserId = decoded.userId;
      }
    } catch (e) {
      console.error('Failed to parse layout session token:', e);
    }
  }

  return (
    <html lang="en" className={`${fontSans.variable} ${fontSerif.variable} dark scroll-smooth`}>
      <body className="flex flex-col min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden">
        <NavigationBar user={currentUser} />
        <MainContainer>
          {children}
        </MainContainer>
        <GlobalAudioPlayer />
        <CartDrawer userId={currentUserId} />
      </body>
    </html>
  );
}
