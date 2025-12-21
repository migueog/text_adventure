/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Turbopack configuration (Next.js 16+ default)
  turbopack: {
    resolveAlias: {
      // Phaser needs these to be false in browser
    }
  },
  
  // Configure Webpack as fallback
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
    serverActions: { bodySizeLimit: '2mb' },
  },
};

export default nextConfig;
