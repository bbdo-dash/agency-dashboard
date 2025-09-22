import { kv } from '@vercel/kv';
import { loadEventsFromCSV, getEventsCSVPath } from './csvParser';
import { CalendarEvent } from '@/types/dashboard';
import { promises as fs } from 'fs';
import path from 'path';

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

/**
 * Migrate events from CSV to KV Storage
 * This function should be called once when deploying to production
 */
export async function migrateEventsToKV(): Promise<void> {
  try {
    console.log('Starting migration of events from CSV to KV Storage...');
    
    // Load events from CSV
    const csvPath = getEventsCSVPath();
    const events = loadEventsFromCSV(csvPath);
    
    if (events.length === 0) {
      console.log('No events found in CSV file');
      return;
    }
    
    // Save to KV Storage
    await kv.set('calendar_events', events);
    
    console.log(`Successfully migrated ${events.length} events to KV Storage`);
  } catch (error) {
    console.error('Error migrating events to KV Storage:', error);
    throw error;
  }
}

/**
 * Migrate RSS feeds from JSON to KV Storage
 */
export async function migrateRSSFeedsToKV(): Promise<void> {
  try {
    console.log('Starting migration of RSS feeds from JSON to KV Storage...');
    
    const feedsFilePath = path.join(process.cwd(), 'data', 'rss-feeds.json');
    
    try {
      const feedsData = await fs.readFile(feedsFilePath, 'utf-8');
      const feeds: RSSFeed[] = JSON.parse(feedsData);
      
      if (feeds.length === 0) {
        console.log('No RSS feeds found in JSON file');
        return;
      }
      
      // Save to KV Storage
      await kv.set('rss_feeds', feeds);
      
      console.log(`Successfully migrated ${feeds.length} RSS feeds to KV Storage`);
    } catch (error) {
      console.log('No RSS feeds JSON file found, using default feeds');
      // Use default feeds if no file exists
      const defaultFeeds: RSSFeed[] = [
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
      
      await kv.set('rss_feeds', defaultFeeds);
      console.log('Set default RSS feeds in KV Storage');
    }
  } catch (error) {
    console.error('Error migrating RSS feeds to KV Storage:', error);
    throw error;
  }
}

/**
 * Check if KV Storage has events, if not migrate from CSV
 */
export async function ensureEventsInKV(): Promise<void> {
  try {
    const existingEvents = await kv.get<CalendarEvent[]>('calendar_events');
    
    if (!existingEvents || existingEvents.length === 0) {
      console.log('No events found in KV Storage, migrating from CSV...');
      await migrateEventsToKV();
    } else {
      console.log(`Found ${existingEvents.length} events in KV Storage`);
    }
  } catch (error) {
    console.error('Error ensuring events in KV Storage:', error);
    throw error;
  }
}

/**
 * Check if KV Storage has RSS feeds, if not migrate from JSON
 */
export async function ensureRSSFeedsInKV(): Promise<void> {
  try {
    const existingFeeds = await kv.get<RSSFeed[]>('rss_feeds');
    
    if (!existingFeeds || existingFeeds.length === 0) {
      console.log('No RSS feeds found in KV Storage, migrating from JSON...');
      await migrateRSSFeedsToKV();
    } else {
      console.log(`Found ${existingFeeds.length} RSS feeds in KV Storage`);
    }
  } catch (error) {
    console.error('Error ensuring RSS feeds in KV Storage:', error);
    throw error;
  }
}

/**
 * Migrate all data to KV Storage
 */
export async function migrateAllDataToKV(): Promise<void> {
  try {
    console.log('Starting migration of all data to KV Storage...');
    
    await Promise.all([
      ensureEventsInKV(),
      ensureRSSFeedsInKV()
    ]);
    
    console.log('All data migration completed successfully');
  } catch (error) {
    console.error('Error migrating all data to KV Storage:', error);
    throw error;
  }
}
