import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect the admin and staff routes
  if (pathname.startsWith('/verify') || pathname.startsWith('/admin')) {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      const url = new URL('/login', req.url);
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Decode JWT payload in an Edge-safe manner using native atob
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Malformed token claims.');
      }
      
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const claims = JSON.parse(atob(payloadBase64));

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
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/verify/:path*',
    '/admin/:path*'
  ],
};
