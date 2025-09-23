'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { NewsItem, InstagramPost, CalendarEvent } from '@/types/dashboard';
import ImageViewer from '@/components/ImageViewer';
import BackgroundAnimation from '@/components/BackgroundAnimation';
import AdminSettingsModal from '@/components/admin/AdminSettingsModal';
import React from 'react';

// Helper component: dynamically clamp description based on title line count
function NewsCard({ item, idx, isNewsAnimating }: { item: NewsItem; idx: number; isNewsAnimating: boolean }) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const [descClamp, setDescClamp] = useState<2 | 3>(3);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const style = window.getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight || '0');
    const lines = lineHeight > 0 ? Math.round(el.clientHeight / lineHeight) : 1;
    setDescClamp(lines >= 2 ? 2 : 3);
  }, [item.title]);

  return (
    <a 
      href={item.url}
      target="_blank" 
      rel="noopener noreferrer"
      key={item.id || idx} 
      className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden flex flex-row hover:bg-gray-50/80 transition-colors h-full"
      style={{
        opacity: isNewsAnimating ? 0 : 1,
        transform: isNewsAnimating ? 'translateY(-20px)' : 'translateY(0)',
        transition: `opacity 500ms ease-out ${idx * 150}ms, transform 500ms ease-out ${idx * 150}ms`
      }}
    >
      {/* Image on the left fills the card height */}
      <div className="relative flex-shrink-0 h-full w-1/3 min-w-[180px]">
        <Image 
          src={(item.urlToImage as string) || '/images/breaking-news-fallback.svg'}
          alt={item.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
          className="object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (img && img.getAttribute('data-fallback') !== 'true') {
              img.src = '/images/breaking-news-fallback.svg';
              img.setAttribute('data-fallback', 'true');
            }
          }}
        />
      </div>
      
      {/* Content on the right */}
      <div className="px-4 py-3 pb-4 flex-grow flex flex-col min-w-0 min-h-0 h-full">
        <div className="flex items-center mb-0.5">
          <span className="font-semibold text-sm text-gray-800 truncate">
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
        
        <h3 ref={titleRef} className="text-base font-semibold text-gray-900 mb-1 break-words">
          {item.title}
        </h3>
        
        <p className={`text-sm text-gray-600 leading-snug ${descClamp === 2 ? 'line-clamp-2' : 'line-clamp-3'}`}>
          {item.content}
        </p>
        
        <div className="mt-auto"></div>
      </div>
    </a>
  );
}


// Refresh interval in milliseconds (5 minutes)
const REFRESH_INTERVAL = 5 * 60 * 1000;

async function getDashboardData() {
  try {
    // Get the current URL from the window instead of using hardcoded values
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      
  const res = await fetch(`${baseUrl}/api/dashboard`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
      throw new Error(`Failed to fetch dashboard data: ${res.status}`);
  }
  
  return res.json();
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return fallback data in case of an error
    return {
      news: [
        {
          id: 'fallback-1',
          title: 'Fallback News Item',
          category: 'Trend',
          author: 'System',
          publishedAt: new Date().toISOString(),
          content: 'This is fallback content when API is unavailable.'
        }
      ],
      instagramPosts: [
        {
          id: 'fallback-1',
          caption: 'Fallback Instagram post - API is currently unavailable.',
          imageUrl: 'https://images.unsplash.com/photo-1505121351528-0fbbd60a3de8',
          likes: 0,
          comments: 0,
          postedAt: new Date().toISOString()
        }
      ],
      events: [
        {
          id: 'fallback-1',
          title: 'Fallback Event',
          description: 'This is a fallback event when the API is unavailable',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          location: 'System'
        }
      ]
    };
  }
}

export default function Home() {
  const [data, setData] = useState<{
    news: NewsItem[];
    instagramPosts?: InstagramPost[];
    instagramFeeds?: { title: string; posts: InstagramPost[] }[];
    events: CalendarEvent[];
  }>({ news: [], events: [] });
  
  // Check if we're in admin mode
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  useEffect(() => {
    // Check if current URL contains '/admin'
    setIsAdminMode(window.location.pathname.includes('/admin'));
  }, []);
  
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [scrollPos, setScrollPos] = useState(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [eventsByMonth, setEventsByMonth] = useState<Record<string, CalendarEvent[]>>({});
  const [months, setMonths] = useState<string[]>([]);

  // Add state for current month index
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('next');

  // Add rotation state for news
  const [currentNewsPage, setCurrentNewsPage] = useState(0);
  const [isNewsAnimating, setIsNewsAnimating] = useState(false);
  const newsItemsPerPage = 2;

  // For Instagram feed rotation
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [instagramFeeds, setInstagramFeeds] = useState<{ title: string; posts: InstagramPost[] }[]>([]);
  const [isFeedAnimating, setIsFeedAnimating] = useState(false);

  // After data is loaded, extract the feeds
  useEffect(() => {
    if (data && data.instagramFeeds && data.instagramFeeds.length > 0) {
      setInstagramFeeds(data.instagramFeeds);
    }
  }, [data]);

  // Rotate Instagram feeds every 20 seconds (changed from 45 seconds)
  useEffect(() => {
    if (instagramFeeds.length <= 1) return;
    
    const feedInterval = setInterval(() => {
      setIsFeedAnimating(true);
      
      // Wait for fade out animation
      setTimeout(() => {
        setCurrentFeedIndex((prevIndex) => (prevIndex + 1) % instagramFeeds.length);
        
        // Wait a bit before fading back in
        setTimeout(() => {
          setIsFeedAnimating(false);
        }, 300);
      }, 500);
    }, 20000); // 20 seconds (changed from 45 seconds)
    
    return () => clearInterval(feedInterval);
  }, [instagramFeeds.length]);

  // Get the current feed to display
  const currentFeed = instagramFeeds[currentFeedIndex] || { title: 'Social Media', posts: [] };

  // Fetch weather data for Düsseldorf
  const fetchWeather = async () => {
    try {
      // Weather API call for Düsseldorf
      const API_KEY = 'b5d31391ed53a6f6bcd5cf969eaa34ea'; // Replace with your actual API key
      const CITY = 'Düsseldorf';
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${API_KEY}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Weather API request failed');
      }
      
      const data = await response.json();
      
      // Map OpenWeatherMap conditions to our simplified conditions
      const weatherCode = data.weather[0].id;
      let condition = 'Sunny';
      
      // Map weather codes to our condition categories
      // See https://openweathermap.org/weather-conditions for all codes
      if (weatherCode >= 200 && weatherCode < 300) {
        condition = 'Light Rain'; // Thunderstorm, but we'll use Light Rain
      } else if (weatherCode >= 300 && weatherCode < 600) {
        condition = 'Light Rain'; // Drizzle and Rain
      } else if (weatherCode >= 600 && weatherCode < 700) {
        condition = 'Light Rain'; // Snow, but we'll use Light Rain
      } else if (weatherCode >= 700 && weatherCode < 800) {
        condition = 'Cloudy'; // Atmosphere (fog, mist)
      } else if (weatherCode === 800) {
        condition = 'Sunny'; // Clear sky
      } else if (weatherCode > 800 && weatherCode < 803) {
        condition = 'Partly Cloudy'; // Few/scattered clouds
      } else if (weatherCode >= 803) {
        condition = 'Cloudy'; // Broken/overcast clouds
      }
      
      // Round temperature to nearest integer
      const temp = Math.round(data.main.temp);
      
      setWeather({ temp, condition });
    } catch (error) {
      console.error('Error fetching weather:', error);
      // Fallback to simulated data if API call fails
      const temp = Math.floor(Math.random() * 10) + 15; // Random temp between 15-25°C
      const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      
      setWeather({ temp, condition });
    }
  };

  // Update time every minute and weather every hour
  useEffect(() => {
    // Initial fetch
    fetchWeather();
    
    const timeTimer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);
    
    const weatherTimer = setInterval(() => {
      fetchWeather();
    }, 3600000); // Every hour
    
    return () => {
      clearInterval(timeTimer);
      clearInterval(weatherTimer);
    };
  }, []);

  const fetchData = async () => {
    try {
      const newData = await getDashboardData();
      console.log('Dashboard data received:', {
        newsCount: newData.news?.length,
        instagramCount: newData.instagramPosts?.length,
        instagramFeedsCount: newData.instagramFeeds?.length,
        eventsCount: newData.events?.length
      });
      
      // Check if the news data is valid
      if (!newData.news || !Array.isArray(newData.news)) {
        console.error('Invalid news data received:', newData.news);
        newData.news = [];
      } else if (newData.news.length === 0) {
        console.warn('No news articles received');
      } else {
        console.log('News data sample:', newData.news[0]);
      }
      
      setData(newData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Process events by month whenever data changes
  useEffect(() => {
    if (!data?.events || data.events.length === 0) return;
    
    const groupedEvents: Record<string, CalendarEvent[]> = {};
    
    data.events.forEach((event) => {
      const date = new Date(event.startDate);
      const monthYear = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!groupedEvents[monthYear]) {
        groupedEvents[monthYear] = [];
      }
      
      groupedEvents[monthYear].push(event);
    });
    
    // Sort events within each month by start date
    Object.keys(groupedEvents).forEach((month) => {
      groupedEvents[month].sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    });
    
    // Get months in chronological order (only months with events)
    const sortedMonths = Object.keys(groupedEvents)
      .filter(month => groupedEvents[month].length > 0) // Only months with events
      .sort((a, b) => {
        const dateA = new Date(groupedEvents[a][0].startDate);
        const dateB = new Date(groupedEvents[b][0].startDate);
        return dateA.getTime() - dateB.getTime();
      });
    
    setEventsByMonth(groupedEvents);
    setMonths(sortedMonths);
    
    // Reset current month index to 0 (first month with events)
    setCurrentMonthIndex(0);
    
    // Set initial animation direction for smoother first render
    setAnimationDirection('initial');
    setIsAnimating(true);
    
    // After a small delay, show the events with animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 100);
  }, [data?.events]);

  // Auto scrolling effect
  useEffect(() => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const totalHeight = container.scrollHeight;
    const visibleHeight = container.clientHeight;
    
    if (totalHeight <= visibleHeight) return; // No need to scroll if content fits
    
    const scrollStep = 1; // Pixels to scroll per frame
    const scrollDelay = 30; // Time between frames (ms)
    
    let position = scrollPos;
    const scrollInterval = setInterval(() => {
      position += scrollStep;
      
      // Loop back to top when reaching bottom
      if (position >= totalHeight - visibleHeight) {
        // Instead of just resetting, create a smooth loop
        // by using a small timeout to pause at the end
        clearInterval(scrollInterval);
        setTimeout(() => {
          setScrollPos(0);
        }, 1000);
        return;
      }
      
      setScrollPos(position);
      container.scrollTop = position;
    }, scrollDelay);
    
    // Pause scrolling on hover
    const handleMouseEnter = () => clearInterval(scrollInterval);
    const handleMouseLeave = () => {
      position = container.scrollTop;
      setScrollPos(position);
    };
    
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      clearInterval(scrollInterval);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scrollPos, scrollRef.current]);

  // Add month auto-switching effect with animations
  useEffect(() => {
    if (months.length === 0) {
      setCurrentMonthIndex(0);
      return;
    }
    
    const switchMonthsInterval = setInterval(() => {
      // Start exit animation
      setIsAnimating(true);
      
      // Alternate between different animation directions for visual variety
      setAnimationDirection(prev => {
        const directions = ['next', 'up', 'down'];
        const currentIndex = directions.indexOf(prev === 'initial' ? 'next' : prev);
        return directions[(currentIndex + 1) % directions.length];
      });
      
      // Delay the actual month change to allow for animation
      setTimeout(() => {
        setCurrentMonthIndex((prevIndex) => (prevIndex + 1) % months.length);
        
        // Allow a brief moment for the new content to render before starting the entrance animation
        setTimeout(() => {
          setIsAnimating(false);
        }, 50);
      }, 500); // This should match the duration of the exit animation
      
    }, 10000); // Switch every 10 seconds
    
    return () => clearInterval(switchMonthsInterval);
  }, [months]);

  // Auto rotate news articles
  useEffect(() => {
    // Filter news articles to only include those with valid images
    const validNewsArticles = data.news ? data.news.filter(item => item.urlToImage && typeof item.urlToImage === 'string') : [];
    
    if (!validNewsArticles || validNewsArticles.length <= newsItemsPerPage) return;
    
    const newsRotationInterval = setInterval(() => {
      // Start exit animation
      setIsNewsAnimating(true);
      
      // Delay the actual page change to allow for animation
      setTimeout(() => {
        setCurrentNewsPage((prevPage) => {
          const totalPages = Math.ceil(validNewsArticles.length / newsItemsPerPage);
          return (prevPage + 1) % totalPages;
        });
        
        // Allow a moment for the new content to render before starting entrance animation
        setTimeout(() => {
          setIsNewsAnimating(false);
        }, 50);
      }, 500);
      
    }, 8000); // Rotate every 8 seconds
    
    return () => clearInterval(newsRotationInterval);
  }, [data.news]);

  if (!data) return null;

  // Function to format date display
  const formatDateDisplay = (startDate: Date, endDate: Date) => {
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    
    if (startDate.toDateString() === endDate.toDateString()) {
      // Same day event
      return `${startMonth} ${startDay}`;
    } else if (startMonth === endMonth) {
      // Same month, different days
      return `${startMonth} ${startDay}-${endDay}`;
    } else {
      // Different months
      return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
    }
  };

  return (
    <div className="h-[98vh] overflow-hidden">
      <BackgroundAnimation />
      <div className="h-full flex flex-col mx-[1%] py-[2vh] justify-center">
        {/* Header with logo, title, date/time and weather */}
        <header className="flex items-center justify-between py-1 flex-shrink-0">
          <div className="flex items-center">
            <img 
              src="/images/BBDO_herzlogo_RGB.svg" 
              alt="BBDO Logo" 
              width={170}
              height={50}
              className="mr-4"
            />
            <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              AGENCY DASHBOARD
            </h1>
          </div>
          
          {/* Admin Settings Button - only show in admin mode */}
          {isAdminMode && (
            <div className="flex items-center">
              <AdminSettingsModal />
            </div>
          )}
          
          <div className="bg-white py-2.5 px-4 rounded-3xl shadow-sm flex items-center space-x-1">
            <div className="text-gray-700 text-xs sm:text-sm font-medium">
              {currentDateTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })} | {currentDateTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-gray-700 text-xs sm:text-sm font-medium flex items-center ml-1">
              <span className="mr-1">Düsseldorf:</span>
              <span className="font-semibold">{weather?.temp || 21}°C</span>
              <span className="ml-1">{weather?.condition || 'Sunny'}</span>
              {weather?.condition === 'Sunny' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
              {weather?.condition === 'Partly Cloudy' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                </svg>
              )}
              {weather?.condition === 'Cloudy' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                </svg>
              )}
              {weather?.condition === 'Light Rain' && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-1 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                </svg>
              )}
            </div>
          </div>
        </header>

        {/* Main Content - with more spacing from header */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 mb-2 mt-6">
          {/* Top Row - Calendar and Instagram */}
          <div className="grid grid-cols-12 gap-4 h-[48%]">
            {/* Calendar section - 7 columns */}
            <div className="col-span-7 h-full overflow-hidden rounded-2xl relative shadow-lg">
              {/* Background with gradient */}
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-[#B6DDF6] to-[#9AB2D6]">
              </div>
              
              {/* Content */}
              <div className="relative h-full w-full z-10 flex flex-col p-6 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-xl md:text-2xl lg:text-[1.6rem] xl:text-[1.8rem] 2xl:text-[2.1rem] uppercase text-gray-900 dark:text-white leading-tight">
                    Advertising Event Calendar
                  </h2>
                  {months.length > 0 && currentMonthIndex < months.length && (
                    <div 
                      className="bg-white px-4 sm:px-6 py-2 rounded-full shadow-sm"
                      style={{
                        opacity: isAnimating ? 0 : 1,
                        transform: isAnimating 
                          ? (animationDirection === 'next' ? 'translateY(-20px)' 
                             : animationDirection === 'up' ? 'translateY(-30px)' 
                             : animationDirection === 'down' ? 'translateY(30px)' 
                             : 'translateY(-20px)')
                          : 'translateY(0)',
                        transition: 'opacity 400ms ease-out, transform 400ms ease-out'
                      }}  
                    >
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase">
                        {months[currentMonthIndex]}
                      </h3>
                    </div>
                  )}
                </div>
                
                {months.length > 0 && currentMonthIndex < months.length ? (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {eventsByMonth[months[currentMonthIndex]]?.slice(0, 6).map((event, index) => {
                      const startDate = new Date(event.startDate);
                      const endDate = new Date(event.endDate);
                      const dateDisplay = formatDateDisplay(startDate, endDate);
                      
                      // Extract just the date numbers
                      const dateNumbers = dateDisplay.replace(/[a-zA-Z\s]/g, '');
                      
                      // Generate month abbreviation from start date
                      const monthAbbreviation = startDate.toLocaleDateString('de-DE', { month: 'short' });
                      
                      // Calculate staggered delays based on index and animation direction
                      const getStaggerDelay = () => {
                        switch (animationDirection) {
                          case 'next': return index * 100;
                          case 'up': return (5 - index) * 100;
                          case 'down': return index * 100 + 50;
                          default: return index * 150;
                        }
                      };
                      
                      const staggerDelay = getStaggerDelay();
                      
                      // Determine transform based on animation direction
                      const getExitTransform = () => {
                        switch (animationDirection) {
                          case 'next': return 'translateY(-20px)';
                          case 'up': return 'translateY(-30px)';
                          case 'down': return 'translateY(30px)';
                          default: return 'translateY(-20px)';
                        }
                      };
                      
                      return (
                        <div 
                          key={event.id} 
                          className="flex items-stretch bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[84px]"
                          style={{
                            ...(!isAnimating ? {
                              opacity: 1,
                              transform: 'translateY(0)',
                              transition: `opacity 500ms ease-out ${staggerDelay}ms, transform 500ms ease-out ${staggerDelay}ms`
                            } : {
                              opacity: 0,
                              transform: getExitTransform(),
                              transition: `opacity 500ms ease-out ${staggerDelay}ms, transform 500ms ease-out ${staggerDelay}ms`
                            }),
                            ...(animationDirection === 'initial' ? {
                              opacity: isAnimating ? 0 : 1,
                              transform: isAnimating ? 'translateY(20px)' : 'translateY(0)',
                              transition: `opacity 500ms ease-out ${index * 150}ms, transform 500ms ease-out ${index * 150}ms`
                            } : {})
                          }}
                        >
                          <div className="flex-shrink-0 text-center bg-blue-50 flex flex-col justify-center items-center w-[84px]">
                            <span className="text-blue-600 font-bold leading-tight">
                              <div className="text-lg mb-0">{monthAbbreviation}</div>
                              <div className="text-xl">{dateNumbers}</div>
                            </span>
                          </div>
                          <div className="p-3 flex-grow flex flex-col justify-center">
                            <h4 className="text-sm font-semibold text-gray-900 leading-tight">
                              {event.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {event.description}
                            </p>
                            <div className="mt-2 flex items-center">
                              <span className="flex-shrink-0 inline-block w-2 h-2 rounded-full bg-gray-200 mr-2"></span>
                              <span className="text-xs text-gray-500 truncate">
                                {event.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-white/80 rounded-xl mt-4">
                    <p className="text-gray-500">No upcoming events found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instagram Feed - 5 columns */}
            <div className="col-span-5 h-full overflow-hidden rounded-2xl relative shadow-lg">
              {/* Background with gradient */}
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-[#FFC8AA] to-[#DF8D61]">
              </div>
              
              {/* Content */}
              <div className="relative h-full w-full z-10 flex flex-col p-6 pt-4 pb-1">
                <div className="flex items-center justify-end mb-3">
                  <h2 className="font-bold text-xl md:text-2xl lg:text-[1.6rem] xl:text-[1.8rem] 2xl:text-[2.1rem] uppercase text-gray-900 dark:text-white leading-tight"
                       style={{
                        opacity: isFeedAnimating ? 0 : 1,
                        transition: 'opacity 500ms ease-in-out'
                       }}>
                    {currentFeed.title}
                  </h2>
                </div>
                
                <div className="relative z-20 flex-grow flex flex-col py-0">
                  {currentFeed.posts && currentFeed.posts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3 sm:gap-3 h-full pb-0">
                      {currentFeed.posts.slice(0, 3).map((post, index) => (
                        <div 
                          key={`instagram-post-${index}-${post.id}`} 
                          className="flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden"
                          style={{ 
                            height: 'calc(100% - 10px)', 
                            marginTop: '5px', 
                            marginBottom: '5px',
                            opacity: isFeedAnimating ? 0 : 1,
                            transform: isFeedAnimating ? 'translateY(20px)' : 'translateY(0)',
                            transition: `opacity 500ms ease-out ${index * 150}ms, transform 500ms ease-out ${index * 150}ms`
                          }}
                        >
                          {/* Image container with fixed ratio */}
                          <div 
                            className="relative overflow-hidden flex-shrink-0" 
                            style={{ height: '70%' }}
                          >
                            <Image
                              src={post.imageUrl}
                              alt={post.caption}
                              fill
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 350px"
                              className="object-cover"
                              priority={index === 0}
                            />
                          </div>
                          
                          {/* Caption and metadata below image */}
                          <div 
                            className="p-2 pt-2 pb-1 bg-white flex flex-col justify-between" 
                            style={{ height: '40%' }}
                          >
                            <p className="text-xs sm:text-sm md:text-sm text-gray-900 line-clamp-3 mb-1">
                              {post.caption.length > 65 ? `${post.caption.substring(0, 65)}...` : post.caption}
                            </p>
                            
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500">
                                {new Date(post.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white/80 rounded-xl">
                      <p className="text-gray-500">No posts found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - News and Slideshow with custom width distribution */}
          <div className="flex gap-4 h-[48%]">
            {/* News section - flexible width */}
            <div className="flex-1 h-full overflow-hidden rounded-2xl relative shadow-lg">
              {/* Background with gradient */}
              <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#E98888] to-[#C86969]">
              </div>
              
              {/* Content */}
              <div className="relative h-full w-full z-10 flex flex-col p-5 pt-5 pb-5">
                <div className="flex items-start mb-4">
                  <h2 className="font-bold text-xl md:text-2xl lg:text-[1.6rem] xl:text-[1.8rem] 2xl:text-[2.1rem] uppercase text-gray-900 dark:text-white leading-tight">
                    News
                  </h2>
                </div>
                
                <div className="relative z-10 flex-1 flex flex-col mt-3 overflow-hidden min-h-0">
                  {/* Always show exactly 2 news items filling the container height equally */}
                  {data.news && data.news.length > 0 ? (
                    <div className="grid grid-rows-2 gap-3 h-full">
                      {data.news
                        .map(item => ({
                          ...item,
                          urlToImage: (item.urlToImage && typeof item.urlToImage === 'string') ? item.urlToImage : '/images/breaking-news-fallback.svg'
                        }))
                        .slice(currentNewsPage * newsItemsPerPage, (currentNewsPage + 1) * newsItemsPerPage)
                        .map((item, idx) => (
                          <NewsCard key={item.id || idx} item={item} idx={idx} isNewsAnimating={isNewsAnimating} />
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white/80 rounded-xl">
                      <p className="text-gray-500">No news articles found.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Image Gallery - 16:9 aspect ratio container */}
            <div className="h-full overflow-hidden rounded-2xl relative shadow-lg" style={{ aspectRatio: '16 / 9', minWidth: '0' }}>
              {/* Content with ImageViewer as Background */}
              <div className="absolute inset-0 w-full h-full">
                {/* Full-size ImageViewer - styled to fill entire space */}
                <div className="absolute inset-0 z-10">
                  <div className="w-full h-full">
                    <ImageViewer interval={10000} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
