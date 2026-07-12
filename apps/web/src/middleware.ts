import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge } from '@repo/auth';
import { getJwtSecret } from './lib/env';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Block direct access to audio files — streaming requires signed proxy URL
  if (pathname.startsWith('/audio/')) {
    return new NextResponse('Direct audio access is not permitted.', { status: 403 });
  }

  // Protect the admin and staff routes
  if (pathname.startsWith('/verify') || pathname.startsWith('/admin')) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Validate cryptographic JWT signature
      const claims = await verifyTokenEdge(token, getJwtSecret());
      if (!claims) {
        throw new Error('Invalid or expired token signature.');
      }

      // Assert role permissions
      if (pathname.startsWith('/admin')) {
        if (claims.role !== 'ADMIN') {
          const url = new URL('/', req.url);
          url.searchParams.set('error', 'UNAUTHORIZED_ACCESS');
          return NextResponse.redirect(url);
        }
      } else if (pathname.startsWith('/verify')) {
        if (claims.role !== 'ADMIN' && claims.role !== 'STAFF') {
          const url = new URL('/', req.url);
          url.searchParams.set('error', 'UNAUTHORIZED_ACCESS');
          return NextResponse.redirect(url);
        }
      }
      
    } catch (e) {
      console.error('Middleware security validation failed:', e);
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      
      const response = NextResponse.redirect(url);
      response.cookies.delete('token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/audio/:path*',
    '/verify/:path*',
    '/admin/:path*',
  ],
};

