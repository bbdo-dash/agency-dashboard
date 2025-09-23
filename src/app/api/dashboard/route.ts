import { NextRequest, NextResponse } from 'next/server';
import { fetchInstagramPostsFromRSS } from '@/services/instagramService';
import { CalendarEvent } from '@/types/dashboard';
import { loadEventsFromCSV, getEventsCSVPath } from '@/lib/csvParser';
import { kv } from '@vercel/kv';
import { ensureEventsInKV } from '@/lib/migration';

// Fallback news data when the News API doesn't return results
async function getFallbackNewsData() {
  // Return fallback data directly without API calls
  return [
    {
      id: '1',
      title: 'Tesla Bot',
      headline: 'Tesla Bot 400K+',
      category: 'news',
      author: 'Technology News',
      source: 'Tech Daily',
      publishedAt: new Date().toISOString(),
      content: 'Latest updates on Tesla\'s humanoid robot project',
      url: 'https://example.com/news',
      urlToImage: '/images/breaking-news-fallback.svg',
      relatedImages: ['/images/breaking-news-fallback.svg'],
      searchVolume: '400K+',
      rank: 1
    },
    {
      id: '2',
      title: 'Sean Penn',
      headline: 'Sean Penn 250K+',
      category: 'news',
      author: 'Entertainment Weekly',
      source: 'Entertainment Weekly',
      publishedAt: new Date().toISOString(),
      content: 'News about the actor and filmmaker',
      url: 'https://example.com/news',
      urlToImage: '/images/breaking-news-fallback.svg',
      relatedImages: ['/images/breaking-news-fallback.svg'],
      searchVolume: '250K+',
      rank: 2
    },
    {
      id: '3',
      title: 'Call of Duty: Vanguard',
      headline: 'Call of Duty: Vanguard 200K+',
      category: 'news',
      author: 'Gaming News',
      source: 'Game Informer',
      publishedAt: new Date().toISOString(),
      content: 'Updates on the popular video game',
      url: 'https://example.com/news',
      urlToImage: '/images/breaking-news-fallback.svg',
      relatedImages: ['/images/breaking-news-fallback.svg'],
      searchVolume: '200K+',
      rank: 3
    },
    {
      id: '4',
      title: 'Cardano',
      headline: 'Cardano 130K+',
      category: 'news',
      author: 'Business News',
      source: 'Financial Times',
      publishedAt: new Date().toISOString(),
      content: 'Cryptocurrency market updates and news',
      url: 'https://example.com/news',
      urlToImage: '/images/breaking-news-fallback.svg',
      relatedImages: ['/images/breaking-news-fallback.svg'],
      searchVolume: '130K+',
      rank: 4
    },
    {
      id: '5',
      title: 'The Night House',
      headline: 'The Night House 70K+',
      category: 'news',
      author: 'Movie Reviews',
      source: 'Variety',
      publishedAt: new Date().toISOString(),
      content: 'Reviews and discussions about the horror film',
      url: 'https://example.com/news',
      urlToImage: '/images/breaking-news-fallback.svg',
      relatedImages: ['/images/breaking-news-fallback.svg'],
      searchVolume: '70K+',
      rank: 5
    },
    {
      id: '6',
      title: 'Library of Congress',
      headline: 'Library of Congress 40K+',
      category: 'news',
      author: 'Education News',
      source: 'NPR',
      publishedAt: new Date().toISOString(),
      content: 'Information about the national library of the United States',
      url: 'https://example.com/news',
      urlToImage: '/images/breaking-news-fallback.svg',
      relatedImages: ['/images/breaking-news-fallback.svg'],
      searchVolume: '40K+',
      rank: 6
    }
  ];
}

// Get news data using our internal API (now backed by HORIZONT RSS)
async function getNewsData(request: NextRequest, refresh: boolean) {
  try {
    // Construct URL based on the incoming request origin
    const origin = request.nextUrl.origin;
    const newsUrl = `${origin}/api/news${refresh ? '?refresh=true' : ''}`;
    console.log(`Fetching news from: ${newsUrl}`);
    
    // Use our internal API which now serves HORIZONT RSS items
    const response = await fetch(newsUrl, { next: { revalidate: 60 * 60 * 5 } }); // 5 hours
    
    if (!response.ok) {
      console.error(`News endpoint responded with status: ${response.status}`);
      throw new Error(`News endpoint responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('News response received:', {
      hasArticles: !!data.articles,
      articleCount: data.articles?.length || 0
    });
    
    // Check if articles exist and has items
    if (data.articles && Array.isArray(data.articles)) {
      if (data.articles.length > 0) {
        console.log(`Successfully fetched ${data.articles.length} news items`);
        // Map search volume if not already present
        return data.articles.map((article: any, index: number) => ({
          ...article,
          rank: article.rank || (index + 1),
          searchVolume: article.searchVolume || `${Math.floor(Math.random() * 500) + 100}K+` // Ensure we have search volume
        }));
      } else {
        console.warn('News endpoint returned zero articles, using fallback data');
        return getFallbackNewsData();
      }
    } else {
      console.warn('News endpoint returned invalid data structure');
      throw new Error('Invalid data structure from news API');
    }
  } catch (error) {
    console.error('Error fetching news data:', error);
    // Return fallback Google Trends data if API fails
    return getFallbackNewsData();
  }
}

// Sample data for Instagram posts and events
const mockData = {
  instagramPosts: [
    {
      id: '1',
      caption: 'Our team celebrating the Grand Prix win at Cannes Lions Festival! #CannesLions #AgencyLife #AwardWinning',
      imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=800',
      likes: 245,
      comments: 37,
      postedAt: new Date().toISOString()
    }
  ],
  events: [
    {
      id: '1',
      title: 'Cannes Lions Festival',
      description: 'International Festival of Creativity, featuring the best work in advertising and creative communications',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000 * 7).toISOString(),
      location: 'Cannes, France'
    },
    {
      id: '2',
      title: 'Ad Tech Summit',
      description: 'Annual conference showcasing the latest in advertising technology and digital marketing',
      startDate: new Date(Date.now() + 172800000).toISOString(),
      endDate: new Date(Date.now() + 259200000).toISOString(),
      location: 'New York, USA'
    },
    {
      id: '3',
      title: 'Creative Strategy Workshop',
      description: 'Learn cutting-edge strategy techniques from award-winning creative directors',
      startDate: new Date(Date.now() + 432000000).toISOString(),
      endDate: new Date(Date.now() + 518400000).toISOString(),
      location: 'Online'
    }
  ]
};

// Helper function to check if we're in development mode
function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

// Process events from CSV data or KV storage
async function getEventsData(): Promise<CalendarEvent[]> {
  try {
    if (isDevelopment()) {
      // In development, load events from CSV file
      const csvPath = getEventsCSVPath();
      const events = loadEventsFromCSV(csvPath);
      
      console.log(`Loaded ${events.length} events from CSV file`);
      
      // Return events sorted by start date
      return events.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    } else {
      // In production, load events from Vercel KV Storage
      // Ensure events are migrated if needed
      await ensureEventsInKV();
      
      let events = await kv.get<CalendarEvent[]>('calendar_events') || [];
      
      // If no events in KV storage, try to load from CSV and migrate
      if (events.length === 0) {
        console.log('No events in KV storage, attempting to load from CSV and migrate...');
        try {
          const csvPath = getEventsCSVPath();
          const csvEvents = loadEventsFromCSV(csvPath);
          if (csvEvents.length > 0) {
            await kv.set('calendar_events', csvEvents);
            events = csvEvents;
            console.log(`Migrated ${csvEvents.length} events from CSV to KV storage`);
          }
        } catch (csvError) {
          console.error('Error loading from CSV for migration:', csvError);
        }
      }
      
      console.log(`Loaded ${events.length} events from KV storage`);
      
      // Return events sorted by start date
      return events.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    }
  } catch (error) {
    console.error('Error loading events:', error);
    
    // Fallback to empty array if loading fails
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check if this is a cache-busting request (for fresh event data after CSV upload)
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('refresh') === 'true';
    
    // Get news data from our internal API
    const news = await getNewsData(request, forceRefresh);
    console.log(`Dashboard API - news data fetched, ${news?.length || 0} items`);
    
    // Get Instagram posts from RSS feed
    let instagramFeeds;
    try {
      instagramFeeds = await fetchInstagramPostsFromRSS(forceRefresh);
      // Select a random feed to display (will be rotated on the client side)
      const randomFeedIndex = Math.floor(Math.random() * instagramFeeds.length);
      const selectedFeed = instagramFeeds[randomFeedIndex];
      
      console.log(`Dashboard API - selected feed: ${selectedFeed.title}`);
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      instagramFeeds = [{
        title: 'Porsche Motorsport',
        posts: mockData.instagramPosts
      }];
    }
    
    // Get events data (from CSV in development, from KV storage in production)
    const events = await getEventsData();
    console.log(`Dashboard API - events loaded: ${events.length} events`);
    
    // Return all data as JSON, ensuring a consistent structure
    const response = {
      news: Array.isArray(news) ? news : [], 
      instagramFeeds, // Now returning all feeds
      events,
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`Dashboard API - responding with ${response.news.length} news items, ${instagramFeeds.length} Instagram feeds, and ${events.length} events`);
    
    const CACHE_DURATION = forceRefresh ? 0 : 300; // 5 minutes for normal requests, no cache for forced refresh
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': forceRefresh
          ? 'no-cache, no-store, must-revalidate'
          : `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION}`,
        'CDN-Cache-Control': forceRefresh
          ? 'no-cache'
          : `public, s-maxage=${CACHE_DURATION}`,
        'Vercel-CDN-Cache-Control': forceRefresh
          ? 'no-cache'
          : `public, s-maxage=${CACHE_DURATION}`
      }
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json({
      news: [],
      instagramFeeds: [{
        title: 'Porsche Motorsport',
        posts: mockData.instagramPosts
      }],
      events: getEventsData(),
      error: 'Error fetching dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error',
      lastUpdated: new Date().toISOString()
    });
  }
} 