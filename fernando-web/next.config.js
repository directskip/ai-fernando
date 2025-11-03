/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Note: There's a circular dependency warning in Next.js 15's ESLint config
    // This is a known issue and doesn't affect functionality
    // The build will show a warning but will complete successfully
    ignoreDuringBuilds: false,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable development features in production
  reactStrictMode: true,
  // Suppress WebSocket warnings in production
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
