import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images — no CDN needed in Docker dev
  images: {
    unoptimized: true,
  },

  // Faster server actions
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  async redirects() {
    return [
      {
        source: '/projects/:id/agile',
        destination: '/projects/:id/agile/requirements',
        permanent: false,
      },
      {
        source: '/projects/:id/architecture',
        destination: '/projects/:id/architecture/system-design',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
