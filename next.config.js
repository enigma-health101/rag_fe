/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://rag-api.enigmahealth.io/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://rag-api.enigmahealth.io', // Also fix WebSocket to use secure
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle socket.io client issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  images: {
    domains: ['localhost'],
  },
  // async headers() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       headers: [
  //         { key: 'Access-Control-Allow-Credentials', value: 'true' },
  //         { key: 'Access-Control-Allow-Origin', value: '*' },
  //         { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
  //         { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
  //       ],
  //     },
  //   ];
  // },
};

module.exports = nextConfig;