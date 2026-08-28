// ============================================================================
// TORRES — A, B y C, una al lado de la otra
// ----------------------------------------------------------------------------
// Reglas de recorrido (ver `navigation.ts`):
//   · Torre A → solo flecha derecha
//   · Torre B → flechas izquierda y derecha
//   · Torre C → solo flecha izquierda
//   · El salto lateral CONSERVA EL PISO: del piso 3 de la A se cae en el
//     piso 3 de la B. Si la torre destino no llega a ese piso, se ajusta al
//     más cercano (`findEquivalentFloor`).
//
// Dos maneras distintas de llegar a una torre, y conviene no confundirlas:
//
//   1. ENTRAR desde la toma de las tres (`ABC`): se reproduce `entryVideo` y
//      se aterriza en `entryLevel` — el piso en el que termina ese video.
//   2. PASAR de una torre a la de al lado: NO hay video y NO se vuelve al
//      piso de entrada; se conserva el piso actual.
//
// Nada de esto está codificado con "3 torres": todo sale de `order`.
// ============================================================================

import {
  APARTMENT_AREA_SQM,
  APARTMENT_BATHROOMS,
  APARTMENT_BEDROOMS,
  APARTMENT_TOUR_URL,
  apartmentTypeForUnitNumber,
} from './apartments';
import { apartmentGalleryImage, towerEntryVideo, towerFacadeImage, towerFloorPlanImage } from './assets';
import { TowerFloorKind, TowerFloorKindLabel, TowerId, UnitKind, UnitStatus, ZoneId } from './enums';
import type { Tower, TowerFloor, Unit, ZoneElementHotspot } from './types';

/** Plantas por torre. Confirmado por los archivos entregados: A1…A6, B1…B6, C1…C6. */
export const FLOORS_PER_TOWER = 6;

/**
 * La planta más alta es la AZOTEA: no tiene departamentos, solo la terraza y
 * las escaleras (se ve en `A6`, `B6` y `C6`). Se recorre como una más —tiene
 * su toma y su sitio en el selector— pero no genera unidades.
 *
 * Se deriva de `FLOORS_PER_TOWER` en vez de escribir un 6: si mañana la torre
 * crece un piso, la azotea sigue siendo la de arriba sin tocar nada.
 */
export const TERRACE_LEVEL = FLOORS_PER_TOWER;

/** Plantas con departamentos: todas menos la azotea. */
export const FLOORS_WITH_UNITS = FLOORS_PER_TOWER - 1;

/**
 * Piso en el que terminan los tres videos de acercamiento (`ABC-A5.mp4`, …).
 * Si mañana el cliente entrega animaciones que aterrizan en otro piso, se
 * cambia este número (o el `entryLevel` de la torre concreta) y ya está.
 */
export const TOWER_ENTRY_LEVEL = 5;

/** El orden lateral: índice 0 = torre más a la izquierda. */
export const towersOrder: TowerId[] = [TowerId.TOWER_A, TowerId.TOWER_B, TowerId.TOWER_C];

/** Elemento de la Zona 2 que agrupa a las tres torres. */
// Debe coincidir con el elemento declarado en `zones.ts`, que es el que la
// navegación hace clicable. Estuvo desincronizado ('f1-z2-torres' aquí,
// 'f1-z3-torres' allá) sin que se notara porque nadie leía este campo.
export const TOWERS_ELEMENT_ID = 'f1-z3-torres';

/**
 * Áreas clicables sobre `ABC.webp`, medidas sobre la propia imagen: las tres
 * torres ocupan una franja horizontal y cada una son dos bloques con la
 * escalera en medio. Coinciden con el destino de cada video de acercamiento
 * (A → izquierda, B → centro, C → derecha).
 */
const TOWER_HOTSPOTS: Record<TowerId, ZoneElementHotspot> = {
  [TowerId.TOWER_A]: {
    x: 18.8,
    y: 52.9,
    path: 'M 32.2 62.6 L 32.4 42.5 L 20.8 42.2 L 20.7 50.1 L 17.2 50.0 L 17.4 42.6 L 5.7 42.6 L 5.0 62.7 L 16.8 63.0 L 16.8 61.2 L 20.4 61.2 L 20.5 62.7 Z',
  },
  [TowerId.TOWER_B]: {
    x: 50.1,
    y: 52.7,
    path: 'M 63.5 62.5 L 63.3 42.4 L 51.8 42.2 L 51.8 49.6 L 48.3 49.7 L 48.2 42.6 L 36.8 42.6 L 36.5 62.6 L 48.1 62.5 L 48.0 61.1 L 51.9 61.1 L 51.8 62.5 Z',
  },
  [TowerId.TOWER_C]: {
    x: 81.1,
    y: 52.6,
    path: 'M 94.8 62.4 L 83.2 62.8 L 83.0 61.2 L 79.5 61.2 L 79.5 62.2 L 67.9 62.5 L 67.4 42.2 L 79.0 42.1 L 79.2 49.7 L 83.0 49.6 L 82.6 42.2 L 94.2 42.2 Z',
  },
};

// ---------------------------------------------------------------------------
// Departamentos: cuatro por planta, iguales en todas
// ---------------------------------------------------------------------------
// La planta son dos bloques con la escalera en medio, y cada bloque se parte
// en dos departamentos: cuatro por piso. La numeración es la que marcó el
// cliente sobre el render:
//
//        ┌───────────────┬───────────────┐
//        │       4       │       3       │   (fondo)
//        ├───────────────┼───────────────┤
//        │       1       │       2       │   (frente)
//        └───────────────┴───────────────┘
//              bloque izq.     bloque der.
//
// Los recortes se midieron sobre las propias imágenes (perfil de luminosidad
// de los muros, no a ojo) y van en porcentaje 0–100, así que valen a cualquier
// resolución. Un solo juego sirve para las 72 unidades: se comprobó que las
// seis plantas de una torre —y las tres torres entre sí— comparten encuadre y
// distribución exactos; la diferencia entre A1 y A5, o entre A1 y B1, está
// toda fuera del edificio (vegetación, vecinos), nunca dentro.

/** Departamentos por planta con departamentos. Sale de la lista, no de una constante suelta. */
export const UNITS_PER_FLOOR = 4;

interface UnitSlot {
  /** Número dentro de la planta: 101 es el 1 del piso 1. */
  number: number;
  /** Centro del rótulo, en % de la imagen. */
  x: number;
  y: number;
  /** Recorte clicable: atributo `d` de SVG en espacio 0–100. */
  path: string;
}

const SHARED_UNIT_SLOTS: UnitSlot[] = [
  { number: 1, x: 29.2, y: 63.8, path: 'M 45.1 49.8 L 44.9 77.5 L 13.1 77.8 L 13.9 50.0 Z' },
  { number: 2, x: 70.6, y: 63.7, path: 'M 86.7 77.2 L 86.0 49.9 L 54.7 49.9 L 55.1 77.6 Z' },
  { number: 3, x: 70.1, y: 36.7, path: 'M 85.7 49.7 L 85.1 23.5 L 54.9 23.5 L 54.8 49.8 Z' },
  { number: 4, x: 29.8, y: 36.7, path: 'M 45.2 49.9 L 45.5 23.5 L 14.6 23.3 L 13.9 50.0 Z' },
];

const TOWER_UNIT_SLOTS: Record<TowerId, UnitSlot[]> = {
  [TowerId.TOWER_A]: SHARED_UNIT_SLOTS,
  [TowerId.TOWER_B]: SHARED_UNIT_SLOTS,
  [TowerId.TOWER_C]: SHARED_UNIT_SLOTS,
};

/**
 * Código comercial del departamento: piso + número dentro del piso, con el
 * número a dos cifras. Piso 1 → 101…104; piso 6 → 601…604.
 *
 * No lleva la letra de la torre porque las tres numeran igual y la torre ya
 * está a la vista en la cabecera ("Torre A · Piso 5"). Si el cliente prefiere
 * "A-101", se antepone aquí y cambia en los 72 sitios a la vez.
 */
export const buildUnitIdentifier = (level: number, number: number): string =>
  `${level}${String(number).padStart(2, '0')}`;

/** Cantidad de fotos de la galería interior por departamento (1 a 8). */
export const APARTMENT_GALLERY_COUNT = 8;

/**
 * Galería de fotos del departamento según su piso y número de unidad (1 a 4).
 * - Unidades x01: reciben galería DEPA x01.
 * - Unidades x04: reciben galería DEPA x04.
 * - Unidades x02 y x03: de momento comparten la galería del piso.
 */
export const apartmentGalleryForUnit = (level: number, slotNumber: number = 1): string[] =>
  Array.from({ length: APARTMENT_GALLERY_COUNT }, (_, i) =>
    apartmentGalleryImage(level, i + 1, slotNumber),
  );

/** Alias para mantener retrocompatibilidad */
export const apartmentGalleryForFloor = (level: number): string[] =>
  apartmentGalleryForUnit(level, 1);

const buildUnits = (towerId: TowerId, floorId: string, level: number): Unit[] => {
  const slots = TOWER_UNIT_SLOTS[towerId] ?? SHARED_UNIT_SLOTS;

  return slots.map(({ number, x, y, path }) => {
    const identifier = buildUnitIdentifier(level, number);

    return {
      id: `${towerId}:unit-${identifier}`,
      identifier,
      kind: UnitKind.APARTMENT,
      // PENDIENTE: el estado real sale del inventario, que todavía no llega.
      // Mientras tanto todas figuran disponibles; ojo, que eso es una
      // afirmación comercial: en cuanto haya inventario, mandan esos datos.
      status: UnitStatus.AVAILABLE,
      towerId,
      floorId,
      // El plano que enseña la ficha sale de aquí: depende del SITIO en la
      // planta, no de la torre ni del piso (ver `apartments.ts`).
      apartmentTypeId: apartmentTypeForUnitNumber(number) ?? undefined,
      areaSqm: APARTMENT_AREA_SQM,
      bedrooms: APARTMENT_BEDROOMS,
      bathrooms: APARTMENT_BATHROOMS,
      subtitle: 'Flat',
      tourUrl: APARTMENT_TOUR_URL,
      x,
      y,
      path,
      gallery: apartmentGalleryForUnit(level, number),
    };
  });
};

const buildFloors = (towerId: TowerId, count: number): TowerFloor[] =>
  // Se listan de arriba hacia abajo, como el selector de pisos de Océano.
  Array.from({ length: count }, (_, index) => {
    const level = count - index;
    const id = `${towerId}:floor-${level}`;
    const kind = level === TERRACE_LEVEL ? TowerFloorKind.TERRACE : TowerFloorKind.APARTMENTS;

    return {
      id,
      towerId,
      level,
      label: String(level),
      kind,
      planImage: towerFloorPlanImage(towerId, level),
      // La azotea no vende nada: se queda sin unidades.
      units: kind === TowerFloorKind.TERRACE ? [] : buildUnits(towerId, id, level),
    };
  });

/** Cómo se nombra una planta en pantalla: "Piso 3" o, arriba del todo, "Terraza". */
export const floorTitle = (floor: TowerFloor): string =>
  floor.kind === TowerFloorKind.TERRACE
    ? TowerFloorKindLabel[TowerFloorKind.TERRACE]
    : `${TowerFloorKindLabel[TowerFloorKind.APARTMENTS]} ${floor.label}`;

export const towers: Tower[] = towersOrder.map((id, order) => ({
  id,
  zoneId: ZoneId.ZONE_3,
  elementId: TOWERS_ELEMENT_ID,
  order,
  facadeImage: towerFacadeImage(id),
  hotspot: TOWER_HOTSPOTS[id],
  entryVideo: towerEntryVideo(id),
  entryLevel: TOWER_ENTRY_LEVEL,
  floors: buildFloors(id, FLOORS_PER_TOWER),
}));

/** Torre por la que se entra al pulsar el elemento de torres. */
export const entryTowerId: TowerId = TowerId.TOWER_A;
