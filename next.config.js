/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure Webpack to handle Phaser
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Phaser expects these to be available in the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  
  // Experimental features
  experimental: {
    // Enable Server Actions if needed in future
    serverActions: true,
  },
};

module.exports = nextConfig;
