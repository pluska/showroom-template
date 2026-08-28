// ============================================================================
// ZONAS DE LA FASE 1 — cada zona es una celda de la cuadrícula de la fase
// ----------------------------------------------------------------------------
// La Fase 1 se ve de dos maneras encadenadas: primero su toma completa
// (`FASE 1.jpg`), donde cada zona lleva su rótulo y se entra pulsándolo, y
// después la toma de la zona a pantalla completa, donde el visitante se
// desplaza a las contiguas con chevrons. Cada posición de la cuadrícula ES una
// zona: una toma completa.
//
//        col 0            col 1
//   ┌────────────────┬────────────────┐
//   │     Zona 1     │     Zona 3     │  fila 0
//   ├────────────────┼────────────────┘
//   │     Zona 2     │                   fila 1
//   └────────────────┘
//
// DE DÓNDE SALE ESTA COLOCACIÓN: se comprobó recortando `FASE 1.jpg` en tres
// encuadres y comparándolos con las tomas entregadas. La Zona 1 es el tercio
// superior izquierdo (las casas con el parque y el área de piscinas, con la
// manzana de las torres asomando abajo a la derecha); la Zona 2 queda DEBAJO
// (el segundo grupo de casas y los lotes a su derecha); la Zona 3 queda a la
// DERECHA de la Zona 1 (la manzana de las torres y los lotes al este). Las tres
// tomas se solapan bastante porque el acercamiento es de ~1,5×.
//
// Antes de las tomas reales, la Zona 2 estaba puesta arriba a la derecha y la
// Zona 3 abajo a la izquierda —los archivos llegaban todos nombrados `F1.Z1.*`
// y el número de zona no se podía deducir del nombre—. Con las imágenes buenas
// el orden queda fijado por lo que se ve en ellas, no por el nombre.
//
// Los chevrons NO se declaran: `getAvailableDirections()` los deduce de qué
// vecinas existen. Si mañana una fase es 3×3 o tiene forma de L, solo cambia
// esta lista.
// ============================================================================

import { zoneImage } from './assets';
import {
  PhaseId,
  PhaseStatus,
  ProductKind,
  TowerId,
  ViewSlot,
  ZoneElementKind,
  ZoneId,
} from './enums';
import type { Zone, ZoneCoords } from './types';

/** Posición de cada celda 2×2 dentro de la cuadrícula de la fase. */
const SLOT_COORDS: Record<ViewSlot, ZoneCoords> = {
  [ViewSlot.TOP_LEFT]: { row: 0, col: 0 },
  [ViewSlot.TOP_RIGHT]: { row: 0, col: 1 },
  [ViewSlot.BOTTOM_LEFT]: { row: 1, col: 0 },
  [ViewSlot.BOTTOM_RIGHT]: { row: 1, col: 1 },
};

/** Qué celda ocupa cada zona. Ver el encabezado. */
const ZONE_SLOTS: Record<ZoneId, ViewSlot> = {
  [ZoneId.ZONE_1]: ViewSlot.TOP_LEFT,
  [ZoneId.ZONE_2]: ViewSlot.BOTTOM_LEFT,
  [ZoneId.ZONE_3]: ViewSlot.TOP_RIGHT,
  [ZoneId.ZONE_4]: ViewSlot.BOTTOM_RIGHT,
};

/**
 * Dónde cae el rótulo y el recorte de cada zona sobre la toma de la Fase 1.
 * Trazados con la herramienta de coordenadas sobre `FASE 1.jpg`.
 */
const ZONE_HOTSPOTS: Partial<Record<ZoneId, Zone['hotspot']>> = {
  [ZoneId.ZONE_1]: {
    x: 31.3,
    y: 28.2,
    path: 'M 16.2 52.3 L 22.5 48.5 L 47.7 42.3 L 47.9 10.0 L 16.1 9.9 Z',
    paths: [
      'M 16.1 52.3 L 16.1 9.2 L 22.2 9.5 L 22.7 48.8 Z',
      'M 31.1 46.8 L 31.0 27.4 L 23.7 27.7 L 23.9 48.9 Z',
      'M 32.3 46.2 L 31.9 8.7 L 39.1 8.8 L 39.5 44.5 Z',
      'M 47.5 25.8 L 40.7 26.0 L 40.7 44.4 L 47.8 42.3 Z',
    ],
    blockHotspots: [
      { x: 19.2, y: 30.2, path: 'M 16.1 52.3 L 16.1 9.2 L 22.2 9.5 L 22.7 48.8 Z' },
      { x: 27.4, y: 37.7, path: 'M 31.1 46.8 L 31.0 27.4 L 23.7 27.7 L 23.9 48.9 Z' },
      { x: 35.7, y: 27.1, path: 'M 32.3 46.2 L 31.9 8.7 L 39.1 8.8 L 39.5 44.5 Z' },
      { x: 44.1, y: 34.7, path: 'M 47.5 25.8 L 40.7 26.0 L 40.7 44.4 L 47.8 42.3 Z' },
    ],
  },
  [ZoneId.ZONE_2]: {
    x: 37.9,
    y: 68.3,
    path: 'M 47.8 49.1 L 23.9 55.2 L 24.4 74.1 L 27.4 75.8 L 35.9 75.8 L 35.9 89.8 L 48.2 89.7 Z',
    paths: [
      'M 24.0 55.6 L 31.0 53.7 L 31.4 75.1 L 27.5 75.4 L 24.2 74.0 Z',
      'M 39.3 51.1 L 39.7 75.3 L 32.7 75.7 L 32.5 53.1 Z',
      'M 47.9 49.0 L 40.7 51.2 L 41.1 75.5 L 48.2 75.3 Z',
      'M 48.1 89.6 L 48.1 77.3 L 35.9 77.9 L 36.1 89.6 Z',
    ],
    blockHotspots: [
      { x: 27.7, y: 64.9, path: 'M 24.0 55.6 L 31.0 53.7 L 31.4 75.1 L 27.5 75.4 L 24.2 74.0 Z' },
      { x: 36.1, y: 63.8, path: 'M 39.3 51.1 L 39.7 75.3 L 32.7 75.7 L 32.5 53.1 Z' },
      { x: 44.5, y: 62.7, path: 'M 47.9 49.0 L 40.7 51.2 L 41.1 75.5 L 48.2 75.3 Z' },
      { x: 42.1, y: 83.6, path: 'M 48.1 89.6 L 48.1 77.3 L 35.9 77.9 L 36.1 89.6 Z' },
    ],
  },
  [ZoneId.ZONE_3]: {
    x: 60.8,
    y: 35,
    path: 'M 71.9 40.4 L 71.8 28.6 L 49.5 29.5 L 49.9 41.4 Z',
    paths: [
      'M 70.7 36.8 L 70.6 32.1 L 64.4 32.5 L 64.5 36.9 Z',
      'M 63.6 37.0 L 63.5 32.4 L 57.4 32.6 L 57.5 36.9 Z',
      'M 56.6 37.2 L 56.5 32.3 L 50.5 32.8 L 50.5 37.4 Z',
    ],
    blockHotspots: [
      { x: 67.6, y: 34.6, path: 'M 70.7 36.8 L 70.6 32.1 L 64.4 32.5 L 64.5 36.9 Z' },
      { x: 60.5, y: 34.7, path: 'M 63.6 37.0 L 63.5 32.4 L 57.4 32.6 L 57.5 36.9 Z' },
      { x: 53.6, y: 34.9, path: 'M 56.6 37.2 L 56.5 32.3 L 50.5 32.8 L 50.5 37.4 Z' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Elementos de las zonas
// ---------------------------------------------------------------------------
// Un elemento es una manzana / polígono clicable dentro de la toma de la zona.
// Los de abajo son el esqueleto de los tres casos que describió el cliente
// (solo casas, solo torres, casas + amenidades).
//
// PENDIENTE: los elementos de casas y amenidades siguen con `x`, `y` y `path`
// de relleno. Las coordenadas reales se trazan sobre las imágenes con el editor
// de polígonos del dashboard (`PathBuilder`), igual que se hizo con las plantas
// de Océano.
// ---------------------------------------------------------------------------

/**
 * La manzana de los tres edificios, en la **Zona 3**: es la única zona cuya
 * toma la encuadra entera. También asoma por la esquina inferior derecha de la
 * Zona 1, pero cortada, y una manzana a medias no se puede recortar bien.
 */
const zone3Elements: Zone['elements'] = [
  {
    id: 'f1-z3-torres',
    zoneId: ZoneId.ZONE_3,
    label: 'Torres El Olimpo de Tumbes',
    kind: ZoneElementKind.TOWERS_ONLY,
    contents: [ProductKind.TOWER],
    towerIds: [TowerId.TOWER_A, TowerId.TOWER_B, TowerId.TOWER_C],
    hotspot: {
      x: 26.9,
      y: 50.5,
      path: 'M 44.9 59.5 L 45.0 41.5 L 9.2 41.0 L 9.0 59.9 Z',
      paths: [
        'M 43.1 54.2 L 43.1 46.1 L 32.5 46.0 L 32.5 54.1 Z',
        'M 30.9 54.2 L 30.9 46.0 L 20.2 46.0 L 20.2 54.3 Z',
        'M 18.6 53.9 L 18.6 46.1 L 8.2 46.0 L 8.0 54.2 Z',
      ],
      blockHotspots: [
        { x: 37.8, y: 50.1, path: 'M 43.1 54.2 L 43.1 46.1 L 32.5 46.0 L 32.5 54.1 Z' },
        { x: 25.5, y: 50.1, path: 'M 30.9 54.2 L 30.9 46.0 L 20.2 46.0 L 20.2 54.3 Z' },
        { x: 13.3, y: 50.1, path: 'M 18.6 53.9 L 18.6 46.1 L 8.2 46.0 L 8.0 54.2 Z' },
      ],
    },
  },
];

const zone1Elements: Zone['elements'] = [
  {
    id: 'f1-z1-casas-1',
    zoneId: ZoneId.ZONE_1,
    label: 'Manzana de casas 1',
    kind: ZoneElementKind.HOUSES_ONLY,
    contents: [ProductKind.HOUSE],
    houseIds: [],
    hotspot: { x: 0, y: 0 }, // PENDIENTE: polígono real
  },
  {
    id: 'f1-z1-casas-amenidades',
    zoneId: ZoneId.ZONE_1,
    label: 'Casas y amenidades',
    kind: ZoneElementKind.MIXED,
    contents: [ProductKind.HOUSE, ProductKind.AMENITY],
    houseIds: [],
    amenityIds: [],
    hotspot: { x: 0, y: 0 }, // PENDIENTE: polígono real
  },
];

// ---------------------------------------------------------------------------
// Zonas de la Fase 1
// ---------------------------------------------------------------------------
// Las tres entregadas tienen toma. La Zona 4 no entra en esta etapa y por eso
// no se declara: no se puede llegar a ella. De los elementos clicables, el
// único con destino construido es la manzana de torres, en la Zona 3; el resto
// llega cuando el cliente confirme qué manzana es qué.

const ZONE_ORDER = [ZoneId.ZONE_1, ZoneId.ZONE_2, ZoneId.ZONE_3, ZoneId.ZONE_4];

/** Qué elementos clicables tiene cada zona. Las que faltan, ninguno todavía. */
const ZONE_ELEMENTS: Partial<Record<ZoneId, Zone['elements']>> = {
  [ZoneId.ZONE_1]: zone1Elements,
  [ZoneId.ZONE_3]: zone3Elements,
};

/**
 * Zonas que NO entran en esta etapa. No se declaran: se quedan FUERA de la
 * cuadrícula de la fase, así que el desplazamiento hacia ellas queda
 * bloqueado. No hace falta ninguna comprobación en la UI —el chevron
 * desaparece solo, porque `getAvailableDirections()` solo pinta flecha donde
 * hay vecina— ni ningún cartel: para el visitante, ese borde es el final del
 * recorrido, igual que los otros tres.
 *
 * Con la Zona 4 fuera, la cuadrícula de la Fase 1 deja de ser 2×2 y queda en
 * L. Eso ya estaba previsto y no toca ni la navegación ni el componente:
 *
 *        col 0        col 1
 *   ┌────────────┬────────────┐
 *   │   Zona 1   │   Zona 3   │  fila 0
 *   ├────────────┼────────────┘
 *   │   Zona 2   │              fila 1
 *   └────────────┘
 *
 * Sumar la Zona 4 en la siguiente etapa es sacarla de esta lista y darle su
 * toma; su celda ya está declarada en `ZONE_SLOTS`.
 */
const ZONES_NOT_IN_THIS_STAGE: ZoneId[] = [ZoneId.ZONE_4];

export const phase1Zones: Zone[] = ZONE_ORDER.filter(
  (id) => !ZONES_NOT_IN_THIS_STAGE.includes(id),
).map((id, index) => {
  const slot = ZONE_SLOTS[id];

  return {
    id,
    phaseId: PhaseId.PHASE_1,
    order: index,
    status: PhaseStatus.AVAILABLE,
    slot,
    ...SLOT_COORDS[slot],
    image: zoneImage(PhaseId.PHASE_1, id),
    hotspot: ZONE_HOTSPOTS[id],
    elements: ZONE_ELEMENTS[id] ?? [],
  };
});
