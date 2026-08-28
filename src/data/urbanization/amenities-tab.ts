// ============================================================================
// PESTAÑA AMENIDADES — portada con las fases del proyecto
// ----------------------------------------------------------------------------
// La pestaña ya no abre directo en la galería: primero muestra tres tarjetas
// VERTICALES, una por fase. Solo la Fase 1 se ve nítida y es clicable; las
// Fases 2 y 3 se pintan borrosas con el rótulo "Próximamente".
//
// El borroso y el rótulo salen de `status`, no de una lista aparte: cuando la
// Fase 2 pase a AVAILABLE en `phases.ts`, su tarjeta se ve nítida sola.
// ============================================================================

import { PhaseId, PhaseLabel, PhaseStatus } from './enums';
import { phases } from './phases';
import { sortPhases } from './navigation';
import { phaseAmenityCoverImage, phaseAmenityImage } from './assets';
import type { AmenitiesPhaseCard, PhaseAmenity } from './types';

/** Ruta de la galería de amenidades de una fase. */
const amenitiesHref = (phaseId: string) => `/amenidades/${phaseId}`;

export const amenitiesPhaseCards: AmenitiesPhaseCard[] = sortPhases(phases).map((phase) => ({
  phaseId: phase.id,
  label: phase.label ?? PhaseLabel[phase.id],
  status: phase.status,
  image: phase.thumbnail ?? phase.image,
  href: phase.status === PhaseStatus.AVAILABLE ? amenitiesHref(phase.id) : undefined,
  note: phase.status === PhaseStatus.AVAILABLE ? undefined : (phase.comingSoonNote ?? 'Próximamente'),
}));

/**
 * Amenidades de la Fase 1:
 * 1. Club House (7 fotos, portada imagen 7)
 * 2. Parque Mz. R (Parque 1, 6 fotos, portada imagen 6)
 * 3. Parque Mz. P (Parque 2, 6 fotos, portada imagen 4)
 */
export const phase1Amenities: PhaseAmenity[] = [
  {
    id: 'club-house',
    phaseId: PhaseId.PHASE_1,
    title: 'Club House',
    subtitle: 'Área social y recreativa',
    coverImage: phaseAmenityCoverImage(PhaseId.PHASE_1, 'club-house', 7),
    photoCount: 7,
    gallery: Array.from({ length: 7 }, (_, i) =>
      phaseAmenityImage(PhaseId.PHASE_1, 'club-house', i + 1),
    ),
  },
  {
    id: 'parque-mz-r',
    phaseId: PhaseId.PHASE_1,
    title: 'Parque Mz. R',
    subtitle: 'Parque 1 · Áreas verdes y recreación',
    coverImage: phaseAmenityCoverImage(PhaseId.PHASE_1, 'parque-mz-r', 6),
    photoCount: 6,
    gallery: Array.from({ length: 6 }, (_, i) =>
      phaseAmenityImage(PhaseId.PHASE_1, 'parque-mz-r', i + 1),
    ),
  },
  {
    id: 'parque-mz-p',
    phaseId: PhaseId.PHASE_1,
    title: 'Parque Mz. P',
    subtitle: 'Parque 2 · Espacios abiertos y juegos',
    coverImage: phaseAmenityCoverImage(PhaseId.PHASE_1, 'parque-mz-p', 4),
    photoCount: 6,
    gallery: Array.from({ length: 6 }, (_, i) =>
      phaseAmenityImage(PhaseId.PHASE_1, 'parque-mz-p', i + 1),
    ),
  },
];

/** Mapa de amenidades por fase. */
export const phaseAmenitiesMap: Record<string, PhaseAmenity[]> = {
  [PhaseId.PHASE_1]: phase1Amenities,
};

/** Obtener amenidades de una fase concreta. */
export const getAmenitiesByPhase = (phaseId: string): PhaseAmenity[] =>
  phaseAmenitiesMap[phaseId] ?? [];

