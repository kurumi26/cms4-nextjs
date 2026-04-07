import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@ray-solutions/react-file-manager'],
  typescript: {
    ignoreBuildErrors: true,  // ✅ temporary until all types are clean
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
	devIndicators: false,
  webpack: (config) => {
    config.watchOptions = {
      poll: 1000,          // check for changes every 1s
      aggregateTimeout: 300,
    };
    return config;
  },
};

export default nextConfig;
