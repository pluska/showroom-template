import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['react-map-gl', 'mapbox-gl'],
};

if (process.env.NODE_ENV === 'development') {
  import('@cloudflare/next-on-pages/next-dev')
    .then(({ setupDevPlatform }) => setupDevPlatform())
    .catch((err) => console.error('Error in setupDevPlatform:', err));
}

export default nextConfig;
