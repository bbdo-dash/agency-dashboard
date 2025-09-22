import DashboardLayout from '@/components/layout/DashboardLayout';
import { PhotoIcon, HeartIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import type { InstagramPost } from '@/types/dashboard';

async function getInstagramData() {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'
      : '';
      
  const res = await fetch(`${baseUrl}/api/dashboard`, {
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch Instagram data');
  }
  
  const data = await res.json();
  return data.instagramPosts;
}

export default async function InstagramPage() {
  const posts = await getInstagramData();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <PhotoIcon className="h-6 w-6 text-gray-400 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Instagram Feed</h1>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Latest posts from the last 24 hours
            </p>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: InstagramPost) => (
            <div key={post.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={post.imageUrl}
                  alt={post.caption}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 400px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="text-white text-center p-4">
                      <div className="flex items-center justify-center space-x-4">
                        <div className="flex items-center">
                          <HeartIcon className="h-5 w-5 mr-1" />
                          <span>{post.likes.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center">
                          <ChatBubbleLeftIcon className="h-5 w-5 mr-1" />
                          <span>{post.comments.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
                  {post.caption}
                </p>
                <time className="mt-2 block text-xs text-gray-500 dark:text-gray-400">
                  {new Date(post.timestamp).toLocaleDateString()}
                </time>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
} 