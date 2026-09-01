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

// El proyecto se construye con @opennextjs/cloudflare (ver `build:worker`), y
// todo el código lee los bindings con `getCloudflareContext`. El arranque de
// dev tiene que ser el de OpenNext: `setupDevPlatform` de next-on-pages monta
// el contexto de la otra librería (`getRequestContext`), así que en `next dev`
// los bindings —D1 y R2— quedaban sin poblar y cada lectura caía al fallback.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

export default nextConfig;
