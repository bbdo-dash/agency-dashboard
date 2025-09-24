import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie name used for simple password-gate
const AUTH_COOKIE = 'site_auth';
const AUTH_COOKIE_VALUE = 'verified';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow these paths without auth
  const isPublicPath =
    pathname.startsWith('/pass') ||
    pathname.startsWith('/api/auth/password') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/fonts') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/vercel.svg');

  if (isPublicPath) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookie === AUTH_COOKIE_VALUE) {
    return NextResponse.next();
  }

  // Redirect to password page
  const url = request.nextUrl.clone();
  url.pathname = '/pass';
  url.searchParams.set('from', pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


