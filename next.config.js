/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  // 🔥 Important: In packages ko Node.js environment mein bahar rakhna
  serverExternalPackages: [
    'firebase',
    '@firebase/auth',
    '@firebase/firestore',
    '@firebase/storage',
    'undici',
  ],
  webpack: (config, { isServer }) => {
    // Client-side fallbacks (pehle se theek hai)
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