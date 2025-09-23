import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import { invalidateAdminCaches } from '@/lib/cache-invalidation';
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
      // Return default feeds if file doesn't exist
      return [
        {
          id: 'horizont-news',
          url: 'https://www.horizont.net/news/feed/',
          title: 'HORIZONT News',
          description: 'Aktuelle Nachrichten aus der Werbebranche',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
  } else {
    // Use Vercel KV Storage in production
    // Ensure RSS feeds are migrated if needed
    await ensureRSSFeedsInKV();
    
    try {
      const feeds = await kv.get<RSSFeed[]>('rss_feeds');
      if (!feeds || feeds.length === 0) {
        // Return default feeds if no feeds in KV storage
        return [
          {
            id: 'horizont-news',
            url: 'https://www.horizont.net/news/feed/',
            title: 'HORIZONT News',
            description: 'Aktuelle Nachrichten aus der Werbebranche',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
      return feeds;
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

// Generate unique ID
function generateId(): string {
  return `rss-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/admin/rss-feeds - Get all RSS feeds
export async function GET() {
  try {
    const feeds = await loadFeeds();
    return NextResponse.json({ feeds });
      } catch (_error) {
    console.error('Error loading RSS feeds:', _error);
    return NextResponse.json(
      { error: 'Failed to load RSS feeds' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rss-feeds - Create new RSS feed
export async function POST(request: NextRequest) {
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

    const feeds = await loadFeeds();
    
    // Check if URL already exists
    const existingFeed = feeds.find(feed => feed.url === url);
    if (existingFeed) {
      return NextResponse.json(
        { error: 'RSS feed with this URL already exists' },
        { status: 400 }
      );
    }

    const newFeed: RSSFeed = {
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

    // Invalidate caches to ensure immediate updates
    await invalidateAdminCaches();

    return NextResponse.json({ feed: newFeed }, { status: 201 });
      } catch (_error) {
    console.error('Error creating RSS feed:', _error);
    return NextResponse.json(
      { error: 'Failed to create RSS feed' },
      { status: 500 }
    );
  }
}
