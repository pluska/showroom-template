/**
 * Hitos: the surroundings that get their own raised marker on the location
 * map, each one with a vertical clip the visitor can open.
 *
 * They are deliberately static. Unlike the POIs — which the dashboard can
 * edit — these are tied to footage shot for them, so a row without a matching
 * video would render an empty player.
 *
 * `poiName` is the name of the equivalent point in the POI layer; the map
 * hides it so the place is not pinned twice, and it has to match the POI's
 * `nombre` EXACTLY.
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

// RELLENAR: one entry per hito the project has footage for. Leave the array
// empty and the location map simply renders no raised markers — the rest of
// the POI layer works either way.
//
// Each slug expects three files in R2, under the path `asset()` builds:
//
//   location/videos/hitos/<slug>/full.mp4     full clip, with audio
//   location/videos/hitos/<slug>/preview.mp4  muted ~6 s loop, 540×960
//   location/videos/hitos/<slug>/poster.webp  still frame, 540×960
//
// Encode the clips as H.264 30 fps. Vertical footage often arrives as HEVC at
// 60 fps, which Chrome and Firefox do not play reliably.
//
// Copy `coordinates` and `category` from the equivalent POI in the project's
// locations file so the hito lands on the same point and stays in its map
// category.
//
// Example of a filled-in entry:
//
//   {
//     slug: 'plaza-principal',
//     name: 'Plaza Principal',
//     category: 'Turismo y Naturaleza',
//     coordinates: [-77.0428, -12.0464],
//     poster: asset('plaza-principal', 'poster.webp'),
//     preview: asset('plaza-principal', 'preview.mp4'),
//     video: asset('plaza-principal', 'full.mp4'),
//     poiName: 'Plaza Principal',
//   },
export const landmarks: Landmark[] = [];

export const landmarkPoiNames = new Set(
  landmarks.map(l => l.poiName).filter(Boolean) as string[]
);
