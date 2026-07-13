import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@repo/auth';
import { getJwtSecret } from './lib/env';
import { rateLimiter } from './lib/rate-limit';

// Global security headers definition
const SECURITY_HEADERS = {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com; " +
    "connect-src 'self' https://api.stripe.com wss://*.vercel.com; " +
    "frame-src 'self' https://js.stripe.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https://*.stripe.com https://images.unsplash.com; " +
    "media-src 'self'; " +
    "object-src 'none';",
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), geolocation=(), microphone=()',
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '127.0.0.1';

  // 1. IP Rate Limiting for critical API pathways
  if (pathname.startsWith('/api/')) {
    let rateConfig = null;

    if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/register')) {
      rateConfig = { limit: 10, windowMs: 60000 }; // 10 logins/signups per minute
    } else if (pathname.startsWith('/api/tickets/verify')) {
      rateConfig = { limit: 30, windowMs: 60000 }; // 30 ticket validations per minute
    } else if (pathname.startsWith('/api/checkout')) {
      rateConfig = { limit: 5, windowMs: 60000 };  // 5 checkouts per minute
    } else if (pathname.startsWith('/api/live/support')) {
      rateConfig = { limit: 10, windowMs: 60000 }; // 10 support sessions per minute
    }

    if (rateConfig) {
      const check = rateLimiter.limit(ip, pathname, rateConfig);
      if (!check.success) {
        const response = NextResponse.json(
          { 
            error: 'TOO_MANY_REQUESTS', 
            message: 'Too many requests. Please slow down and try again later.' 
          },
          { status: 429 }
        );
        response.headers.set('Retry-After', String(Math.ceil((check.reset - Date.now()) / 1000)));
        return response;
      }
    }
  }

  // 2. Block direct access to audio assets — streaming requires signed proxy URL
  if (pathname.startsWith('/audio/')) {
    return new NextResponse('Direct audio access is not permitted.', { status: 403 });
  }

  let response = NextResponse.next();

  // 3. Protect route access (Admin and staff portals)
  if (pathname.startsWith('/verify') || pathname.startsWith('/admin')) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      response = NextResponse.redirect(url);
    } else {
      try {
        const claims = await verifyTokenEdge(token, getJwtSecret());
        if (!claims) {
          throw new Error('Invalid token claim signature.');
        }

        if (pathname.startsWith('/admin') && claims.role !== 'ADMIN') {
          const url = new URL('/', req.url);
          url.searchParams.set('error', 'UNAUTHORIZED_ACCESS');
          response = NextResponse.redirect(url);
        } else if (pathname.startsWith('/verify') && claims.role !== 'ADMIN' && claims.role !== 'STAFF') {
          const url = new URL('/', req.url);
          url.searchParams.set('error', 'UNAUTHORIZED_ACCESS');
          response = NextResponse.redirect(url);
        }
      } catch (e) {
        const url = new URL('/login', req.url);
        url.searchParams.set('redirect', pathname);
        response = NextResponse.redirect(url);
        response.cookies.delete('token');
      }
    }
  }

  // 4. Inject Security Headers on all requests
  Object.entries(SECURITY_HEADERS).forEach(([key, val]) => {
    response.headers.set(key, val);
  });

  return response;
}

export const config = {
  matcher: [
    '/audio/:path*',
    '/verify/:path*',
    '/admin/:path*',
    '/api/auth/login',
    '/api/auth/register',
    '/api/tickets/verify',
    '/api/checkout',
    '/api/live/support',
  ],
};
