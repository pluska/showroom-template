// ============================================================================
// RECORRIDOS VIRTUALES 360° (KUULA) — El Olimpo de Tumbes
// ----------------------------------------------------------------------------
// Los 6 recorridos interactivos 360° oficiales de la urbanización:
//   1. Parque 1 (Parque Mz. R)
//   2. Parque 2 (Parque Mz. P)
//   3. Club House
//   4. Módulos de Casas (Módulo 1 y 2)
//   5. Los Edificios (Torres de departamentos)
//   6. El Olimpo de Tumbes (Master Plan / General)
// ============================================================================

import { PhaseId, LotModuleId } from './enums';
import { phaseAmenityCoverImage, masterPlanImage, moduleGalleryImage } from './assets';

export interface VirtualTourItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'amenity' | 'houses' | 'apartments' | 'general';
  categoryLabel: string;
  thumbnail: string;
  targetUrl: string;
  badge: string;
}

export const VIRTUAL_TOURS: VirtualTourItem[] = [
  {
    id: 'el-olimpo-tumbes',
    title: 'El Olimpo de Tumbes',
    subtitle: 'Vista general panorámica y Master Plan',
    category: 'general',
    categoryLabel: 'Urbanización',
    badge: 'Master Plan',
    thumbnail: 'urbanization/sides/side-0/day.webp',
    targetUrl:
      'https://kuula.co/share/collection/7TR9Q?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&sd=1&initload=0&thumbs=3&inst=es',
  },
  {
    id: 'modulos-casas',
    title: 'Módulos de Casas',
    subtitle: 'Viviendas de 1 y 2 pisos (Módulo 1 y 2)',
    category: 'houses',
    categoryLabel: 'Casas',
    badge: 'Módulos',
    thumbnail: moduleGalleryImage(LotModuleId.ONE, 1),
    targetUrl:
      'https://kuula.co/share/collection/7TRqJ?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&sd=1&initload=0&thumbs=3&inst=es',
  },
  {
    id: 'los-edificios',
    title: 'Los Edificios',
    subtitle: 'Torres de departamentos A, B y C',
    category: 'apartments',
    categoryLabel: 'Departamentos',
    badge: 'Edificios',
    thumbnail: 'urbanization/apartments/gallery/floor-1/1.webp',
    targetUrl:
      'https://kuula.co/share/collection/7Tgw3?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&sd=1&initload=0&thumbs=3&inst=es',
  },
  {
    id: 'parque-mz-r',
    title: 'Parque Mz. R',
    subtitle: 'Parque 1 · Áreas verdes y recreación',
    category: 'amenity',
    categoryLabel: 'Amenidades',
    badge: 'Parque',
    thumbnail: phaseAmenityCoverImage(PhaseId.PHASE_1, 'parque-mz-r', 6),
    targetUrl:
      'https://kuula.co/share/collection/7TRqZ?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&sd=1&initload=0&thumbs=3&inst=es',
  },
  {
    id: 'parque-mz-p',
    title: 'Parque Mz. P',
    subtitle: 'Parque 2 · Espacios abiertos y juegos',
    category: 'amenity',
    categoryLabel: 'Amenidades',
    badge: 'Parque',
    thumbnail: phaseAmenityCoverImage(PhaseId.PHASE_1, 'parque-mz-p', 4),
    targetUrl:
      'https://kuula.co/share/collection/7TR9s?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&sd=1&initload=0&thumbs=3&inst=es',
  },
  {
    id: 'club-house',
    title: 'Club House',
    subtitle: 'Área social, piscina y recreación',
    category: 'amenity',
    categoryLabel: 'Amenidades',
    badge: 'Club House',
    thumbnail: phaseAmenityCoverImage(PhaseId.PHASE_1, 'club-house', 7),
    targetUrl:
      'https://kuula.co/share/collection/7TR9y?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&sd=1&initload=0&thumbs=3&inst=es',
  },
];
