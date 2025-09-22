'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { NewsItem } from '@/types/dashboard';

interface NewsSearchProps {
  onSearch: (news: NewsItem[]) => void;
  onLoading: (loading: boolean) => void;
}

// Fashion news categories
const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'business', name: 'Business' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'health', name: 'Health' },
  { id: 'science', name: 'Science' },
  { id: 'sports', name: 'Sports' },
  { id: 'technology', name: 'Technology' }
];

export default function NewsSearch({ onSearch, onLoading }: NewsSearchProps) {
  const [searchTerm, setSearchTerm] = useState('fashion');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    onLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Always include 'fashion' in the search to keep results relevant
      const query = searchTerm ? `fashion ${searchTerm}` : 'fashion';
      params.append('q', query);
      
      // Add category if it's not 'all'
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      params.append('pageSize', '10');

      // Fetch news from our API
      const response = await fetch(`/api/news?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      onSearch(data.articles);
    } catch (error) {
      console.error('Error searching news:', error);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSearch} className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search fashion news..."
              className="w-full pl-10 pr-4 py-2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setSelectedCategory(category.id);
                handleSearch();
              }}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
} 