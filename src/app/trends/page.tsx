import { Metadata } from 'next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { NewsItem } from "@/types/dashboard";

export const metadata: Metadata = {
  title: 'News - Agency Dashboard',
  description: 'Latest news from Germany'
};

// Fallback trends data
function getFallbackTrends(): NewsItem[] {
  return [
    {
      id: 'fallback-1',
      title: 'Tesla Bot',
      category: 'trend',
      author: 'Google Trends',
      source: 'Google Trends',
      publishedAt: new Date().toISOString(),
      content: 'Latest updates on Tesla\'s humanoid robot project',
      url: 'https://google.com/trends',
      urlToImage: '/placeholder-1.jpg',
      relatedImages: ['/placeholder-1.jpg', '/placeholder-2.jpg', '/placeholder-3.jpg'],
      searchVolume: '400K+',
      rank: 1
    },
    {
      id: 'fallback-2',
      title: 'Sean Penn',
      category: 'trend',
      author: 'Google Trends',
      source: 'Google Trends',
      publishedAt: new Date().toISOString(),
      content: 'News about the actor and filmmaker',
      url: 'https://google.com/trends',
      urlToImage: '/placeholder-2.jpg',
      relatedImages: ['/placeholder-2.jpg', '/placeholder-3.jpg', '/placeholder-4.jpg'],
      searchVolume: '250K+',
      rank: 2
    },
    {
      id: 'fallback-3',
      title: 'Call of Duty: Vanguard',
      category: 'trend',
      author: 'Google Trends',
      source: 'Google Trends',
      publishedAt: new Date().toISOString(),
      content: 'Updates on the popular video game',
      url: 'https://google.com/trends',
      urlToImage: '/placeholder-3.jpg',
      relatedImages: ['/placeholder-3.jpg', '/placeholder-4.jpg', '/placeholder-5.jpg'],
      searchVolume: '200K+',
      rank: 3
    },
    {
      id: 'fallback-4',
      title: 'Cardano',
      category: 'trend',
      author: 'Google Trends',
      source: 'Google Trends',
      publishedAt: new Date().toISOString(),
      content: 'Cryptocurrency market updates and news',
      url: 'https://google.com/trends',
      urlToImage: '/placeholder-4.jpg',
      relatedImages: ['/placeholder-4.jpg', '/placeholder-5.jpg', '/placeholder-6.jpg'],
      searchVolume: '130K+',
      rank: 4
    },
    {
      id: 'fallback-5',
      title: 'The Night House',
      category: 'trend',
      author: 'Google Trends',
      source: 'Google Trends',
      publishedAt: new Date().toISOString(),
      content: 'Reviews and discussions about the horror film',
      url: 'https://google.com/trends',
      urlToImage: '/placeholder-5.jpg',
      relatedImages: ['/placeholder-5.jpg', '/placeholder-6.jpg', '/placeholder-1.jpg'],
      searchVolume: '70K+',
      rank: 5
    },
    {
      id: 'fallback-6',
      title: 'Library of Congress',
      category: 'trend',
      author: 'Google Trends',
      source: 'Google Trends',
      publishedAt: new Date().toISOString(),
      content: 'Information about the national library of the United States',
      url: 'https://google.com/trends',
      urlToImage: '/placeholder-6.jpg',
      relatedImages: ['/placeholder-6.jpg', '/placeholder-1.jpg', '/placeholder-2.jpg'],
      searchVolume: '40K+',
      rank: 6
    }
  ];
}

// Helper function to get top headlines from our internal news endpoint (HORIZONT RSS)
async function getGoogleTrendsData(): Promise<NewsItem[]> {
  try {
    // Construct URL based on environment
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000');
    
    console.log(`Fetching top headlines from: ${baseUrl}/api/news`);
    
    // Fetch top headlines from our internal API
    const response = await fetch(
      `${baseUrl}/api/news`,
      { 
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error('Invalid data structure from API');
    }
    
    // Map the data to include popularity metrics
    return data.articles.map((article: any, index: number) => ({
      ...article,
      rank: index + 1,
      searchVolume: `${Math.floor(Math.random() * 500) + 100}K+` // Simulate search volume
    }));
  } catch (error) {
    console.error('Error fetching top headlines:', error);
    return getFallbackTrends();
  }
}

export default async function TrendsPage() {
  const googleTrends = await getGoogleTrendsData();
  
  return (
    <DashboardLayout>
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Breaking News</h1>
            <p className="text-gray-600">Latest headlines and updates</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col space-y-3 max-w-3xl mx-auto">
              {googleTrends.map((item: NewsItem) => (
                <a 
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:bg-gray-50 transition-colors p-4"
                >
                  <div className="flex items-center mb-1">
                    <span className="font-semibold text-sm text-gray-800">
                      {item.source}
                    </span>
                    <span className="text-gray-400 mx-2">•</span>
                    <time className="text-gray-500 text-sm">
                      {item.formattedDate || new Date(item.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </time>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {item.content}
                  </p>
                  
                  {item.url && item.url.startsWith('http') && (
                    <p className="text-xs text-gray-400 truncate">
                      {item.url}
                    </p>
                  )}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Format date helper function
const formatDate = (date: string | Date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(d);
}; 