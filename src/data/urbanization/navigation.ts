// ============================================================================
// NAVEGACIÓN — funciones puras (sin React, sin assets, sin BD)
// ----------------------------------------------------------------------------
// Toda la lógica de desplazamiento vive aquí para que la UI solo pinte:
//   · giro entre lados        → cíclico sobre el orden declarado
//   · desplazamiento en zona  → vecinos de la cuadrícula (chevrons derivados)
//   · salto entre torres      → conserva el piso actual
//
// Ninguna función asume cantidades (4 lados, 3 torres, cuadrícula 2×2):
// todo se calcula sobre las listas que reciben. Ver `docs/01-NAVEGACION.md`.
// ============================================================================

import { LateralDirection, PanDirection, PhaseId, PhaseStatus, TowerId } from './enums';
import type { Phase, Side, Tower, TowerFloor, Zone, ZoneCoords } from './types';

// ---------------------------------------------------------------------------
// Identificadores
// ---------------------------------------------------------------------------

/** Id estable de una celda de la cuadrícula de la fase: `phase-1:0-1`. */
export const buildCellId = (phaseId: PhaseId, row: number, col: number): string =>
  `${phaseId}:${row}-${col}`;

// ---------------------------------------------------------------------------
// Lados (giro cíclico)
// ---------------------------------------------------------------------------

/** Devuelve los lados ordenados por `order` (copia; no muta la entrada). */
export const sortSides = (sides: Side[]): Side[] =>
  [...sides].sort((a, b) => a.order - b.order);

/**
 * Lado al que se llega girando. El ciclo se cierra: del último a la derecha
 * se vuelve al primero, y del primero a la izquierda se va al último.
 */
export function getNeighborSide(
  sides: Side[],
  currentId: Side['id'],
  direction: LateralDirection,
): Side | null {
  const ordered = sortSides(sides);
  if (ordered.length === 0) return null;

  const index = ordered.findIndex((side) => side.id === currentId);
  if (index === -1) return null;

  const step = direction === LateralDirection.RIGHT ? -1 : 1;
  const nextIndex = (index + step + ordered.length) % ordered.length;
  return ordered[nextIndex];
}

/** Video de giro declarado para ese lado y sentido (puede no existir todavía). */
export function getSideTransitionVideo(
  side: Side,
  direction: LateralDirection,
  timeOfDay: 'day' | 'night' = 'day',
): string {
  const assets = side[timeOfDay];
  return direction === LateralDirection.RIGHT
    ? assets.transitions.toLeft
    : assets.transitions.toRight;
}

// ---------------------------------------------------------------------------
// Fases
// ---------------------------------------------------------------------------

export const sortPhases = (phases: Phase[]): Phase[] =>
  [...phases].sort((a, b) => a.order - b.order);

/** Fases navegables (las demás se pintan borrosas con "Próximamente"). */
export const getAvailablePhases = (phases: Phase[]): Phase[] =>
  sortPhases(phases).filter((phase) => phase.status === PhaseStatus.AVAILABLE);

/** Primera fase navegable: a la que se entra por defecto. */
export const getEntryPhase = (phases: Phase[]): Phase | null =>
  getAvailablePhases(phases)[0] ?? null;

/** Zonas de una fase, en su orden declarado. */
export const sortZones = (phase: Phase): Zone[] =>
  [...phase.zones].sort((a, b) => a.order - b.order);

/** Zonas navegables de una fase. */
export const getAvailableZones = (phase: Phase): Zone[] =>
  sortZones(phase).filter((zone) => zone.status === PhaseStatus.AVAILABLE);

// ---------------------------------------------------------------------------
// Desplazamiento DENTRO de una fase: de una zona a la contigua
// ---------------------------------------------------------------------------
// Cada zona es una celda de la cuadrícula de la fase. Estas funciones son las
// que alimentan los chevrons: la UI nunca declara cuáles pintar.

const DIRECTION_DELTA: Record<PanDirection, ZoneCoords> = {
  [PanDirection.UP]: { row: -1, col: 0 },
  [PanDirection.DOWN]: { row: 1, col: 0 },
  [PanDirection.LEFT]: { row: 0, col: -1 },
  [PanDirection.RIGHT]: { row: 0, col: 1 },
};

export const findZoneAt = (phase: Phase, coords: ZoneCoords): Zone | null =>
  phase.zones.find((zone) => zone.row === coords.row && zone.col === coords.col) ?? null;

export const findZoneById = (phase: Phase, zoneId: string): Zone | null =>
  phase.zones.find((zone) => zone.id === zoneId) ?? null;

/** Zona de entrada a la fase (o la primera declarada, como red de seguridad). */
export const getEntryZone = (phase: Phase): Zone | null =>
  findZoneAt(phase, phase.entryZone) ?? phase.zones[0] ?? null;

/**
 * Zona vecina en una dirección. Devuelve `null` cuando no hay ninguna: el
 * desplazamiento dentro de la fase NO es cíclico (a diferencia del giro entre
 * lados), así que al llegar al borde ese chevron simplemente desaparece.
 *
 * Una zona en COMING_SOON sí cuenta como vecina: se puede llegar a ella y la
 * UI la muestra como pendiente. Lo que no existe es lo que apaga el chevron.
 */
export function getNeighborZone(
  phase: Phase,
  coords: ZoneCoords,
  direction: PanDirection,
): Zone | null {
  const delta = DIRECTION_DELTA[direction];
  return findZoneAt(phase, { row: coords.row + delta.row, col: coords.col + delta.col });
}

/**
 * Direcciones con zona vecina. La UI pinta un chevron por cada una: así una
 * fase 2×2, 3×3 o en forma de L funciona sin tocar el componente.
 */
export function getAvailableDirections(phase: Phase, coords: ZoneCoords): PanDirection[] {
  return Object.values(PanDirection).filter(
    (direction) => getNeighborZone(phase, coords, direction) !== null,
  );
}

// ---------------------------------------------------------------------------
// Torres (salto lateral conservando el piso)
// ---------------------------------------------------------------------------

export const sortTowers = (towers: Tower[]): Tower[] =>
  [...towers].sort((a, b) => a.order - b.order);

/**
 * Torre contigua. A diferencia de los lados, las torres NO son cíclicas:
 * están una al lado de la otra, así que la primera no tiene flecha izquierda
 * y la última no tiene flecha derecha.
 */
export function getNeighborTower(
  towers: Tower[],
  currentId: TowerId,
  direction: LateralDirection,
): Tower | null {
  const ordered = sortTowers(towers);
  const index = ordered.findIndex((tower) => tower.id === currentId);
  if (index === -1) return null;

  const nextIndex = direction === LateralDirection.RIGHT ? index + 1 : index - 1;
  return ordered[nextIndex] ?? null;
}

/** Sentidos disponibles desde una torre; la UI pinta una flecha por cada uno. */
export function getAvailableTowerDirections(
  towers: Tower[],
  currentId: TowerId,
): LateralDirection[] {
  return Object.values(LateralDirection).filter(
    (direction) => getNeighborTower(towers, currentId, direction) !== null,
  );
}

/**
 * Piso equivalente en otra torre.
 * Regla: se conserva el MISMO `level`. Si la torre destino no tiene ese piso
 * (torres de distinta altura), se ajusta al piso más cercano en lugar de
 * dejar al usuario sin vista.
 */
export function findEquivalentFloor(tower: Tower, level: number): TowerFloor | null {
  if (tower.floors.length === 0) return null;

  const exact = tower.floors.find((floor) => floor.level === level);
  if (exact) return exact;

  return tower.floors.reduce((closest, floor) =>
    Math.abs(floor.level - level) < Math.abs(closest.level - level) ? floor : closest,
  );
}

/**
 * Resuelve el salto lateral completo: a qué torre se va y en qué piso se cae.
 * Devuelve `null` si no hay torre en ese sentido.
 */
export function resolveTowerSwitch(
  towers: Tower[],
  currentTowerId: TowerId,
  currentLevel: number,
  direction: LateralDirection,
): { tower: Tower; floor: TowerFloor | null } | null {
  const target = getNeighborTower(towers, currentTowerId, direction);
  if (!target) return null;

  return { tower: target, floor: findEquivalentFloor(target, currentLevel) };
}

/** Pisos de una torre de arriba hacia abajo (el 6 primero, el 1 al final). */
export const sortFloorsDescending = (tower: Tower): TowerFloor[] =>
  [...tower.floors].sort((a, b) => b.level - a.level);

/** Piso concreto de una torre por su número. */
export const findFloorByLevel = (tower: Tower, level: number): TowerFloor | null =>
  tower.floors.find((floor) => floor.level === level) ?? null;

/**
 * ENTRADA a una torre desde la toma de las tres: qué video se reproduce y en
 * qué piso se aterriza al terminarlo.
 *
 * El piso NO se adivina del nombre del archivo: sale de `entryLevel`, que es
 * el piso en el que termina el video. Si la torre no declara ni video ni piso
 * de entrada, se cae al piso más alto y la UI hace un fundido.
 *
 * Esto es lo contrario de `resolveTowerSwitch`: allí se conserva el piso en el
 * que está el visitante y no hay video.
 */
export function resolveTowerEntry(tower: Tower): {
  floor: TowerFloor | null;
  video: string | null;
} {
  const ordered = sortFloorsDescending(tower);
  const fallback = ordered[0] ?? null;

  const floor =
    tower.entryLevel !== undefined
      ? findEquivalentFloor(tower, tower.entryLevel) ?? fallback
      : fallback;

  return { floor, video: tower.entryVideo || null };
}
