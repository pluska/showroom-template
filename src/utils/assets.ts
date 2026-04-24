const ASSET_BASE_URL = process.env.NEXT_PUBLIC_ASSET_BASE_URL || '';

export const getAssetUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  // Ensure path doesn't start with slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${ASSET_BASE_URL}/${cleanPath}`;
};

export { assetManifest } from '../data/asset-manifest';
