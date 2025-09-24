import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Cookie name used for simple password-gate
const AUTH_COOKIE = 'site_auth';
const AUTH_COOKIE_VALUE = 'verified';
const PASSWORD = 'Dumf7r-xok3yn';

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

  // Support Basic Auth via WWW-Authenticate for robust protection on Vercel
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const base64 = authHeader.slice(6).trim();
      const decoded = atob(base64);
      const [username, providedPassword] = decoded.split(':');

      // Accept any username, only validate password
      if (providedPassword === PASSWORD) {
        const res = NextResponse.next();
        // Set session cookie (expires when browser closes)
        res.cookies.set(AUTH_COOKIE, AUTH_COOKIE_VALUE, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        });
        return res;
      }
    } catch (e) {
      // fall through to challenge
    }
  }

  // Issue Basic Auth challenge
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Agency Dashboard", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


