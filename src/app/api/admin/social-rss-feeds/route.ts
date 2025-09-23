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
      return [
        { id: 'porsche-instagram', url: 'https://rss.app/feeds/izVEz8ICc3RriXvF.xml', title: 'Porsche Motorsport', description: '', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'bbdo-instagram', url: 'https://rss.app/feeds/zwbRbUNOsbxIJHGj.xml', title: 'BBDO Instagram', description: '', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      ];
    }
  }

  try {
    const feeds = await kv.get<SocialRSSFeed[]>('social_rss_feeds');
    return feeds && feeds.length > 0 ? feeds : [
      { id: 'porsche-instagram', url: 'https://rss.app/feeds/izVEz8ICc3RriXvF.xml', title: 'Porsche Motorsport', description: '', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: 'bbdo-instagram', url: 'https://rss.app/feeds/zwbRbUNOsbxIJHGj.xml', title: 'BBDO Instagram', description: '', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
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

function generateId(): string {
  return `social-rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function GET() {
  try {
    const feeds = await loadFeeds();
    return NextResponse.json({ feeds });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to load social RSS feeds' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, title, description } = await request.json();

    if (!url || !title) {
      return NextResponse.json({ error: 'URL and title are required' }, { status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const feeds = await loadFeeds();
    const existingFeed = feeds.find(feed => feed.url === url);
    if (existingFeed) {
      return NextResponse.json({ error: 'RSS feed with this URL already exists' }, { status: 400 });
    }

    const newFeed: SocialRSSFeed = {
      id: generateId(),
      url,
      title,
      description: description || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    feeds.push(newFeed);
    await saveFeeds(feeds);

    return NextResponse.json({ feed: newFeed }, { status: 201 });
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to create social RSS feed' }, { status: 500 });
  }
}


