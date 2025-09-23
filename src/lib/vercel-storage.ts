/**
 * Enhanced Vercel Storage integration with automatic cache management
 */

import { kv } from '@vercel/kv';
import { invalidateAdminCaches } from './cache-invalidation';

/**
 * Generic storage operations with automatic cache invalidation
 */
export class VercelStorageManager {
  private static instance: VercelStorageManager;
  
  static getInstance(): VercelStorageManager {
    if (!VercelStorageManager.instance) {
      VercelStorageManager.instance = new VercelStorageManager();
    }
    return VercelStorageManager.instance;
  }

  /**
   * Store data with automatic cache invalidation
   */
  async set<T>(key: string, value: T, invalidateCaches: boolean = true): Promise<void> {
    try {
      await kv.set(key, value);
      
      if (invalidateCaches) {
        await invalidateAdminCaches();
      }
      
      console.log(`✅ Stored data for key: ${key}`);
    } catch (error) {
      console.error(`❌ Error storing data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await kv.get<T>(key);
      return data;
    } catch (error) {
      console.error(`❌ Error retrieving data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete data with automatic cache invalidation
   */
  async delete(key: string, invalidateCaches: boolean = true): Promise<void> {
    try {
      await kv.del(key);
      
      if (invalidateCaches) {
        await invalidateAdminCaches();
      }
      
      console.log(`✅ Deleted data for key: ${key}`);
    } catch (error) {
      console.error(`❌ Error deleting data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Update data in an array with automatic cache invalidation
   */
  async updateInArray<T extends { id: string }>(
    key: string, 
    id: string, 
    updates: Partial<T>,
    invalidateCaches: boolean = true
  ): Promise<T | null> {
    try {
      const items = await this.get<T[]>(key) || [];
      const index = items.findIndex(item => item.id === id);
      
      if (index === -1) {
        return null;
      }

      items[index] = { ...items[index], ...updates };
      await this.set(key, items, invalidateCaches);
      
      return items[index];
    } catch (error) {
      console.error(`❌ Error updating item in array for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Add item to array with automatic cache invalidation
   */
  async addToArray<T>(key: string, item: T, invalidateCaches: boolean = true): Promise<void> {
    try {
      const items = await this.get<T[]>(key) || [];
      items.push(item);
      await this.set(key, items, invalidateCaches);
    } catch (error) {
      console.error(`❌ Error adding item to array for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove item from array with automatic cache invalidation
   */
  async removeFromArray<T extends { id: string }>(
    key: string, 
    id: string, 
    invalidateCaches: boolean = true
  ): Promise<boolean> {
    try {
      const items = await this.get<T[]>(key) || [];
      const filteredItems = items.filter(item => item.id !== id);
      
      if (filteredItems.length === items.length) {
        return false; // Item not found
      }

      await this.set(key, filteredItems, invalidateCaches);
      return true;
    } catch (error) {
      console.error(`❌ Error removing item from array for key ${key}:`, error);
      throw error;
    }
  }
}

/**
 * Convenience functions for common operations
 */
export const storage = VercelStorageManager.getInstance();

/**
 * RSS Feeds storage operations
 */
export const rssFeedsStorage = {
  async getAll() {
    return await storage.get<any[]>('rss_feeds') || [];
  },
  
  async save(feeds: any[]) {
    await storage.set('rss_feeds', feeds);
  },
  
  async add(feed: any) {
    await storage.addToArray('rss_feeds', feed);
  },
  
  async update(id: string, updates: any) {
    return await storage.updateInArray('rss_feeds', id, updates);
  },
  
  async delete(id: string) {
    return await storage.removeFromArray('rss_feeds', id);
  }
};

/**
 * Social RSS Feeds storage operations
 */
export const socialRssFeedsStorage = {
  async getAll() {
    return await storage.get<any[]>('social_rss_feeds') || [];
  },
  
  async save(feeds: any[]) {
    await storage.set('social_rss_feeds', feeds);
  },
  
  async add(feed: any) {
    await storage.addToArray('social_rss_feeds', feed);
  },
  
  async update(id: string, updates: any) {
    return await storage.updateInArray('social_rss_feeds', id, updates);
  },
  
  async delete(id: string) {
    return await storage.removeFromArray('social_rss_feeds', id);
  }
};

/**
 * Events storage operations
 */
export const eventsStorage = {
  async getAll() {
    return await storage.get<any[]>('events') || [];
  },
  
  async save(events: any[]) {
    await storage.set('events', events);
  },
  
  async add(event: any) {
    await storage.addToArray('events', event);
  },
  
  async update(id: string, updates: any) {
    return await storage.updateInArray('events', id, updates);
  },
  
  async delete(id: string) {
    return await storage.removeFromArray('events', id);
  }
};
