import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PASSWORD = 'Dumf7r-xok3yn';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow these paths without auth
  const isPublicPath =
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

  // Check for Basic Auth
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const base64 = authHeader.slice(6).trim();
      const decoded = atob(base64);
      const [username, providedPassword] = decoded.split(':');

      // Accept any username, only validate password
      if (providedPassword === PASSWORD) {
        return NextResponse.next();
      }
    } catch (e) {
      // Invalid base64, fall through to challenge
    }
  }

  // Issue Basic Auth challenge
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Agency Dashboard"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};


