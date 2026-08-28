// ============================================================================
// RUTAS DE ASSETS — claves R2 de la urbanización
// ----------------------------------------------------------------------------
// Aquí SOLO se construyen claves (rutas relativas dentro del bucket). El
// dominio lo pone `getAssetUrl()` de `src/utils/assets.ts` en el momento de
// renderizar, nunca aquí: así el proyecto sigue siendo portable entre buckets.
//
// El cliente entrega los archivos con su propia nomenclatura
// (`F1.Z1.ArrIzq.png`); dentro del bucket se guardan con los slugs estables
// del dominio. La tabla de equivalencias está en `docs/02-ASSETS.md`.
// ============================================================================

import {
  ApartmentTypeId,
  ApartmentView,
  LotFacing,
  LotModuleId,
  PhaseId,
  SideId,
  TowerId,
  ViewSlot,
  ZoneId,
} from './enums';

/** Carpeta raíz de todo lo relacionado con la urbanización. */
export const URBANIZATION_ROOT = 'urbanization';

/**
 * Master Plan: la toma cenital con la urbanización entera, desde la que se
 * elige fase (archivo entregado: `MASTER PLAN.jpg`).
 *
 * Antes se llamaba `phases/overview` porque era "la toma general de las
 * fases". El cliente lo nombra Master Plan y así se llama en pantalla, así que
 * la clave sigue el mismo nombre: es la primera vista del proyecto, no un
 * accesorio de las fases. La clave vieja sigue en el bucket con la toma
 * anterior; ya no la usa nadie.
 */
export const masterPlanImage = `${URBANIZATION_ROOT}/master-plan.webp`;

/** Toma aérea de una fase completa (archivo entregado: `FASE 1.jpg`). */
export const phaseImage = (phaseId: PhaseId): string =>
  `${URBANIZATION_ROOT}/phases/${phaseId}/overview.webp`;

/**
 * Toma de una zona a pantalla completa (archivo entregado: `ZONA 1.jpg`).
 * Cada zona es una celda de la cuadrícula de su fase, así que le corresponde
 * una sola imagen.
 *
 * Ojo con la ruta: la zona cuelga directo de la fase, sin carpeta `zones/` de
 * por medio. No es estética — la API de Cloudflare rechaza cualquier clave R2
 * que contenga el segmento `zones` (colisiona con su propia API de Zones) y
 * devuelve "The specified bucket does not exist". Como el id ya viene
 * prefijado (`zone-1`), la carpeta agrupadora no aportaba nada.
 */
export const zoneImage = (phaseId: PhaseId, zoneId: ZoneId): string =>
  `${URBANIZATION_ROOT}/phases/${phaseId}/${zoneId}.webp`;

/**
 * Video de bajada del Master Plan a una fase (archivo entregado: `MP - F1.mp4`).
 * Se llama `entry` igual que el de las torres y hace lo mismo: el primer
 * fotograma es el Master Plan y el último la toma de la fase.
 *
 * No hay video de VUELTA (fase → Master Plan): el cliente no lo entregó, así
 * que subir un escalón es un fundido.
 */
export const phaseEntryVideo = (phaseId: PhaseId): string =>
  `${URBANIZATION_ROOT}/phases/${phaseId}/entry.mp4`;

/**
 * Video de bajada de la toma de la fase a una de sus zonas (archivos
 * entregados: `F1 - Z1.mp4` … `F1 - Z3.mp4`).
 */
export const zoneEntryVideo = (phaseId: PhaseId, zoneId: ZoneId): string =>
  `${URBANIZATION_ROOT}/phases/${phaseId}/${zoneId}-entry.mp4`;

/**
 * El mismo camino de vuelta: de la zona a la toma de la fase (archivos
 * entregados: `Z1 - F1.mp4` … `Z3 - F1.mp4`). Ida y vuelta son archivos
 * distintos, así que hay clave para cada sentido.
 */
export const zoneExitVideo = (phaseId: PhaseId, zoneId: ZoneId): string =>
  `${URBANIZATION_ROOT}/phases/${phaseId}/${zoneId}-exit.mp4`;

/**
 * Video de desplazamiento entre dos zonas contiguas de la misma fase
 * (archivos entregados: `Z1 - Z2.mp4`, `Z2 - Z1.mp4`, …).
 *
 * Están los seis pares ordenados de las tres zonas activas, no tres: ir y
 * volver no comparten archivo.
 */
export const zoneTransitionVideo = (
  phaseId: PhaseId,
  from: ZoneId,
  to: ZoneId,
): string =>
  `${URBANIZATION_ROOT}/phases/${phaseId}/transitions/${from}_to_${to}.mp4`;

/** Imagen fija de un lado, por franja horaria. */
export const sideImage = (sideId: SideId, timeOfDay: 'day' | 'night' = 'day'): string =>
  `${URBANIZATION_ROOT}/sides/${sideId}/${timeOfDay}.webp`;

/** Video de giro entre dos lados. */
export const sideTransitionVideo = (
  from: SideId,
  to: SideId,
  timeOfDay: 'day' | 'night' = 'day',
): string => `${URBANIZATION_ROOT}/sides/transitions/${from}_to_${to}.${timeOfDay}.mp4`;

/**
 * Video de entrada a un lado: se reproduce UNA sola vez, de principio a fin
 * (archivo entregado: `0.1.mp4` para la Portada).
 *
 * No confundir con `sideLoopVideo`: este tiene principio y final, y su último
 * fotograma es el primero del bucle. La portada encadena los dos —entrada y
 * luego bucle— y el relevo no se ve.
 */
export const sideIntroVideo = (
  sideId: SideId,
  timeOfDay: 'day' | 'night' = 'day',
): string => `${URBANIZATION_ROOT}/sides/${sideId}/intro.${timeOfDay}.mp4`;

/**
 * Video en bucle de un lado (archivo entregado: `0.2 loop.mp4`). Se queda
 * girando hasta que el visitante hace algo.
 *
 * Es cerrado: su último fotograma coincide con el primero, así que el salto
 * del bucle tampoco se ve. Su respaldo cuando el video no carga es
 * `sideImage(sideId)` — la imagen `0.3.jpg`, que es la misma toma congelada.
 */
export const sideLoopVideo = (
  sideId: SideId,
  timeOfDay: 'day' | 'night' = 'day',
): string => `${URBANIZATION_ROOT}/sides/${sideId}/loop.${timeOfDay}.mp4`;

/**
 * Video que sube desde un lado hasta el Master Plan, es decir el "Ingresar al
 * proyecto" (archivos entregados: `O1-MP.mp4` … `O4-MP.mp4`).
 *
 * Como el giro entre lados, el último fotograma es exactamente la toma de
 * destino —aquí `masterPlanImage`—, así que al acabar se cambia a la imagen y
 * el corte no se nota. Hay uno por lado: se entra desde donde se esté mirando.
 */
export const sideToMasterPlanVideo = (
  sideId: SideId,
  timeOfDay: 'day' | 'night' = 'day',
): string =>
  `${URBANIZATION_ROOT}/sides/transitions/${sideId}_to_master-plan.${timeOfDay}.mp4`;

/** Fachada de una torre. */
export const towerFacadeImage = (towerId: TowerId): string =>
  `${URBANIZATION_ROOT}/towers/${towerId}/facade.webp`;

/** Plano de planta de un piso de torre. */
export const towerFloorPlanImage = (towerId: TowerId, level: number): string =>
  `${URBANIZATION_ROOT}/towers/${towerId}/floors/${level}.webp`;

/**
 * Toma cenital con las tres torres a la vez (archivo entregado: `ABC.png`).
 * Es la vista desde la que se elige torre; cada torre tiene encima su área
 * clicable (ver `towers.ts`).
 */
export const towersOverviewImage = `${URBANIZATION_ROOT}/towers/overview.webp`;

/**
 * Video de transición desde la Zona 3 hacia la toma cenital de las tres torres
 * (archivo entregado: `Z3-ABC.mp4`).
 */
export const towersEntryTransitionVideo = `${URBANIZATION_ROOT}/towers/transitions/zone-3_to_towers.mp4`;

/**
 * Video de acercamiento desde la toma de las tres torres hasta una torre
 * concreta (archivos entregados: `ABC-A5.mp4`, `ABC-B5.mp4`, `ABC-C5.mp4`).
 *
 * El último fotograma del video coincide EXACTAMENTE con la planta del piso
 * en el que aterriza (hoy el 5), así que al terminar se muestra esa planta y
 * el corte es invisible. Qué piso es no se deduce del nombre del archivo: se
 * declara en `entryLevel` de cada torre.
 */
export const towerEntryVideo = (towerId: TowerId): string =>
  `${URBANIZATION_ROOT}/towers/${towerId}/entry.mp4`;

/**
 * Render cenital de un lote (archivos entregados: `K_2.png` en `PLANTAS` y
 * `PLANTAS 2`). Cada archivo es una toma cerrada centrada en ese lote, así que
 * hace de vista de detalle del terreno.
 *
 * `blockId` es el id de la manzana con su prefijo (`mz-k`), igual que la clave.
 */
export const lotPlanImage = (blockId: string, number: number): string =>
  `${URBANIZATION_ROOT}/lots/${blockId}/${number}.webp`;

/**
 * El mismo render del lote, pero ACOTADO: con las medidas de cada lindero
 * rotuladas encima (archivos entregados: `K´2-CM.png` en `PLANTAS MEDIDAS`,
 * donde `CM` es "con medidas").
 *
 * Es el que manda: la ficha del terreno enseña este primero, porque las
 * medidas son lo que el comprador viene a ver. El render limpio queda de
 * respaldo para los lotes cuya versión acotada todavía no está subida — que
 * hoy son casi todos.
 */
export const lotMeasuredPlanImage = (blockId: string, number: number): string =>
  `${URBANIZATION_ROOT}/lots/${blockId}/${number}-medidas.webp`;

/**
 * El módulo de casa que se planta ENCIMA del render del lote (archivos
 * entregados: `MODULOS PNG/M1-DER.png`).
 *
 * Es una capa, no una toma: un WebP con transparencia de 2560×1440 —el mismo
 * encuadre que el render del lote— con la casa ya dibujada en el sitio que le
 * toca. Por eso no cuelga de la manzana ni del lote: OCHO archivos (dos
 * módulos × cuatro orientaciones) cubren los 133 terrenos, y la ficha solo
 * tiene que apilar el que corresponda sobre el render limpio.
 *
 * Que se pueda apilar sin colocar nada depende de dos cosas, las dos
 * comprobadas superponiendo los archivos: que capa y render midan lo mismo
 * (2560×1440, 16:9 exacto, así que un `object-cover` recorta las dos igual) y
 * que el encuadre de cada lote sea el mismo para todos los que miran en una
 * misma dirección.
 */
export const lotModuleImage = (moduleId: LotModuleId, facing: LotFacing): string => {
  // Las capas PNG entregadas: el archivo M1 del cliente contiene el Módulo 2 y M2 contiene el Módulo 1
  const targetFolder = moduleId === LotModuleId.ONE ? 'module-2' : 'module-1';
  return `${URBANIZATION_ROOT}/lots/modules/${targetFolder}/${facing}.webp`;
};

/**
 * El departamento visto de una de las tres maneras (archivos entregados:
 * `DEPA 01/AMOBLADO.jpg`, `CAD.jpg`, `ENTREGABLE.jpg`).
 *
 * La clave cuelga de la TIPOLOGÍA, no de la unidad: las cuatro posiciones de
 * la planta se repiten idénticas en las tres torres y en los cinco pisos, así
 * que doce archivos cubren las sesenta unidades. Colgarlas de la unidad habría
 * pedido setecientos veinte.
 */
export const apartmentViewImage = (typeId: ApartmentTypeId, view: ApartmentView): string =>
  `${URBANIZATION_ROOT}/apartments/${typeId}/${view}.webp`;

/**
 * El video que lleva de una vista del departamento a otra (archivos
 * entregados: `D1.A - D1.AC.mp4` — el de la DEPA 01 trae una letra de más en
 * el destino, corregida al subir).
 *
 * Hay uno para CADA par ordenado, seis por tipología: el cliente los entregó
 * completos precisamente para que se pueda saltar de las medidas al entregable
 * sin pasar por el amoblado. Ir y volver no comparten archivo — la animación no
 * es la misma del revés.
 *
 * El primer fotograma es exactamente la vista de origen y el último la de
 * destino, así que al acabar se cambia la imagen y el corte no se ve. Por eso
 * las tomas se subieron a 3840×2160 y no a los 5504×3072 del original: el video
 * es 16:9 exacto y un encuadre que no lo fuera daría un salto al terminar.
 */
export const apartmentTransitionVideo = (
  typeId: ApartmentTypeId,
  from: ApartmentView,
  to: ApartmentView,
): string => `${URBANIZATION_ROOT}/apartments/${typeId}/transitions/${from}_to_${to}.mp4`;

/**
 * Foto de lo que se ve desde un punto de vista de la zona (el marcador con el
 * compás). Se numera desde 1 y en el mismo orden en el que están declarados
 * los puntos: `viewpoints/zone-1/3.day.webp` es la vista del tercer marcador
 * de la Zona 1. Es un emparejamiento por posición, así que reordenar los
 * puntos reordena las fotos.
 *
 * De cada punto llegan DOS tomas, de día y de noche (archivos entregados
 * `Z1-3.1.jpg` y `Z1-3.2.jpg`; el `.1` es el de día, comprobado por brillo y a
 * ojo). Comparten encuadre exacto —las mismas personas en el mismo sitio—, y
 * de eso vive el comparador de la ficha: la cortina descubre una sobre la otra
 * sin que nada se mueva. El panel enseña solo la de día.
 *
 * Ojo con la ruta, por lo mismo que las zonas: la clave NO puede contener el
 * segmento `zones` (la API de Cloudflare lo rechaza). Como el id de zona ya
 * viene prefijado (`zone-1`), sirve de carpeta tal cual.
 */
export const viewpointImage = (
  zoneId: ZoneId,
  order: number,
  timeOfDay: 'day' | 'night' = 'day',
): string => `${URBANIZATION_ROOT}/viewpoints/${zoneId}/${order}.${timeOfDay}.webp`;

/**
 * Foto de la galería interior del departamento según su piso (1 a 5) y posición (1 a 4).
 * El cliente entregó 8 tomas en 4K por departamento (100% de los 20 departamentos):
 * - DEPA 101 … 501: para las unidades x01.
 * - DEPA 102 … 502: para las unidades x02.
 * - DEPA 103 … 503: para las unidades x03.
 * - DEPA 104 … 504: para las unidades x04.
 */
export const apartmentGalleryImage = (
  level: number,
  imageIndex: number,
  slotNumber: number = 1,
): string => {
  if (slotNumber === 4) {
    return `${URBANIZATION_ROOT}/apartments/gallery/depa-${level}04/${imageIndex}.webp`;
  }
  if (slotNumber === 3) {
    return `${URBANIZATION_ROOT}/apartments/gallery/depa-${level}03/${imageIndex}.webp`;
  }
  if (slotNumber === 2) {
    return `${URBANIZATION_ROOT}/apartments/gallery/depa-${level}02/${imageIndex}.webp`;
  }
  return `${URBANIZATION_ROOT}/apartments/gallery/floor-${level}/${imageIndex}.webp`;
};

/**
 * Plano del módulo según nivel (piso) y vista (amoblado, acotado, entregable).
 * - Módulo 1: tiene piso 1 y piso 2 (`floorLevel` = 1 | 2).
 * - Módulo 2: es de un solo piso (ampliación).
 */
export const modulePlanImage = (
  moduleId: LotModuleId,
  view: ApartmentView,
  floorLevel: number = 1,
): string => {
  if (moduleId === LotModuleId.ONE) {
    return `${URBANIZATION_ROOT}/modules/${moduleId}/floor-${floorLevel}/${view}.webp`;
  }
  return `${URBANIZATION_ROOT}/modules/${moduleId}/${view}.webp`;
};

/**
 * Video de transición entre vistas para un módulo.
 */
export const moduleTransitionVideo = (
  moduleId: LotModuleId,
  from: ApartmentView,
  to: ApartmentView,
  floorLevel: number = 1,
): string => {
  if (moduleId === LotModuleId.ONE) {
    return `${URBANIZATION_ROOT}/modules/${moduleId}/floor-${floorLevel}/transitions/${from}_to_${to}.mp4`;
  }
  return `${URBANIZATION_ROOT}/modules/${moduleId}/transitions/${from}_to_${to}.mp4`;
};

/**
 * Foto de la galería del módulo.
 */
export const moduleGalleryImage = (moduleId: LotModuleId, index: number): string =>
  `${URBANIZATION_ROOT}/modules/${moduleId}/gallery/${index}.webp`;

/**
 * Foto de la galería de una amenidad de fase (p. ej. Club House, Parque Mz. R, Parque Mz. P).
 */
export const phaseAmenityImage = (
  phaseId: PhaseId | string,
  amenitySlug: string,
  imageIndex: number,
): string => `${URBANIZATION_ROOT}/amenities/${phaseId}/${amenitySlug}/${imageIndex}.webp`;

/**
 * Foto de portada de una amenidad de fase.
 */
export const phaseAmenityCoverImage = (
  phaseId: PhaseId | string,
  amenitySlug: string,
  coverIndex: number,
): string => phaseAmenityImage(phaseId, amenitySlug, coverIndex);


