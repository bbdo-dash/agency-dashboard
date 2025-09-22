import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { ensureRSSFeedsInKV } from '@/lib/migration';

// Helper function to check if we're in development mode
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

interface RSSFeed {
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

const FEEDS_FILE = path.join(process.cwd(), 'data', 'rss-feeds.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(FEEDS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load feeds from file or KV storage
async function loadFeeds(): Promise<RSSFeed[]> {
  if (isDevelopment()) {
    // Fallback to JSON file in development
    try {
      await ensureDataDirectory();
      const data = await fs.readFile(FEEDS_FILE, 'utf-8');
      return JSON.parse(data);
      } catch (_error) {
      return [];
    }
  } else {
    // Use Vercel KV Storage in production
    // Ensure RSS feeds are migrated if needed
    await ensureRSSFeedsInKV();
    
    try {
      const feeds = await kv.get<RSSFeed[]>('rss_feeds');
      return feeds || [];
      } catch (_error) {
      console.error('Error loading feeds from KV storage:', _error);
      return [];
    }
  }
}

// Save feeds to file or KV storage
async function saveFeeds(feeds: RSSFeed[]): Promise<void> {
  if (isDevelopment()) {
    // Fallback to JSON file in development
    await ensureDataDirectory();
    await fs.writeFile(FEEDS_FILE, JSON.stringify(feeds, null, 2));
  } else {
    // Use Vercel KV Storage in production
    await kv.set('rss_feeds', feeds);
  }
}

// GET /api/admin/rss-feeds/[id] - Get specific RSS feed
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feeds = await loadFeeds();
    const feed = feeds.find(f => f.id === id);

    if (!feed) {
      return NextResponse.json(
        { error: 'RSS feed not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ feed });
      } catch (_error) {
    console.error('Error loading RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to load RSS feed' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/rss-feeds/[id] - Update RSS feed
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { url, title, description } = await request.json();

    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const feeds = await loadFeeds();
    const feedIndex = feeds.findIndex(f => f.id === id);

    if (feedIndex === -1) {
      return NextResponse.json(
        { error: 'RSS feed not found' },
        { status: 404 }
      );
    }

    // Check if URL already exists (excluding current feed)
    const existingFeed = feeds.find(feed => feed.url === url && feed.id !== id);
    if (existingFeed) {
      return NextResponse.json(
        { error: 'RSS feed with this URL already exists' },
        { status: 400 }
      );
    }

    const updatedFeed: RSSFeed = {
      ...feeds[feedIndex],
      url,
      title,
      description: description || '',
      updatedAt: new Date().toISOString()
    };

    feeds[feedIndex] = updatedFeed;
    await saveFeeds(feeds);

    return NextResponse.json({ feed: updatedFeed });
      } catch (_error) {
    console.error('Error updating RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to update RSS feed' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/rss-feeds/[id] - Partially update RSS feed (e.g., toggle active status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    const feeds = await loadFeeds();
    const feedIndex = feeds.findIndex(f => f.id === id);

    if (feedIndex === -1) {
      return NextResponse.json(
        { error: 'RSS feed not found' },
        { status: 404 }
      );
    }

    const updatedFeed: RSSFeed = {
      ...feeds[feedIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    feeds[feedIndex] = updatedFeed;
    await saveFeeds(feeds);

    return NextResponse.json({ feed: updatedFeed });
      } catch (_error) {
    console.error('Error updating RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to update RSS feed' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rss-feeds/[id] - Delete RSS feed
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const feeds = await loadFeeds();
    const feedIndex = feeds.findIndex(f => f.id === id);

    if (feedIndex === -1) {
      return NextResponse.json(
        { error: 'RSS feed not found' },
        { status: 404 }
      );
    }

    feeds.splice(feedIndex, 1);
    await saveFeeds(feeds);

    return NextResponse.json({ message: 'RSS feed deleted successfully' });
      } catch (_error) {
    console.error('Error deleting RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to delete RSS feed' },
      { status: 500 }
    );
  }
}
