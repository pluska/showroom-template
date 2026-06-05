import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
  experimental: {
    proxyClientMaxBodySize: 100 * 1024 * 1024, // 100MB
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
};

if (process.env.NODE_ENV === 'development') {
  import('@cloudflare/next-on-pages/next-dev')
    .then(({ setupDevPlatform }) => setupDevPlatform())
    .catch((err) => console.error('Error in setupDevPlatform:', err));
}

export default nextConfig;
