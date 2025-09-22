import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
    ],
  },
};

export default nextConfig;
