import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// KV key for how many posts per social feed to show (3, 6, or 9)
const SETTINGS_KEY = 'social_rss_posts_count';
const DEFAULT_COUNT = 6;
const ALLOWED = new Set([3, 6, 9]);

export async function GET(request: NextRequest) {
  try {
    const feedId = request.nextUrl.searchParams.get('feedId');
    let count: number | null = null;
    if (feedId) {
      const perFeed = await kv.get<number>(`${SETTINGS_KEY}:${feedId}`);
      if (perFeed && ALLOWED.has(perFeed)) count = perFeed;
    }
    if (count === null) {
      const raw = await kv.get<number>(SETTINGS_KEY);
      if (raw && ALLOWED.has(raw)) count = raw;
    }
    if (count === null) count = DEFAULT_COUNT;
    return NextResponse.json({ count });
  } catch (e) {
    return NextResponse.json({ count: DEFAULT_COUNT });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const desired = Number(body?.count);
    if (!ALLOWED.has(desired)) {
      return NextResponse.json({ error: 'Invalid count. Allowed: 3, 6, 9' }, { status: 400 });
    }
    const feedId = request.nextUrl.searchParams.get('feedId');
    if (feedId) {
      await kv.set(`${SETTINGS_KEY}:${feedId}`, desired);
    } else {
      await kv.set(SETTINGS_KEY, desired);
    }
    return NextResponse.json({ ok: true, count: desired });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}


