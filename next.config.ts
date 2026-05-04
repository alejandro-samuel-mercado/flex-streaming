import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:4000';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy API calls to the backend (needed in production/VPS deployments)
      {
        source: '/api/:path*',
        destination: `${BACKEND_URL}/api/:path*`,
      },
      // Proxy media files (thumbnails, subtitles) — HLS segments go through /api/stream
      {
        source: '/media/:path*',
        destination: `${BACKEND_URL}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
