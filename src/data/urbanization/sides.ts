// ============================================================================
// LADOS (antes "Caras") — 4 lados con giro CÍCLICO
// ----------------------------------------------------------------------------
// Diferencia clave con Océano Atlántico: allí había 3 caras y el giro se
// bloqueaba en los extremos. Aquí se puede dar la vuelta completa
// (lado 1 → 2 → 3 → 4 → 1) y el ciclo se calcula sobre `order`, no sobre el
// número 4: agregar o quitar un lado no toca ni una línea de lógica.
//
// Desde cualquiera de los cuatro lados se entra al proyecto: `enterVideo` es
// la subida hasta el Master Plan y hay una por lado, así que se ingresa desde
// donde se esté mirando sin volver antes a un lado concreto.
// ============================================================================

import {
  sideImage,
  sideIntroVideo,
  sideLoopVideo,
  sideToMasterPlanVideo,
  sideTransitionVideo,
} from './assets';
import { SideId } from './enums';
import type { Side } from './types';

/** Orden del ciclo de las 4 caras. */
export const sidesOrder: SideId[] = [
  SideId.SIDE_1,
  SideId.SIDE_2,
  SideId.SIDE_3,
  SideId.SIDE_4,
];

const buildSide = (id: SideId, order: number): Side => {
  const previous = sidesOrder[(order - 1 + sidesOrder.length) % sidesOrder.length];
  const next = sidesOrder[(order + 1) % sidesOrder.length];

  return {
    id,
    order,
    day: {
      background: sideImage(id, 'day'),
      enterVideo: sideToMasterPlanVideo(id, 'day'),
      transitions: {
        toLeft: sideTransitionVideo(id, previous, 'day'),
        toRight: sideTransitionVideo(id, next, 'day'),
      },
    },
    night: {
      background: sideImage(id, 'night'),
      enterVideo: sideToMasterPlanVideo(id, 'night'),
      transitions: {
        toLeft: sideTransitionVideo(id, previous, 'night'),
        toRight: sideTransitionVideo(id, next, 'night'),
      },
    },
  };
};

export const sides: Side[] = sidesOrder.map((id, index) => buildSide(id, index));

/**
 * Cara 0 (Portada del showroom).
 *
 * Es el único lado con DOS videos encadenados: `introVideo` (`0.1.mp4`) entra
 * una sola vez y `backgroundVideo` (`0.2 loop.mp4`) se queda girando después.
 * Se separan porque la entrada tiene principio y final y el bucle es cerrado;
 * meterlos en un solo archivo obligaría a repetir la entrada en cada vuelta.
 *
 * `background` (`0.3.jpg`) es la misma toma congelada y hace de respaldo: se
 * ve mientras los videos cargan y se queda si no llegan a cargar.
 *
 * No tiene `enterVideo` propio: de la portada no se sube al Master Plan, se
 * pasa al Lado 1 con `transitions.toRight` (`0-1.mp4`) y desde allí se entra.
 */
export const side0: Side = {
  id: SideId.SIDE_0,
  order: 0,
  day: {
    background: sideImage(SideId.SIDE_0, 'day'),
    introVideo: sideIntroVideo(SideId.SIDE_0, 'day'),
    backgroundVideo: sideLoopVideo(SideId.SIDE_0, 'day'),
    transitions: {
      toLeft: '',
      toRight: sideTransitionVideo(SideId.SIDE_0, SideId.SIDE_1, 'day'),
    },
  },
  night: {
    background: sideImage(SideId.SIDE_0, 'night'),
    introVideo: sideIntroVideo(SideId.SIDE_0, 'night'),
    backgroundVideo: sideLoopVideo(SideId.SIDE_0, 'night'),
    transitions: {
      toLeft: '',
      toRight: sideTransitionVideo(SideId.SIDE_0, SideId.SIDE_1, 'night'),
    },
  },
};

/** Lado por el que se entra a la experiencia. */
export const entrySideId: SideId = SideId.SIDE_1;
