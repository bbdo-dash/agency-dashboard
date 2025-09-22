import { NextRequest, NextResponse } from 'next/server';
import type { NewsItem } from '@/types/dashboard';
import { XMLParser } from 'fast-xml-parser';
import { promises as fs } from 'fs';
import path from 'path';

// Default HORIZONT RSS feed URL (Agenturen) - fallback
const HORIZONT_RSS = 'https://www.horizont.net/news/feed/';

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

// Load configured RSS feeds
async function loadConfiguredFeeds(): Promise<RSSFeed[]> {
  try {
    const data = await fs.readFile(FEEDS_FILE, 'utf-8');
    const feeds = JSON.parse(data);
    return feeds.filter((feed: RSSFeed) => feed.isActive);
  } catch (error) {
    // Return default feed if no configuration exists
    return [{
      id: 'horizont-news',
      url: HORIZONT_RSS,
      title: 'HORIZONT News',
      description: 'Aktuelle Nachrichten aus der Werbebranche',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];
  }
}

// Mix articles from different feeds randomly while maintaining some chronological order
function mixArticlesFromFeeds(articles: NewsItem[], pageSize: number): NewsItem[] {
  if (articles.length <= pageSize) {
    return articles;
  }

  // Group articles by source (feed)
  const articlesBySource: { [key: string]: NewsItem[] } = {};
  articles.forEach(article => {
    if (!articlesBySource[article.source]) {
      articlesBySource[article.source] = [];
    }
    articlesBySource[article.source].push(article);
  });

  const sources = Object.keys(articlesBySource);
  
  // If only one source, return the first pageSize articles
  if (sources.length === 1) {
    return articles.slice(0, pageSize);
  }

  // Round-robin distribution: alternate between sources
  const mixedArticles: NewsItem[] = [];
  
  // Create arrays for each source (already sorted by date)
  const sourceArrays: NewsItem[][] = sources.map(source => articlesBySource[source]);
  
  // Find the maximum number of articles we can take from any source
  const maxArticlesPerSource = Math.max(...sourceArrays.map(arr => arr.length));
  
  // Round-robin through all sources
  for (let articleIndex = 0; articleIndex < maxArticlesPerSource; articleIndex++) {
    for (let sourceIndex = 0; sourceIndex < sources.length; sourceIndex++) {
      // Check if we have enough articles and haven't reached pageSize
      if (mixedArticles.length >= pageSize) {
        break;
      }
      
      // Get the article at this index from this source
      const sourceArticles = sourceArrays[sourceIndex];
      if (articleIndex < sourceArticles.length) {
        const article = sourceArticles[articleIndex];
        mixedArticles.push(article);
      }
    }
    
    // Break if we have enough articles
    if (mixedArticles.length >= pageSize) {
      break;
    }
  }
  return mixedArticles.slice(0, pageSize);
}

// Function to generate a simple ID
function generateId(prefix: string, num: number): string {
  // Create a more consistent ID format
  return `${prefix}-${num}-${Date.now().toString(36).slice(-4)}`;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: NextRequest) {
  console.log("🔍 API route /api/news called");
  
  // Parse query parameters from the request
  const searchParams = request.nextUrl.searchParams;
  const pageSize = Number(searchParams.get('pageSize') || '12');
  const refresh = searchParams.get('refresh') === 'true';
  
  if (refresh) {
    console.log("🔄 Manual refresh requested - forcing fresh data fetch");
  }
  
  // Add random seed to ensure different results each time
  const randomSeed = Math.random();
  console.log(`🎲 Random seed: ${randomSeed}`);
  
  try {
    // Load configured RSS feeds
    const configuredFeeds = await loadConfiguredFeeds();
    console.log(`📰 Found ${configuredFeeds.length} active RSS feeds`);
    
    // Fetch from all configured feeds
    const allArticles: NewsItem[] = [];
    
    for (const feed of configuredFeeds) {
      try {
        console.log(`📡 Fetching from: ${feed.title} (${feed.url})`);
        
        const response = await fetch(feed.url, {
          // Disable caching for more randomness or when refresh is requested
          cache: refresh ? 'no-store' : 'no-store'
        });
        
        if (!response.ok) {
          console.error(`❌ Failed to fetch ${feed.title}: ${response.status}`);
          continue;
        }
        
        const xml = await response.text();
        
        // Parse XML safely
        const parser = new XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_',
          isArray: (name, jpath) => name === 'item' || name === 'media:content' || name === 'enclosure'
        });
        const parsed = parser.parse(xml);
        const channel = parsed?.rss?.channel;
        const items = channel?.item || [];
    
    // Helper: extract first image URL from item via media:content, enclosure, or HTML content
    const extractImage = (item: any): string | undefined => {
      // Check media:content first
      const media = item?.['media:content'] || item?.media?.content;
      if (Array.isArray(media) && media.length > 0) {
        const url = media[0]?.['@_url'] || media[0]?.url;
        if (typeof url === 'string' && isValidImageUrl(url)) return url;
      }
      
      // Check enclosure
      const enclosure = item?.enclosure;
      if (Array.isArray(enclosure) && enclosure.length > 0) {
        const url = enclosure[0]?.['@_url'] || enclosure[0]?.url;
        if (typeof url === 'string' && isValidImageUrl(url)) return url;
      } else if (enclosure && typeof enclosure === 'object') {
        const url = enclosure?.['@_url'] || enclosure?.url;
        if (typeof url === 'string' && isValidImageUrl(url)) return url;
      }
      
      // Check for image in content:encoded or description
      const rawContent = item?.['content:encoded'] || '';
      const rawDescription = item?.description || '';
      const decodedContent = typeof rawContent === 'string' ? decodeHtmlEntities(rawContent) : '';
      const decodedDescription = typeof rawDescription === 'string' ? decodeHtmlEntities(rawDescription) : '';
      const html = decodedContent || decodedDescription;
      
      if (typeof html === 'string' && html) {
        // Look for img tags with src attribute
        const imgMatch = html.match(/<img[^>]*src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1] && isValidImageUrl(imgMatch[1])) {
          return imgMatch[1];
        }
        
        // Look for other image patterns
        const patterns = [
          /https?:\/\/[^\s<>"]+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s<>"]*)?/gi,
          /https?:\/\/[^\s<>"]*\/images?\/[^\s<>"]*\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?[^\s<>"]*)?/gi
        ];
        
        for (const pattern of patterns) {
          const matches = html.match(pattern);
          if (matches && matches.length > 0) {
            for (const match of matches) {
              if (isValidImageUrl(match)) {
                return match;
              }
            }
          }
        }
      }
      
      return undefined;
    };
    
    // Helper: check if URL is a valid image
    const isValidImageUrl = (url: string): boolean => {
      if (!url || typeof url !== 'string') return false;
      
      // Must be a valid URL
      try {
        new URL(url);
      } catch {
        return false;
      }
      
      // Check for image file extensions
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
      if (imageExtensions.test(url)) return true;
      
      // Check for common image hosting domains
      const imageDomains = [
        'imgur.com', 'flickr.com', 'unsplash.com', 'pixabay.com',
        'pexels.com', 'images.unsplash.com', 'cdn', 'static'
      ];
      
      return imageDomains.some(domain => url.includes(domain));
    };
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
    };
    
        const allItems = items;
        const mapped: NewsItem[] = allItems
          .map((item: any, index: number) => {
            const title: string = item?.title ?? 'Untitled';
            const link: string = item?.link ?? '#';
            const pubDate: string = item?.pubDate ?? new Date().toISOString();
            const rawDesc: string = item?.description || item?.['content:encoded'] || '';
            const decodedDesc = typeof rawDesc === 'string' ? decodeHtmlEntities(rawDesc) : '';
            const textExcerpt = decodedDesc ? stripHtml(decodedDesc).slice(0, 280) : '';
            const imageUrl = extractImage(item);
            
            // Only include articles that have a real image (not fallback)
            if (!imageUrl || imageUrl === '/images/breaking-news-fallback.svg') {
              return null; // Filter out articles without images
            }
            
            return {
              id: generateId('news', allArticles.length + index + 1),
              title,
              headline: title,
              content: textExcerpt || 'Artikelvorschau derzeit nicht verfügbar.',
              url: link,
              urlToImage: imageUrl,
              relatedImages: [imageUrl],
              publishedAt: new Date(pubDate).toISOString(),
              formattedDate: formatDate(pubDate),
              category: 'news',
              author: channel?.title || feed.title,
              source: feed.title,
              rank: allArticles.length + index + 1,
              searchVolume: `${Math.floor(Math.random() * 500) + 100}K+`
            };
          })
          .filter((item: NewsItem | null): item is NewsItem => item !== null); // Remove null entries
        
        // Log filtering results
        const filteredCount = allItems.length - mapped.length;
        if (filteredCount > 0) {
          console.log(`🖼️ Filtered out ${filteredCount} articles without images from ${feed.title}`);
        }
        
        // Limit after filtering
        const limitedMapped = mapped.slice(0, Math.ceil(pageSize / configuredFeeds.length));
        
        allArticles.push(...limitedMapped);
        console.log(`✅ Added ${limitedMapped.length} articles from ${feed.title}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${feed.title}:`, error);
        // Continue with other feeds
      }
    }
    
    // Apply round-robin distribution to mix articles from different feeds
    // First, sort all articles by date to ensure newest first
    allArticles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    
    // Then apply round-robin distribution
    const finalArticles = mixArticlesFromFeeds(allArticles, pageSize);
    
    // If no articles from any feed, return fallback for robustness
    if (finalArticles.length === 0) {
      console.warn('⚠️ No articles from any RSS feed, using fallback');
      return NextResponse.json({ articles: getFallbackHorizont() });
    }
    
    // Log the mixing result
    const sourceCounts: { [key: string]: number } = {};
    finalArticles.forEach(article => {
      sourceCounts[article.source] = (sourceCounts[article.source] || 0) + 1;
    });
    
    console.log(`📰 Returning ${finalArticles.length} mixed articles from ${configuredFeeds.length} feeds:`, sourceCounts);
    
    const response = NextResponse.json({ articles: finalArticles });
    
    // Disable caching to ensure fresh results
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
  } catch (error) {
    console.error('❌ Error fetching/parsing HORIZONT RSS:', error);
    return NextResponse.json({ articles: getFallbackHorizont() });
  }
}

// Fallback data that mimics HORIZONT articles (never Google Trends)
function getFallbackHorizont(): NewsItem[] {
  const items = [
    {
      title: 'Agentur gewinnt neuen Automotive-Etat',
      url: 'https://www.horizont.net/agenturen/aktuell',
    },
    {
      title: 'Pitch-Update: Neue Leadagentur für Retail-Marke',
      url: 'https://www.horizont.net/agenturen/aktuell',
    },
    {
      title: 'Kreation der Woche: Kampagne setzt auf KI-Visuals',
      url: 'https://www.horizont.net/agenturen/aktuell',
    },
    {
      title: 'Fusion am Markt: Netzwerk integriert Digital-Spezialisten',
      url: 'https://www.horizont.net/agenturen/aktuell',
    }
  ];
  
  return items.map((it, index) => ({
    id: generateId('fallback-horizont', index + 1),
    title: it.title,
    headline: it.title,
    content: 'Artikelvorschau derzeit nicht verfügbar.',
    url: it.url,
    urlToImage: '/images/breaking-news-fallback.svg',
    relatedImages: ['/images/breaking-news-fallback.svg'],
    publishedAt: new Date().toISOString(),
    formattedDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }),
    category: 'news',
    author: 'HORIZONT',
    source: 'HORIZONT',
    rank: index + 1,
    searchVolume: `${Math.floor(Math.random() * 500) + 100}K+`
  }));
} 