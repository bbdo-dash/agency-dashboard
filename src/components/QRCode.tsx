"use client";

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeProps {
  url: string;
  size?: number;
  className?: string;
}

export default function QRCodeComponent({ url, size = 60, className = "" }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setError(null);

    // Generate QR code
    QRCode.toCanvas(canvasRef.current, url, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    }).then(() => {
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error generating QR code:', error);
      setError('Failed to generate QR code');
      setIsLoading(false);
    });
  }, [url, size]);

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div 
          className="rounded border border-gray-200 shadow-sm bg-white flex items-center justify-center text-xs text-gray-500"
          style={{ width: size, height: size }}
        >
          QR
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: size, height: size }}>
      {isLoading && (
        <div 
          className="absolute inset-0 rounded border border-gray-200 shadow-sm bg-white flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
        </div>
      )}
      <canvas 
        ref={canvasRef}
        className="rounded border-2 border-white shadow-lg bg-white max-w-full max-h-full"
        style={{ 
          width: size, 
          height: size,
          maxWidth: size,
          maxHeight: size,
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </div>
  );
}
