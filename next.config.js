/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  serverComponentsExternalPackages: [
    'firebase',
    '@firebase/auth',
    '@firebase/firestore',
    '@firebase/storage',
    'undici',
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;