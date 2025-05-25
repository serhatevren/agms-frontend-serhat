import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['localhost', 'agolu-agms-backend.onrender.com', 'iztech-agms.vercel.app'],
  },
};

export default nextConfig;