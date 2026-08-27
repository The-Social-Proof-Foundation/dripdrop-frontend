/** @type {import('next').NextConfig} */
const backendUrl =
  process.env.DRIPDROP_API_URL ||
  process.env.NEXT_PUBLIC_DRIPDROP_API_URL ||
  'http://127.0.0.1:5050'

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${backendUrl.replace(/\/$/, '')}/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        // Apply CORS headers to API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  serverExternalPackages: ['resend'],
  transpilePackages: ['@socialproof/myso'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    return config
  },
  experimental: {
    optimizePackageImports: ['@splinetool/runtime', '@socialproof/myso'],
  },
};

module.exports = nextConfig;
