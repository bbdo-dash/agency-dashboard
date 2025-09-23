/**
 * Cache invalidation utilities for immediate updates after admin changes
 */

import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Invalidates all relevant caches after admin changes
 */
export async function invalidateAdminCaches() {
  try {
    // Revalidate the dashboard page
    revalidatePath('/');
    
    // Revalidate API routes
    revalidateTag('dashboard-data');
    revalidateTag('rss-feeds');
    revalidateTag('social-rss-feeds');
    revalidateTag('events-data');
    revalidateTag('news-data');
    
    console.log('✅ Admin caches invalidated successfully');
  } catch (error) {
    console.error('❌ Error invalidating admin caches:', error);
  }
}

/**
 * Invalidates specific cache tags
 */
export async function invalidateCacheTags(tags: string[]) {
  try {
    for (const tag of tags) {
      revalidateTag(tag);
    }
    console.log(`✅ Cache tags invalidated: ${tags.join(', ')}`);
  } catch (error) {
    console.error('❌ Error invalidating cache tags:', error);
  }
}

/**
 * Invalidates specific paths
 */
export async function invalidatePaths(paths: string[]) {
  try {
    for (const path of paths) {
      revalidatePath(path);
    }
    console.log(`✅ Paths invalidated: ${paths.join(', ')}`);
  } catch (error) {
    console.error('❌ Error invalidating paths:', error);
  }
}
