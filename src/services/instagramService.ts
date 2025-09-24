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

// Default fallback image for when we can't extract one from the RSS feed
const DEFAULT_FALLBACK_IMAGE = '/images/breaking-news-fallback.svg';

interface FeedData {
  title: string;
  posts: InstagramPost[];
}

/**
 * Fetches Instagram posts from the RSS feed
 */
export async function fetchInstagramPostsFromRSS(forceRefresh: boolean = false): Promise<FeedData[]> {
  try {
    // Read settings for how many posts to return per feed (default 6)
    // Load global default and per-feed overrides
    let globalPostsPerFeed = 6;
    try {
      const stored = await kv.get<number>('social_rss_posts_count');
      if (stored && [3,6,9].includes(stored)) globalPostsPerFeed = stored;
    } catch (_e) {}

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
          
          // Debug: Log the item structure to understand the data
          console.log(`Processing item ${index} from ${feed.title}:`, {
            hasMediaContent: !!item['media:content'],
            hasEnclosure: !!item.enclosure,
            hasContentEncoded: !!item['content:encoded'],
            hasDescription: !!item.description
          });
          
          // Try to get image from various locations
          // First check media:content (most common for Instagram)
          if (item['media:content'] && item['media:content']['@_url']) {
            imageUrl = item['media:content']['@_url'];
            console.log(`Found media:content image: ${imageUrl}`);
          } else if (item.enclosure && item.enclosure['@_url']) {
            imageUrl = item.enclosure['@_url'];
            console.log(`Found enclosure image: ${imageUrl}`);
          } else if (item.image && (item.image.url || (Array.isArray(item.image) && item.image[0]?.url))) {
            // Some feeds provide <image><url>…</url></image> either on item or channel level
            // Prefer item-level if present
            const candidateUrl = item.image.url || (Array.isArray(item.image) ? item.image[0]?.url : '');
            if (typeof candidateUrl === 'string' && candidateUrl.startsWith('http')) {
              imageUrl = candidateUrl;
              console.log(`Found image.url: ${imageUrl}`);
            }
          } else if (item.enclosure) {
            // Enclosure can also be a string URL or an object with "url"
            const encUrl = typeof item.enclosure === 'string' ? item.enclosure : (item.enclosure['@_url'] || item.enclosure.url);
            if (encUrl) {
              imageUrl = encUrl;
              console.log(`Found enclosure image (generic): ${imageUrl}`);
            }
          } else if (item['media:group']) {
            const mg = item['media:group'];
            const mgContentUrl = mg?.['media:content']?.['@_url'] || mg?.['media:content']?.url;
            const mgThumbUrl = mg?.['media:thumbnail']?.['@_url'] || mg?.['media:thumbnail']?.url;
            if (mgContentUrl) {
              imageUrl = mgContentUrl;
              console.log(`Found media:group content image: ${imageUrl}`);
            } else if (mgThumbUrl) {
              imageUrl = mgThumbUrl;
              console.log(`Found media:group thumbnail image: ${imageUrl}`);
            }
          } else if (item['content:encoded']) {
            // Try to extract image from content:encoded
            const contentEncoded = item['content:encoded'];
            
            // Try different regex patterns to match image URLs
            const imgMatches = [
              // Instagram specific URL patterns (prioritize these)
              contentEncoded.match(/https:\/\/scontent[\w.-]+\.cdninstagram\.com\/[^"'\s<>]+/g),
              // Standard img tag with src
              contentEncoded.match(/<img[^>]+src="([^">]+)"/),
              // Standard img tag with data-src
              contentEncoded.match(/<img[^>]+data-src="([^"]+)"/),
              // Image in background style
              contentEncoded.match(/background-image:url\(['"]?([^'\"]+)['"]?\)/),
              // Image in style attribute
              contentEncoded.match(/background[^:]*:\s*url\(['"]?([^'\"]+)['"]?\)/),
              // Other CDN patterns
              contentEncoded.match(/https:\/\/[^"'\s<>]+\.(?:s3|amazonaws|cloudfront)[^"'\s<>]+/),
              // Generic image URLs
              contentEncoded.match(/(https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|gif|webp|svg))/i),
              // Base64 images
              contentEncoded.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
            ];
            
            // Use the first successful match
            for (const match of imgMatches) {
              if (match) {
                // Handle Instagram URL arrays (global match returns array)
                if (Array.isArray(match) && match.length > 0) {
                  imageUrl = match[0]; // Take the first Instagram URL found
                  console.log(`Found Instagram URL from content: ${imageUrl}`);
                  break;
                } else if (match[1]) {
                  imageUrl = match[1];
                  console.log(`Found image URL from content: ${imageUrl}`);
                  break;
                }
              }
            }
          }
          
          // Try to look for media:thumbnail as a fallback
          if (!imageUrl && item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
            imageUrl = item['media:thumbnail']['@_url'];
          }

          // As a last structured fallback, some feeds place channel-level image at result.rss.channel.image.url
          if (!imageUrl && channelData?.image?.url && typeof channelData.image.url === 'string') {
            imageUrl = channelData.image.url;
            console.log(`Using channel image as fallback: ${imageUrl}`);
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
              // Instagram specific URL patterns (prioritize these)
              rawDescription.match(/https:\/\/scontent[\w.-]+\.cdninstagram\.com\/[^"'\s<>]+/g),
              // Standard img tag with src
              rawDescription.match(/<img[^>]+src="([^">]+)"/),
              // Standard img tag with data-src
              rawDescription.match(/<img[^>]+data-src="([^"]+)"/),
              // Image in background style
              rawDescription.match(/background-image:url\(['"]?([^'"]+)['"]?\)/),
              // Image in style attribute
              rawDescription.match(/background[^:]*:\s*url\(['"]?([^'"]+)['"]?\)/),
              // Other CDN patterns
              rawDescription.match(/https:\/\/[^"'\s<>]+\.(?:s3|amazonaws|cloudfront)[^"'\s<>]+/),
              // Image URL ending with image extension
              rawDescription.match(/(https?:\/\/[^"'\s<>]+\.(?:jpg|jpeg|png|gif|webp|svg))/i),
              // Base64 images
              rawDescription.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/)
            ];
            
            // Use the first successful match
            for (const match of descImgMatches) {
              if (match) {
                // Handle Instagram URL arrays (global match returns array)
                if (Array.isArray(match) && match.length > 0) {
                  imageUrl = match[0]; // Take the first Instagram URL found
                  console.log(`Found Instagram URL from description: ${imageUrl}`);
                  break;
                } else if (match[1]) {
                  imageUrl = match[1];
                  console.log(`Found image URL from description: ${imageUrl}`);
                  break;
                }
              }
            }
          }
          
          // Now remove HTML tags from description
          description = description.replace(/<[^>]*>/g, '');
          
          // Last resort: search for any Instagram URL in the entire item
          if (!imageUrl) {
            const itemString = JSON.stringify(item);
            const instagramUrlMatch = itemString.match(/https:\/\/scontent[\w.-]+\.cdninstagram\.com\/[^"'\s<>]+/);
            if (instagramUrlMatch) {
              imageUrl = instagramUrlMatch[0];
              console.log(`Found Instagram URL from item string: ${imageUrl}`);
            }
          }
          
          // If still no image was found, use the default fallback
          if (!imageUrl) {
            imageUrl = DEFAULT_FALLBACK_IMAGE;
            console.log(`Using fallback image for item ${index}`);
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
        
        // Return all posts (including those with fallback images)
        // Per-feed override (by feed.id) if available
        let perFeedCount = globalPostsPerFeed;
        try {
          if ((feed as any).id) {
            const ov = await kv.get<number>(`social_rss_posts_count:${(feed as any).id}`);
            if (ov && [3,6,9].includes(ov)) perFeedCount = ov;
          }
        } catch (_e) {}

        return {
          title: feed.title,
          posts: posts.slice(0, perFeedCount)
        };
      } catch (error) {
        console.error(`Error fetching posts from ${feed.url}:`, error);
        return {
          title: feed.title,
          posts: [{
            id: `fallback-${feed.title.toLowerCase().replace(/\s/g, '-')}`,
            imageUrl: DEFAULT_FALLBACK_IMAGE,
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
    const configuredFeeds = await loadSocialFeeds();
    return configuredFeeds.map((feed: SocialRSSFeedConfig) => ({
      title: feed.title,
      posts: [{
        id: `fallback-${feed.title.toLowerCase().replace(/\s/g, '-')}`,
        imageUrl: DEFAULT_FALLBACK_IMAGE,
        caption: `${feed.title} - Visit our page for the latest updates`,
        likes: 0,
        comments: 0,
        timestamp: new Date().toISOString()
      }]
    }));
  }
}