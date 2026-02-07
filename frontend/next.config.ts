// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  
  // OR allow building without Google Fonts
  experimental: {
    optimizeCss: true,
  },
  
  // Handle webpack warnings
  webpack: (config, { isServer }) => {
    // Ignore pino-pretty warning for production
    config.ignoreWarnings = [
      { module: /node_modules\/pino\/lib\/tools.js/ },
      { module: /node_modules\/@walletconnect\/ethereum-provider/ },
    ];
    
    return config;
  },
  
  // Skip type checking during build for speed
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Skip linting during build
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;