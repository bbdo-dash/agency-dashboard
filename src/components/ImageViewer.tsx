'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface ImageViewerProps {
  interval?: number; // Time in milliseconds between image changes
}

export default function ImageViewer({ interval = 10000 }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(true);
  const [blurAmount, setBlurAmount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load images from the slideshow API
  const loadImages = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/slideshow', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const imageUrls = data.images?.map((img: any) => img.path) || [];
        setImages(prevImages => {
          // Only update if images actually changed
          if (JSON.stringify(prevImages) !== JSON.stringify(imageUrls)) {
            return imageUrls;
          }
          return prevImages;
        });
      } else {
        console.error('Failed to load slideshow images from API');
        setImages([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading gallery images:', error);
      setImages([]);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImages();
  }, [refreshTrigger]); // Remove loadImages from dependencies to prevent infinite re-renders

  // Listen for storage events to refresh images when they're updated
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'slideshowUpdated') {
        setRefreshTrigger(prev => prev + 1);
        localStorage.removeItem('slideshowUpdated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // The 16:9 aspect ratio is now handled by the parent container

  const nextImage = useCallback(() => {
    if (images.length === 0) return;
    
    // Start transition: fade out + blur
    setFadeIn(false);
    
    // Gradually increase blur during transition
    const blurInterval = setInterval(() => {
      setBlurAmount(prev => {
        const newValue = prev + 2;
        return newValue > 10 ? 10 : newValue;
      });
    }, 30);
    
    // Delay the actual image change to allow fade out and blur animation
    setTimeout(() => {
      setCurrentIndex((current) => (current + 1) % images.length);
      
      // Clear the blur interval
      clearInterval(blurInterval);
      
      // Reset blur and fade in after a tiny delay
      setTimeout(() => {
        setFadeIn(true);
        
        // Gradually decrease blur after changing the image
        const unblurInterval = setInterval(() => {
          setBlurAmount(prev => {
            const newValue = prev - 2;
            if (newValue <= 0) {
              clearInterval(unblurInterval);
              return 0;
            }
            return newValue;
          });
        }, 30);
      }, 50);
    }, 300); // Increased to allow for blur effect before changing image
  }, [images.length]);

  const previousImage = useCallback(() => {
    if (images.length === 0) return;
    
    // Start transition: fade out + blur
    setFadeIn(false);
    
    // Gradually increase blur during transition
    const blurInterval = setInterval(() => {
      setBlurAmount(prev => {
        const newValue = prev + 2;
        return newValue > 10 ? 10 : newValue;
      });
    }, 30);
    
    // Delay the actual image change to allow fade out and blur animation
    setTimeout(() => {
      setCurrentIndex((current) => (current - 1 + images.length) % images.length);
      
      // Clear the blur interval
      clearInterval(blurInterval);
      
      // Reset blur and fade in after a tiny delay
      setTimeout(() => {
        setFadeIn(true);
        
        // Gradually decrease blur after changing the image
        const unblurInterval = setInterval(() => {
          setBlurAmount(prev => {
            const newValue = prev - 2;
            if (newValue <= 0) {
              clearInterval(unblurInterval);
              return 0;
            }
            return newValue;
          });
        }, 30);
      }, 50);
    }, 300); // Increased to allow for blur effect before changing image
  }, [images.length]);

  // Auto-advance images with smooth transition
  useEffect(() => {
    if (images.length === 0) return;
    
    // Set the interval for auto-advancing images
    const timer = setInterval(() => {
      nextImage();
    }, interval);
    
    return () => clearInterval(timer);
  }, [interval, images.length, nextImage]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="animate-pulse text-white text-xs lg:text-sm">Loading gallery...</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <div className="text-white text-xs lg:text-sm">No images found</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative group overflow-hidden">
      {/* Full container - now fills the entire 16:9 parent container */}
      <div className="relative w-full h-full bg-black">
        {/* Image fills the entire container */}
        <div className="relative w-full h-full">
          <Image
            src={images[currentIndex]}
            alt={`Gallery image ${currentIndex + 1}`}
            fill
            sizes="100vw"
            className={`object-contain transition-all duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
              filter: `blur(${blurAmount}px)`
            }}
            priority
            onError={() => {
              console.warn(`Image at index ${currentIndex} failed to load. Skipping to next.`);
              nextImage();
            }}
          />
        </div>
        
        {/* Preload next image - hidden from view but loaded in the background */}
        {images.length > 1 && (
          <div className="hidden">
            <Image
              src={images[(currentIndex + 1) % images.length]}
              alt="Preloaded next image"
              width={1}
              height={1}
              priority
            />
            <Image
              src={images[(currentIndex + 2) % images.length]}
              alt="Preloaded next+1 image"
              width={1}
              height={1}
            />
          </div>
        )}
      </div>
      
      {/* Navigation controls - positioned relative to the full container */}
      <button 
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
        onClick={previousImage}
        aria-label="Previous image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 lg:w-5 lg:h-5 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <button 
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
        onClick={nextImage}
        aria-label="Next image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4 lg:w-5 lg:h-5 text-white">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
} 