// ============================================================================
// TIPOLOGÍAS DE MÓDULOS (CASAS) — Módulo 1 y Módulo 2
// ----------------------------------------------------------------------------
// Los módulos son las viviendas que se pueden construir sobre los terrenos:
//
//   · MÓDULO 1: Vivienda completa de 2 pisos (50.16 m²).
//     - Piso 1: Sala, comedor, cocina, baño y patio.
//     - Piso 2: Dormitorios y baño.
//     - Cuenta con 3 vistas por piso (Amoblado, Medidas, Sin amoblar)
//       y sus respectivos videos de transición.
//     - Galería fotográfica de 8 tomas en 4K.
//
//   · MÓDULO 2: Ampliación (35.26 m²).
//     - 1 piso con 3 vistas (Amoblado, Medidas, Sin amoblar)
//       y sus 6 videos de transición.
//     - Galería fotográfica de 7 tomas en 4K.
//
//   · RECORRIDO VIRTUAL 360° (Kuula):
//     Ambos módulos comparten el tour virtual interactivo oficial:
//     https://kuula.co/share/collection/7TRqJ...
// ============================================================================

import { moduleGalleryImage, modulePlanImage, moduleTransitionVideo } from './assets';
import { apartmentViewOrder, defaultApartmentView } from './apartments';
import { ApartmentView, LotModuleId } from './enums';

export interface ModuleFloorPlan {
  level: number;
  label: string;
  images: Record<ApartmentView, string>;
  transitions: Record<ApartmentView, Partial<Record<ApartmentView, string>>>;
}

export interface ModuleTypology {
  id: LotModuleId;
  label: string;
  subtitle: string;
  areaSqm: number;
  bedrooms: number;
  bathrooms: number;
  floorsCount: number;
  tourUrl: string;
  gallery: string[];
  floors: ModuleFloorPlan[];
}

/** Enlace oficial del recorrido virtual 360° en Kuula para los módulos de casas. */
export const MODULE_TOUR_URL =
  'https://kuula.co/share/collection/7TRqJ?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&sd=1&initload=0&thumbs=3&inst=es';

const buildModuleTransitions = (
  moduleId: LotModuleId,
  level: number = 1,
): Record<ApartmentView, Partial<Record<ApartmentView, string>>> =>
  Object.fromEntries(
    apartmentViewOrder.map((from) => [
      from,
      Object.fromEntries(
        apartmentViewOrder
          .filter((to) => to !== from)
          .map((to) => [to, moduleTransitionVideo(moduleId, from, to, level)]),
      ),
    ]),
  ) as Record<ApartmentView, Partial<Record<ApartmentView, string>>>;

const buildModuleFloorPlans = (moduleId: LotModuleId, floorsCount: number): ModuleFloorPlan[] =>
  Array.from({ length: floorsCount }, (_, idx) => {
    const level = idx + 1;
    return {
      level,
      label: `Piso ${level}`,
      images: Object.fromEntries(
        apartmentViewOrder.map((view) => [view, modulePlanImage(moduleId, view, level)]),
      ) as Record<ApartmentView, string>,
      transitions: buildModuleTransitions(moduleId, level),
    };
  });

export const moduleTypologies: Record<LotModuleId, ModuleTypology> = {
  [LotModuleId.ONE]: {
    id: LotModuleId.ONE,
    label: 'Módulo 1',
    subtitle: 'Dos pisos · 50.16 m²',
    areaSqm: 50.16,
    bedrooms: 2,
    bathrooms: 2,
    floorsCount: 2,
    tourUrl: MODULE_TOUR_URL,
    gallery: Array.from({ length: 8 }, (_, i) => moduleGalleryImage(LotModuleId.ONE, i + 1)),
    floors: buildModuleFloorPlans(LotModuleId.ONE, 2),
  },
  [LotModuleId.TWO]: {
    id: LotModuleId.TWO,
    label: 'Módulo 2',
    subtitle: 'Ampliación · 35.26 m²',
    areaSqm: 35.26,
    bedrooms: 1,
    bathrooms: 1,
    floorsCount: 1,
    tourUrl: MODULE_TOUR_URL,
    gallery: Array.from({ length: 7 }, (_, i) => moduleGalleryImage(LotModuleId.TWO, i + 1)),
    floors: buildModuleFloorPlans(LotModuleId.TWO, 1),
  },
};

export const getModuleTypology = (id: LotModuleId): ModuleTypology => moduleTypologies[id];
