import { NextResponse } from 'next/server';

export async function GET() {
  // Mock image data
  const images = [
    'fashion-1.jpg',
    'fashion-2.jpg',
    'fashion-3.jpg'
  ];
  
  return NextResponse.json({ images });
} 