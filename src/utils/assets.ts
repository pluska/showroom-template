// PLANTILLA: cada proyecto tiene SU bucket. Se deja vacío a propósito — con
// base vacía las claves se resuelven contra `public/`, que es un fallo visible
// (imagen rota) en vez de uno silencioso apuntando al bucket de otro cliente.
// Se rellena con NEXT_PUBLIC_R2_PUBLIC_URL en .env, no aquí.
const DEFAULT_R2_PUBLIC_URL = '';
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || DEFAULT_R2_PUBLIC_URL;
// Sube cada vez que se reemplaza el CONTENIDO de una clave que YA estaba en el
// bucket: la URL no cambia, así que sin esto el navegador seguiría sirviendo la
// copia vieja. Convención: v=<AAAAMMDD>-<n>.
const ASSET_VERSION = 'v=20260101-1';


export const getAssetUrl = (path: string): string => {
  if (!path) return '';
  // Rutas del proxy same-origin (dev) y data URIs se sirven tal cual
  if (path.startsWith('/api/') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  
  let cleanPath = path;
  
  // Limpiar dominios conocidos para obtener la ruta/clave relativa
  if (cleanPath.startsWith(DEFAULT_R2_PUBLIC_URL)) {
    cleanPath = cleanPath.slice(DEFAULT_R2_PUBLIC_URL.length);
  }
  
  const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (r2PublicUrl && cleanPath.startsWith(r2PublicUrl)) {
    cleanPath = cleanPath.slice(r2PublicUrl.length);
  }
  
  if (cleanPath.startsWith('http')) return cleanPath;
  
  // Ensure path doesn't start with slash
  const cleanPathNoSlash = cleanPath.startsWith('/') ? cleanPath.slice(1) : cleanPath;
  
  const separator = cleanPathNoSlash.includes('?') ? '&' : '?';
  return `${ASSET_BASE_URL}/${cleanPathNoSlash}${separator}${ASSET_VERSION}`;
};

// URL segura para cargar medios dentro de un canvas (Konva/toDataURL).
// El canvas exige same-origin o CORS; el dominio público de R2 no envía CORS
// para todos los orígenes, así que se enruta por el proxy /api/r2 de la app.
export const getCanvasImageUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('/api/')) {
    return path;
  }
  let key = path;
  if (ASSET_BASE_URL && key.startsWith(ASSET_BASE_URL)) key = key.slice(ASSET_BASE_URL.length);
  // URLs externas (p. ej. Unsplash) no se pueden proxear: se devuelven tal cual
  if (key.startsWith('http')) return key;
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  return `/api/r2/${cleanKey}`;
};

export { assetManifest } from '../data/asset-manifest';

