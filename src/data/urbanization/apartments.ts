// ============================================================================
// TIPOLOGÍAS DE DEPARTAMENTO — cuatro planos, tres vistas cada uno
// ----------------------------------------------------------------------------
// El cliente entregó CUATRO juegos de material (`FASES/3.DEPARTAMENTOS/DEPA 01`
// … `DEPA 04`), no setenta y dos. No es material incompleto: las cuatro
// posiciones de la planta se repiten idénticas en las tres torres y en los
// cinco pisos con departamentos, así que el plano de la 101 de la Torre A y el
// de la 504 de la C son el mismo si ocupan el mismo sitio. Lo que cambia de una
// unidad a otra es el código, el precio y el estado — nunca el plano.
//
// De ahí el reparto: la TIPOLOGÍA tiene los planos, la UNIDAD tiene lo
// comercial, y `apartmentTypeId` las une. Doce imágenes y veinticuatro videos
// cubren las sesenta unidades.
//
// El enganche es el número dentro de la planta (1…4), el mismo que rotula el
// recorte sobre el plano del piso, y se comprobó contra las imágenes: la DEPA
// 01 es la de abajo a la izquierda (cocina arriba a la derecha, entrada por la
// derecha), la 04 la de arriba a la izquierda. No se dedujo del nombre del
// archivo.
//
//        ┌───────────────┬───────────────┐
//        │     DEPA 4    │     DEPA 3    │   (fondo)
//        ├───────────────┼───────────────┤
//        │     DEPA 1    │     DEPA 2    │   (frente)
//        └───────────────┴───────────────┘
//
// LAS TRES VISTAS Y EL ORDEN EN QUE SE PRESENTAN. Se entra por el AMOBLADO
// —que es lo que vende: cómo se vive el metraje, no cuánto mide—, con las
// medidas a un lado y el entregable al otro. Ese es el orden que pidió el
// cliente y también el que se lee solo: el plano acotado a la izquierda, la
// realidad amoblada en medio, lo que se recibe el día de la entrega a la
// derecha.
//
// Y se puede saltar entre cualesquiera dos, sin pasar por el medio: hay video
// para los SEIS pares ordenados, incluido medidas ↔ entregable. Por eso las
// vistas no se modelan como un carrusel de tres posiciones —eso desperdiciaría
// dos de los seis videos y obligaría a un rodeo para ir de un extremo al otro.
// ============================================================================

import { apartmentTransitionVideo, apartmentViewImage } from './assets';
import { ApartmentTypeId, ApartmentView } from './enums';
import type { ApartmentType, Unit } from './types';

/**
 * Las tres vistas de izquierda a derecha, tal y como se pintan los botones.
 * El orden es de presentación, no de navegación: desde cualquiera se llega a
 * las otras dos de un clic.
 */
export const apartmentViewOrder: ApartmentView[] = [
  ApartmentView.MEASURED,
  ApartmentView.FURNISHED,
  ApartmentView.BARE,
];

/** Por la que se entra al abrir la ficha. */
export const defaultApartmentView: ApartmentView = ApartmentView.FURNISHED;

/**
 * Qué tipología le toca a cada sitio de la planta. Es la tabla que ata el
 * material del cliente al modelo; si mañana llega un quinto departamento por
 * piso, se añade aquí su fila y nada más.
 */
const UNIT_NUMBER_BY_TYPE: Record<ApartmentTypeId, number> = {
  [ApartmentTypeId.TYPE_1]: 1,
  [ApartmentTypeId.TYPE_2]: 2,
  [ApartmentTypeId.TYPE_3]: 3,
  [ApartmentTypeId.TYPE_4]: 4,
};

/** Las claves de los seis pares ordenados; `from === to` se salta. */
const buildTransitions = (id: ApartmentTypeId): ApartmentType['transitions'] =>
  Object.fromEntries(
    apartmentViewOrder.map((from) => [
      from,
      Object.fromEntries(
        apartmentViewOrder
          .filter((to) => to !== from)
          .map((to) => [to, apartmentTransitionVideo(id, from, to)]),
      ),
    ]),
  ) as ApartmentType['transitions'];

export const apartmentTypes: ApartmentType[] = (
  Object.keys(UNIT_NUMBER_BY_TYPE) as ApartmentTypeId[]
).map((id) => ({
  id,
  unitNumber: UNIT_NUMBER_BY_TYPE[id],
  images: Object.fromEntries(
    apartmentViewOrder.map((view) => [view, apartmentViewImage(id, view)]),
  ) as Record<ApartmentView, string>,
  transitions: buildTransitions(id),
}));

/**
 * Tipología que le corresponde al departamento que ocupa ese sitio en la
 * planta. Devuelve `null` si el sitio no tiene material —hoy no pasa, pero un
 * piso con distribución propia entraría por aquí.
 */
export const apartmentTypeForUnitNumber = (unitNumber: number): ApartmentTypeId | null =>
  apartmentTypes.find((type) => type.unitNumber === unitNumber)?.id ?? null;

/** La tipología de una unidad concreta, si es un departamento con material. */
export const apartmentTypeOfUnit = (unit: Unit): ApartmentType | null =>
  apartmentTypes.find((type) => type.id === unit.apartmentTypeId) ?? null;

/**
 * El video que va de una vista a otra. Devuelve `null` cuando no hay ninguno
 * —origen y destino iguales, o una tipología sin ese par—: quien llama debe
 * cambiar de vista igualmente, con un fundido en vez de con la animación.
 */
export const apartmentTransition = (
  type: ApartmentType,
  from: ApartmentView,
  to: ApartmentView,
): string | null => type.transitions[from]?.[to] ?? null;

/** Área estándar de los departamentos en Olimpo de Tumbes: 50 m². */
export const APARTMENT_AREA_SQM = 50;

/**
 * Programa estándar del departamento. Las cuatro tipologías lo comparten, así
 * que vive aquí y no repetido en cada unidad: si una tipología futura difiere,
 * es la unidad la que declara lo suyo y esto queda de valor por defecto.
 */
export const APARTMENT_BEDROOMS = 3;
export const APARTMENT_BATHROOMS = 1;

/** Enlace único oficial del recorrido virtual 360° en Kuula para todos los departamentos. */
export const APARTMENT_TOUR_URL =
  'https://kuula.co/share/collection/7Tgw3?logo=-1&card=1&info=0&fs=1&vr=1&zoom=1&sd=1&initload=0&thumbs=3&inst=es';
