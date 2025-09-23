import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

interface SocialRSSFeed {
  id: string;
  url: string;
  title: string;
  description?: string;
  isActive: boolean;
  lastChecked?: string;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

const FEEDS_FILE = path.join(process.cwd(), 'data', 'social-rss-feeds.json');

async function ensureDataDirectory() {
  const dataDir = path.dirname(FEEDS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadFeeds(): Promise<SocialRSSFeed[]> {
  if (isDevelopment()) {
    try {
      await ensureDataDirectory();
      const data = await fs.readFile(FEEDS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (_error) {
      return [];
    }
  }

  try {
    return (await kv.get<SocialRSSFeed[]>('social_rss_feeds')) || [];
  } catch (_error) {
    return [];
  }
}

async function saveFeeds(feeds: SocialRSSFeed[]): Promise<void> {
  if (isDevelopment()) {
    await ensureDataDirectory();
    await fs.writeFile(FEEDS_FILE, JSON.stringify(feeds, null, 2));
  } else {
    await kv.set('social_rss_feeds', feeds);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feeds = await loadFeeds();
    const feed = feeds.find(f => f.id === id);
    if (!feed) return NextResponse.json({ error: 'RSS feed not found' }, { status: 404 });
    return NextResponse.json({ feed });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to load social RSS feed' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { url, title, description } = await request.json();
    if (!url || !title) return NextResponse.json({ error: 'URL and title are required' }, { status: 400 });
    try { new URL(url); } catch { return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 }); }

    const { id } = await params;
    const feeds = await loadFeeds();
    const feedIndex = feeds.findIndex(f => f.id === id);
    if (feedIndex === -1) return NextResponse.json({ error: 'RSS feed not found' }, { status: 404 });

    const duplicate = feeds.find(f => f.url === url && f.id !== id);
    if (duplicate) return NextResponse.json({ error: 'RSS feed with this URL already exists' }, { status: 400 });

    feeds[feedIndex] = { ...feeds[feedIndex], url, title, description: description || '', updatedAt: new Date().toISOString() };
    await saveFeeds(feeds);
    return NextResponse.json({ feed: feeds[feedIndex] });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update social RSS feed' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const feeds = await loadFeeds();
    const feedIndex = feeds.findIndex(f => f.id === id);
    if (feedIndex === -1) return NextResponse.json({ error: 'RSS feed not found' }, { status: 404 });
    feeds[feedIndex] = { ...feeds[feedIndex], ...updates, updatedAt: new Date().toISOString() };
    await saveFeeds(feeds);
    return NextResponse.json({ feed: feeds[feedIndex] });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to update social RSS feed' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feeds = await loadFeeds();
    const feedIndex = feeds.findIndex(f => f.id === id);
    if (feedIndex === -1) return NextResponse.json({ error: 'RSS feed not found' }, { status: 404 });
    feeds.splice(feedIndex, 1);
    await saveFeeds(feeds);
    return NextResponse.json({ message: 'RSS feed deleted successfully' });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to delete social RSS feed' }, { status: 500 });
  }
}


