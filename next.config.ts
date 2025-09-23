import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable image optimization to avoid domain/format blocking (keeps behavior consistent with next.config.js)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'www.horizont.net',
      },
      {
        protocol: 'https',
        hostname: 'horizont.net',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
    ],
  },
};

export default nextConfig;
