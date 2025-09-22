import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    const userId = process.env.INSTAGRAM_USER_ID;

    if (!accessToken || !userId) {
      throw new Error('Missing Instagram API credentials');
    }

    // Instagram Graph API endpoint for user's media
    const response = await fetch(
      `https://graph.instagram.com/v12.0/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Instagram API');
    }

    const data = await response.json();
    
    // Transform the data to match your InstagramPost type
    const posts = data.data.map((post: unknown) => ({
      id: post.id,
      caption: post.caption || '',
      imageUrl: post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url,
      likes: 0, // Note: Recent Instagram API doesn't provide likes count
      comments: 0, // Note: Recent Instagram API doesn't provide comments count
      timestamp: post.timestamp
    }));

    return NextResponse.json({ instagramPosts: posts });
  } catch (error) {
    console.error('Instagram API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram posts' },
      { status: 500 }
    );
  }
} 