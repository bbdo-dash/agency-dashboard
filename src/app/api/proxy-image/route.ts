import { NextRequest, NextResponse } from 'next/server';

// Very small image proxy to work around Instagram/Facebook CDN hotlink restrictions
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('u');
    if (!url) {
      return new NextResponse('Missing url', { status: 400 });
    }

    // Only allow https and known instagram/fbcdn hosts for safety
    let target: URL;
    try {
      target = new URL(url);
    } catch {
      return new NextResponse('Invalid url', { status: 400 });
    }

    if (target.protocol !== 'https:') {
      return new NextResponse('Only https allowed', { status: 400 });
    }

    const allowedHosts = [
      'scontent.cdninstagram.com',
      'instagram.fna.fbcdn.net',
      'instagram.fdoh6-1.fna.fbcdn.net',
      'instagram.fkhi28-1.fna.fbcdn.net',
      'cdninstagram.com',
      'fbcdn.net'
    ];

    const isAllowed = allowedHosts.some(h => target.hostname.endsWith(h) || target.hostname === h);
    if (!isAllowed) {
      return new NextResponse('Host not allowed', { status: 400 });
    }

    // Fetch image with no referrer and a common UA
    const resp = await fetch(target.toString(), {
      // Let caches store the upstream image; we'll also send cache headers below
      cache: 'force-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://www.instagram.com/'
      }
    });

    if (!resp.ok) {
      return new NextResponse('Upstream error', { status: 502 });
    }

    const contentType = resp.headers.get('content-type') || 'image/jpeg';
    const body = await resp.arrayBuffer();

    const res = new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache at browser and CDN to reduce flicker; revalidate hourly
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=3600',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600'
      }
    });
    return res;
  } catch (e) {
    return new NextResponse('Proxy error', { status: 500 });
  }
}


