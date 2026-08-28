// ============================================================================
// FASES — el proyecto tiene 4; hoy solo la Fase 1 es navegable
// ----------------------------------------------------------------------------
// Las Fases 2, 3 y 4 ya existen en el modelo con estado COMING_SOON: se pintan
// con el rótulo "Próximamente" y no son clicables.
//
// Los recortes y centros se trazaron con la herramienta sobre `MASTER PLAN.jpg`:
//   - Fase 1: casas construidas y manzana de torres
//   - Fase 2: sector sur-este
//   - Fase 3: sector norte-centro
//   - Fase 4: sector este / fondo
//
// Cuando lleguen sus tomas, basta cambiar `status` a AVAILABLE y colgarles
// sus zonas: la navegación, el selector de fases y la pestaña Amenidades las
// toman automáticamente.
// ============================================================================

import { phaseImage } from './assets';
import { PhaseId, PhaseStatus } from './enums';
import type { Phase } from './types';
import { phase1Zones } from './zones';

export const phases: Phase[] = [
  {
    id: PhaseId.PHASE_1,
    order: 0,
    status: PhaseStatus.AVAILABLE,
    image: phaseImage(PhaseId.PHASE_1),
    // Marco de la cuadrícula, no el número de zonas: la Zona 4 (abajo derecha)
    // no entra en esta etapa, así que hoy solo hay tres celdas ocupadas y la
    // forma es una L. Quién es vecina de quién sale de las zonas declaradas,
    // no de estos números (ver `zones.ts` y `getAvailableDirections`).
    grid: { rows: 2, cols: 2 },
    // Zona por la que se entra cuando se llega sin elegir (hoy nadie: desde la
    // toma de la fase se pulsa el rótulo de una zona concreta). Es el respaldo.
    entryZone: { row: 0, col: 0 },
    zones: phase1Zones,
    hotspot: {
      x: 30.7,
      y: 55.7,
      path: 'M 35.7 82.1 L 35.6 57.3 L 48.0 57.0 L 52.7 58.1 L 53.8 46.0 L 47.5 44.7 L 35.4 45.3 L 35.0 35.6 L 16.7 35.8 L 16.8 61.4 L 18.4 62.4 L 18.3 67.7 L 19.9 70.5 L 20.3 73.3 L 22.7 75.0 L 24.4 74.7 L 25.1 78.1 L 26.6 78.8 L 26.8 82.5 Z',
    },
  },
  {
    id: PhaseId.PHASE_2,
    order: 1,
    status: PhaseStatus.COMING_SOON,
    image: phaseImage(PhaseId.PHASE_2), // PENDIENTE: toma aérea de la Fase 2
    comingSoonNote: 'Próximamente',
    grid: { rows: 0, cols: 0 },
    entryZone: { row: 0, col: 0 },
    zones: [],
    hotspot: {
      x: 49.4,
      y: 67.6,
      path: 'M 35.6 57.8 L 48.8 57.2 L 69.7 60.9 L 69.3 69.1 L 61.9 69.2 L 48.0 80.1 L 35.7 81.0 Z',
    },
  },
  {
    id: PhaseId.PHASE_3,
    order: 2,
    status: PhaseStatus.COMING_SOON,
    image: phaseImage(PhaseId.PHASE_3), // PENDIENTE: toma aérea de la Fase 3
    comingSoonNote: 'Próximamente',
    grid: { rows: 0, cols: 0 },
    entryZone: { row: 0, col: 0 },
    zones: [],
    hotspot: {
      x: 45.1,
      y: 27.3,
      path: 'M 35.1 10.0 L 55.9 9.8 L 53.8 46.2 L 47.8 45.1 L 35.4 45.2 Z',
    },
  },
  {
    id: PhaseId.PHASE_4,
    order: 3,
    status: PhaseStatus.COMING_SOON,
    image: phaseImage(PhaseId.PHASE_4), // PENDIENTE: toma aérea de la Fase 4
    comingSoonNote: 'Próximamente',
    grid: { rows: 0, cols: 0 },
    entryZone: { row: 0, col: 0 },
    zones: [],
    hotspot: {
      x: 69.6,
      y: 36.6,
      path: 'M 81.3 11.2 L 56.7 9.9 L 54.2 54.6 L 69.9 57.2 L 69.7 66.0 L 82.6 67.8 L 82.7 33.2 Z',
    },
  },
];
