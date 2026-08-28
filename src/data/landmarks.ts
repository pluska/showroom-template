/**
 * Hitos: the surroundings that get their own raised marker on the location
 * map, each one with a vertical clip the visitor can open.
 *
 * They are deliberately static. Unlike the POIs — which the dashboard can
 * edit — these are tied to footage we shot for them, so a row without a
 * matching video would render an empty player.
 *
 * `poiName` is the name of the equivalent point in the POI layer; the map
 * hides it so the place is not pinned twice.
 */
export interface Landmark {
  slug: string;
  name: string;
  category: string;
  coordinates: [number, number]; // [lng, lat]
  poster: string;
  preview: string; // short muted loop shown on hover
  video: string; // full clip with audio, opened from "Ver más"
  poiName?: string;
}

export const asset = (slug: string, file: string) => `location/videos/hitos/${slug}/${file}`;

// Las cinco tomas verticales que entregó el cliente (FASES/VIDEO HITOS). El
// original venía en HEVC 1080×1920 a 60 fps, que Chrome y Firefox no
// reproducen de forma fiable: en R2 está reencodado a H.264 30 fps.
//
//   location/videos/hitos/<slug>/full.mp4     clip completo, con audio
//   location/videos/hitos/<slug>/preview.mp4  bucle mudo de 6 s, 540×960
//   location/videos/hitos/<slug>/poster.webp  fotograma fijo, 540×960
//
// `coordinates` y `category` se copian del POI equivalente del geojson del
// cliente (src/data/olimpo_tumbes_locations.json) para que el hito caiga en el
// mismo punto que caía antes y siga en su misma categoría del mapa. `name` es
// el título que trae el propio vídeo, que no siempre coincide con el nombre
// del POI ("Plaza Mayor de Tumbes" / "Plaza de Armas"): por eso `poiName` va
// aparte, y tiene que coincidir EXACTO con el `nombre` del POI para que el
// mapa no pinche el sitio dos veces.
//
// PENDIENTE (Olimpo): confirmar con el cliente el punto del Zoocriadero. Su
// vídeo no tiene POI homónimo en el geojson; el zoocriadero de cocodrilos de
// Tumbes está dentro del Centro de Acuicultura "La Tuna Carranza", en Puerto
// Pizarro, así que se ancla ahí. Si el cliente da otro punto, se cambian estas
// dos líneas y nada más.
export const landmarks: Landmark[] = [
  {
    slug: 'aeropuerto',
    name: 'Aeropuerto de Tumbes',
    category: 'Servicios Esenciales',
    coordinates: [-80.384104, -3.549519],
    poster: asset('aeropuerto', 'poster.webp'),
    preview: asset('aeropuerto', 'preview.mp4'),
    video: asset('aeropuerto', 'full.mp4'),
    poiName: 'Aeropuerto',
  },
  {
    slug: 'zorritos',
    name: 'Balneario de Zorritos',
    category: 'Turismo y Naturaleza',
    coordinates: [-80.676611, -3.677821],
    poster: asset('zorritos', 'poster.webp'),
    preview: asset('zorritos', 'preview.mp4'),
    video: asset('zorritos', 'full.mp4'),
    poiName: 'Playa Zorritos',
  },
  {
    slug: 'costa-mar-plaza',
    name: 'Costa Mar Plaza',
    category: 'Servicios Esenciales',
    coordinates: [-80.457395, -3.568045],
    poster: asset('costa-mar-plaza', 'poster.webp'),
    preview: asset('costa-mar-plaza', 'preview.mp4'),
    video: asset('costa-mar-plaza', 'full.mp4'),
    poiName: 'Costa Mar Plaza',
  },
  {
    slug: 'plaza-de-armas',
    name: 'Plaza Mayor de Tumbes',
    category: 'Turismo y Naturaleza',
    coordinates: [-80.459632, -3.570838],
    poster: asset('plaza-de-armas', 'poster.webp'),
    preview: asset('plaza-de-armas', 'preview.mp4'),
    video: asset('plaza-de-armas', 'full.mp4'),
    poiName: 'Plaza de Armas',
  },
  {
    slug: 'zoocriadero',
    name: 'Zoocriadero de Cocodrilos',
    category: 'Turismo y Naturaleza',
    coordinates: [-80.395565, -3.509923],
    poster: asset('zoocriadero', 'poster.webp'),
    preview: asset('zoocriadero', 'preview.mp4'),
    video: asset('zoocriadero', 'full.mp4'),
    poiName: 'Centro de Acuicultura Tuna Carranza',
  },
];

export const landmarkPoiNames = new Set(
  landmarks.map(l => l.poiName).filter(Boolean) as string[]
);
