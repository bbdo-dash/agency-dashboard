import { XMLParser } from 'fast-xml-parser';
import { InstagramPost } from '@/types/dashboard';
import { promises as fs } from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

interface SocialRSSFeedConfig {
  id: string;
  url: string;
  title: string;
  description?: string;
  isActive: boolean;
}

const SOCIAL_FEEDS_FILE = path.join(process.cwd(), 'data', 'social-rss-feeds.json');

async function loadSocialFeeds(): Promise<SocialRSSFeedConfig[]> {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    try {
      const data = await fs.readFile(SOCIAL_FEEDS_FILE, 'utf-8');
      return (JSON.parse(data) as SocialRSSFeedConfig[]).filter(f => f.isActive);
    } catch (_error) {
      return [
        { id: 'porsche-instagram', url: 'https://rss.app/feeds/izVEz8ICc3RriXvF.xml', title: 'Porsche Motorsport', isActive: true },
        { id: 'bbdo-instagram', url: 'https://rss.app/feeds/zwbRbUNOsbxIJHGj.xml', title: 'BBDO Instagram', isActive: true }
      ];
    }
  }
  try {
    const feeds = (await kv.get<SocialRSSFeedConfig[]>('social_rss_feeds')) || [];
    const active = feeds.filter(f => f.isActive);
    return active.length > 0 ? active : [
      { id: 'porsche-instagram', url: 'https://rss.app/feeds/izVEz8ICc3RriXvF.xml', title: 'Porsche Motorsport', isActive: true },
      { id: 'bbdo-instagram', url: 'https://rss.app/feeds/zwbRbUNOsbxIJHGj.xml', title: 'BBDO Instagram', isActive: true }
    ];
  } catch (_error) {
    return [];
  }
}

// Default image for when we can't extract one from the RSS feed
const DEFAULT_PORSCHE_IMAGE = 'https://scontent.cdninstagram.com/v/t51.2885-19/325385406_1600607227079024_7537725051693415601_n.jpg?stp=dst-jpg_s240x240_tt6&_nc_ht=scontent.cdninstagram.com&_nc_cat=108&_nc_oc=Q6cZ2QHPoUmEtaM0AFozeiTKa4Y_ZzP-KP_6ZjhTVzeniMFrbQKrriHDzItjcYJCtVNiuUs&_nc_ohc=HcaB-npmDZ0Q7kNvgFFTOy8';


interface FeedData {
  title: string;
  posts: InstagramPost[];
}

/**
 * Fetches Instagram posts from the RSS feed
 */
export async function fetchInstagramPostsFromRSS(forceRefresh: boolean = false): Promise<FeedData[]> {
  try {
    const configuredFeeds = await loadSocialFeeds();
    const feedsPromises = configuredFeeds.map(async (feed) => {
      try {
        const response = await fetch(forceRefresh ? `${feed.url}${feed.url.includes('?') ? '&' : '?'}t=${Date.now()}` : feed.url, {
          ...(forceRefresh ? { cache: 'no-store' } : { next: { revalidate: 3600 } })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch RSS feed: ${response.status}`);
        }
        
        const xmlText = await response.text();
        
        // Parse the XML
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: "@_",
          isArray: (name) => name === 'item'
        });
        
        const result = parser.parse(xmlText);
        
        // Extract the items from the parsed result
        const channelData = result.rss?.channel;
        const items = channelData?.item || [];
        
        console.log(`Found ${items.length} items in the RSS feed: ${feed.title}`);
        
        // Map the items to our InstagramPost format
        const posts = items.map((item: any, index: number) => {
          let imageUrl = '';
          
          // Try to get image from various locations
          if (item['media:content'] && item['media:content']['@_url']) {
            imageUrl = item['media:content']['@_url'];
          } else if (item.enclosure && item.enclosure['@_url']) {
            imageUrl = item.enclosure['@_url'];
          } else if (item['content:encoded']) {
            // Try to extract image from content:encoded
            const contentEncoded = item['content:encoded'];
            
            // Try different regex patterns to match image URLs
            const imgMatches = [
              // Standard img tag
              contentEncoded.match(/<img[^>]+src="([^">]+)"/),
              // Image in background style
              contentEncoded.match(/background-image:url\(['"]?([^'"]+)['"]?\)/),
              // Image in data-src attribute
              contentEncoded.match(/data-src="([^"]+)"/),
              // Instagram specific URL patterns
              contentEncoded.match(/https:\/\/scontent[\w.-]+\.cdninstagram\.com\/[^"'\s]+/),
              // Raw image URL
              contentEncoded.match(/(https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp))/i)
            ];
            
            // Use the first successful match
            for (const match of imgMatches) {
              if (match && match[1]) {
                imageUrl = match[1];
                break;
              }
            }
          }
          
          // Try to look for media:thumbnail as a fallback
          if (!imageUrl && item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
            imageUrl = item['media:thumbnail']['@_url'];
          }
          
          // Extract the description, which may contain the image
          let description = item.description || '';
          
          // Clean up the description from any HTML tags or CDATA sections
          description = description.replace(/<!\[CDATA\[|\]\]>/g, '');
          
          // Last resort - check if there's an image URL in the raw description before removing HTML
          if (!imageUrl && item.description) {
            const rawDescription = item.description;
            
            // Try multiple patterns for images in the description
            const descImgMatches = [
              // Standard img tag
              rawDescription.match(/<img[^>]+src="([^">]+)"/),
              // Image URL ending with image extension
              rawDescription.match(/(https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp))/i),
              // Instagram specific URL patterns
              rawDescription.match(/https:\/\/scontent[\w.-]+\.cdninstagram\.com\/[^"'\s]+/)
            ];
            
            // Use the first successful match
            for (const match of descImgMatches) {
              if (match && match[1]) {
                imageUrl = match[1];
                break;
              }
            }
          }
          
          // Now remove HTML tags from description
          description = description.replace(/<[^>]*>/g, '');
          
          // If no image was found, use the default
          if (!imageUrl) {
            imageUrl = DEFAULT_PORSCHE_IMAGE;
          }
          
          // Try to extract likes count from the title or description
          let likes = 0;
          // Many RSS feeds include like counts in titles with formats like "Post caption... (123 likes)"
          const likesMatch = item.title ? item.title.match(/\((\d+)\s+likes?\)/) : null;
          if (likesMatch && likesMatch[1]) {
            likes = parseInt(likesMatch[1], 10);
          } else if (item.description) {
            // Try to find likes in the description
            const descLikesMatch = item.description.match(/(\d+)\s+likes?/);
            if (descLikesMatch && descLikesMatch[1]) {
              likes = parseInt(descLikesMatch[1], 10);
            }
          }
          
          // Parse item content for engagement stats
          if (item['content:encoded']) {
            const contentEncoded = item['content:encoded'];
            // Look for patterns like "123 likes" or "123 Likes"
            const contentLikesMatch = contentEncoded.match(/(\d+(?:,\d+)?)\s+[Ll]ikes?/);
            if (contentLikesMatch && contentLikesMatch[1]) {
              // Remove commas before parsing
              likes = parseInt(contentLikesMatch[1].replace(/,/g, ''), 10);
            }
          }
          
          // Ensure the guid is a string to avoid React key issues
          let postId = `${feed.title.toLowerCase().replace(/\s/g, '-')}-${index}`;
          if (item.guid) {
            // Convert guid to string if it's an object
            postId = typeof item.guid === 'object' ? 
              `${feed.title.toLowerCase().replace(/\s/g, '-')}-guid-${index}-${Date.now()}` : 
              String(item.guid);
          }
          
          return {
            id: postId,
            imageUrl: imageUrl,
            caption: description,
            likes: likes, // Use extracted likes, or 0 if none found
            comments: 0, // Not available in RSS
            timestamp: item.pubDate || new Date().toISOString()
          };
        });
        
        // Filter out posts without valid images (only keep posts with real images, not defaults)
        const postsWithImages = posts.filter((post: InstagramPost) => 
          post.imageUrl && post.imageUrl !== DEFAULT_PORSCHE_IMAGE
        );
        
        return {
          title: feed.title,
          posts: postsWithImages.slice(0, 10) // Limit to 10 posts per feed for better performance
        };
      } catch (error) {
        console.error(`Error fetching posts from ${feed.url}:`, error);
        return {
          title: feed.title,
          posts: [{
            id: `fallback-${feed.title.toLowerCase().replace(/\s/g, '-')}`,
            imageUrl: DEFAULT_PORSCHE_IMAGE,
            caption: `${feed.title} - Visit our page for the latest updates`,
            likes: 0,
            comments: 0,
            timestamp: new Date().toISOString()
          }]
        };
      }
    });
    
    const allFeeds = await Promise.all(feedsPromises);
    return allFeeds;
    
  } catch (error) {
    console.error('Error fetching posts from RSS feeds:', error);
    
    // Return fallback data for all feeds
    return RSS_FEEDS.map(feed => ({
      title: feed.title,
      posts: [{
        id: `fallback-${feed.title.toLowerCase().replace(/\s/g, '-')}`,
        imageUrl: DEFAULT_PORSCHE_IMAGE,
        caption: `${feed.title} - Visit our page for the latest updates`,
        likes: 0,
        comments: 0,
        timestamp: new Date().toISOString()
      }]
    }));
  }
} 