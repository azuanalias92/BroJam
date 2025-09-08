import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname,
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/:locale/manifest.json',
        destination: '/manifest.json',
      },
      {
        source: '/:locale/favicon.svg',
        destination: '/favicon.svg',
      },
      {
        source: '/:locale/icon-192.svg',
        destination: '/icon-192.svg',
      },
      {
        source: '/:locale/icon-512.svg',
        destination: '/icon-512.svg',
      },
    ];
  },
};

export default nextConfig;
