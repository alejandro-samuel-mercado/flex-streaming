import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'http://localhost:4000/media/:path*',
      },
    ];
  },
};

export default nextConfig;
