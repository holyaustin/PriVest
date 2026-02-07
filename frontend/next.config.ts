/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ✅ This is the key setting
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✅ Optional: Also ignore TypeScript errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;