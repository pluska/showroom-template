// PLANTILLA: cada proyecto tiene SU bucket. Se deja vacío a propósito — con
// base vacía las claves se resuelven contra `public/`, que es un fallo visible
// (imagen rota) en vez de uno silencioso apuntando al bucket de otro cliente.
// Se rellena con NEXT_PUBLIC_R2_PUBLIC_URL en .env, no aquí.
const DEFAULT_R2_PUBLIC_URL = '';
const ASSET_BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || DEFAULT_R2_PUBLIC_URL;
// Rompe la caché del navegador cuando se reemplaza el CONTENIDO de una clave
// que YA estaba en el bucket: la URL no cambia, así que sin esto el visitante
// seguiría viendo la copia vieja.
//
// NO se edita a mano — es justo el paso que se olvida, y el fallo resultante
// (el cliente ve la imagen anterior) no se distingue de un problema de caché
// suyo. Se sube con:
//
//     npm run assets:bump
//
// que reescribe la constante de abajo con la fecha de hoy. NEXT_PUBLIC_ASSET_VERSION
// la pisa desde el entorno, para romper la caché en un despliegue sin tocar código.
//
// La versión es GLOBAL: al subirla se revalida todo el media, no solo lo que
// cambió. Es el precio de tener un solo número; la alternativa —claves con
// hash del contenido— exige rehacer el pipeline de subida a R2.
const DEFAULT_ASSET_VERSION = '20260101-1'; // gestionado por scripts/bump-asset-version.mjs
const ASSET_VERSION = `v=${process.env.NEXT_PUBLIC_ASSET_VERSION || DEFAULT_ASSET_VERSION}`;


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

