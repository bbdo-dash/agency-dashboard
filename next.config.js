/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  images: {
    // Allow images from all domains without checking - this disables optimization but fixes all domain errors
    unoptimized: true,
    
    // Original configuration with specific domains - commented out but kept for reference
    /* remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'd.ibtimes.com',
      },
      {
        protocol: 'https',
        hostname: 'www.reuters.com',
      },
      {
        protocol: 'https',
        hostname: 'media.cnn.com',
      },
      {
        protocol: 'https',
        hostname: 'static.foxnews.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.cnn.com',
      },
      {
        protocol: 'https',
        hostname: 'static01.nyt.com',
      },
      {
        protocol: 'https',
        hostname: 'img.huffingtonpost.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.bwbx.io',
      },
      {
        protocol: 'https',
        hostname: 'nypost.com',
      },
      {
        protocol: 'https',
        hostname: 'cbsnews.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.vogue.com',
      },
      {
        protocol: 'https',
        hostname: 'i.guim.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'ichef.bbci.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'media.vanityfair.com',
      },
      {
        protocol: 'https',
        hostname: 'media.wmagazine.com',
      },
      {
        protocol: 'https',
        hostname: 'footwearnews.com',
      },
      {
        protocol: 'https',
        hostname: 'wwd.com',
      },
      {
        protocol: 'https',
        hostname: 's.yimg.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'static.politico.com',
      },
      {
        protocol: 'https',
        hostname: 'a57.foxnews.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.bleacherreport.net',
      },
      {
        protocol: 'https',
        hostname: 'static.independent.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'static.standard.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'media.npr.org',
      },
      {
        protocol: 'https',
        hostname: 'img.bleacherreport.net',
      },
      {
        protocol: 'https',
        hostname: 'static.people.com',
      },
      {
        protocol: 'https',
        hostname: 'people.com',
      },
      {
        protocol: 'https',
        hostname: 'variety.com',
      },
      {
        protocol: 'https',
        hostname: 'media-cldnry.s-nbcnews.com',
      },
      {
        protocol: 'https',
        hostname: 'media.gettyimages.com',
      },
      {
        protocol: 'https',
        hostname: 'npr.brightspotcdn.com',
      },
      {
        protocol: 'http',
        hostname: 'npr-brightspot.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'gsp-image-cdn.wmsports.io',
      },
      {
        protocol: 'https',
        hostname: 'www.politico.eu',
      },
      {
        protocol: 'https',
        hostname: 'dims.apnews.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.apnews.com',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        protocol: 'https',
        hostname: 'www.politico.com',
      },
      {
        protocol: 'https',
        hostname: 'image.cnbcfm.com',
      },
    ], */
  },
  experimental: {
    turbo: {
      rules: {
        // Configure Turbopack
      }
    }
  }
};

module.exports = nextConfig; 