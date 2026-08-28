// ============================================================================
// TERRENOS — las manzanas de lotes de las Zonas 1 y 2
// ----------------------------------------------------------------------------
// Lo que en las torres son departamentos, aquí son LOTES: terreno sin
// construir, que se vende igual y que también es una `Unit` (con
// `kind = UnitKind.LOT`). El dashboard sigue trabajando sobre una sola tabla.
//
// Cada lote tiene su propio render cenital —una toma cerrada centrada en él—
// que hace de ficha visual. Son los archivos que entregó el cliente en
// `FASES/PLANTAS` y `FASES/PLANTAS 2`, ya subidos a R2 (ver docs/02-ASSETS.md).
//
// Cómo se nombra: **Manzana K, Lote 1**, y se escribe `Mz K Lt 1`. Sin prima,
// confirmado por el cliente — aunque los archivos de `PLANTAS SIN MEDIDAS`
// lleguen como `K´2-SM.png` y el plano de manzaneo tenga el abecedario dos
// veces (una tanda con prima y otra sin ella), estos lotes son los de la
// tanda SIN prima.
//
// Los recortes de cada lote los midió el cliente sobre la toma de su zona y se
// copian tal cual: 69 polígonos en la Zona 1 (manzanas O, P, Q y R) y 64 en la
// Zona 2 (K, L, M y N), en porcentaje 0–100 como todo lo demás del proyecto.
// Se comprobaron dibujándolos encima de su toma antes de escribirlos: caen
// clavados sobre sus manzanas.
//
// Las cuatro de la Zona 2 traen además el contorno de la manzana entera
// (`LotBlock.hotspot`), que es lo que rotula "Mz K" sobre la toma. Las de la
// Zona 1 todavía no.
// ============================================================================

import { lotMeasuredPlanImage, lotPlanImage } from './assets';
import { LotFacing, LotPosition, UnitKind, UnitStatus, ZoneId } from './enums';
import type { Unit, ZoneElementHotspot } from './types';

export interface LotBlock {
  /** Id estable; es también la carpeta en R2 (`urbanization/lots/mz-k/…`). */
  id: string;
  /** Letra de la manzana tal como se rotula: `K`, `L`, … */
  letter: string;
  /**
   * Números de lote REALES, los que van en el contrato. No siempre coinciden
   * con el número del archivo: ver `firstFileNumber`.
   */
  lots: number[];
  /**
   * Número con el que empieza a contar la tanda de archivos entregada. Casi
   * siempre 1 —`K_1.png` es el lote 1—, pero en la manzana O los quince
   * archivos van de `O_1` a `O_15` y los lotes que representan son el 8 al 22.
   * El desfase se declara aquí y en ningún otro sitio.
   */
  firstFileNumber?: number;
  /** Zona en cuya toma cae la manzana, y sobre la que están medidos los recortes. */
  zoneId?: ZoneId;
  /**
   * Contorno de la manzana ENTERA sobre la toma de su zona, con el punto donde
   * cae su rótulo. No es clicable —lo clicable es el lote— y sirve para lo que
   * un mapa de 64 franjas necesita y no tenía: saber qué manzana se está
   * mirando sin pulsar nada.
   *
   * Hoy solo lo tienen las cuatro de la Zona 2. Las de la Zona 1 se dibujan sin
   * contorno hasta que se midan; no rompe nada, simplemente no sale.
   */
  hotspot?: ZoneElementHotspot;
}

/** Rótulo visible de la manzana. */
export const blockLabel = (block: LotBlock): string => `Manzana ${block.letter}`;

/**
 * Código del lote: como ya se rotula la manzana en su propio elemento,
 * el tag del lote se escribe completo como `Lote ${number}`.
 */
export const buildLotIdentifier = (_block: LotBlock, number: number): string =>
  `Lote ${number}`;

const range = (from: number, to: number, skip: number[] = []): number[] =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i).filter((n) => !skip.includes(n));

/**
 * Las ocho manzanas entregadas, con su numeración real (la del cliente).
 *
 * Los huecos NO son archivos que falten: el lote 10 de la P y el 9 de la R son
 * **áreas recreativas**, no se venden. Por eso la P tiene 14 lotes numerados
 * hasta el 15 y la R tiene 12 numerados hasta el 13.
 *
 * PENDIENTE — la manzana O. El cliente da sus lotes del **8 al 22**, y los
 * archivos entregados van de `O_1` a `O_15`: quince y quince, así que el
 * desfase encaja (el `O_1` sería el lote 8). Queda por confirmar, porque si la
 * correspondencia fuese otra, los quince códigos saldrían mal — y un código de
 * lote es dato de contrato.
 */
/**
 * Área del lote tipo. Es el respaldo para un lote sin medida declarada: el
 * panel lo usaba como literal suelto (`|| 66`), que es la clase de número que
 * sobrevive intacto a un cambio de proyecto.
 */
export const LOT_DEFAULT_AREA_SQM = 66;

export const lotBlocks: LotBlock[] = [
  // Zona 2
  {
    id: 'mz-k',
    letter: 'K',
    lots: range(1, 16),
    zoneId: ZoneId.ZONE_2,
    hotspot: { x: 45.9, y: 77.7, path: 'M 57.2 88.6 L 57.1 66.6 L 34.6 66.8 L 34.6 88.6 Z' },
  },
  {
    id: 'mz-l',
    letter: 'L',
    lots: range(1, 18),
    zoneId: ZoneId.ZONE_2,
    hotspot: { x: 50.9, y: 32.7, path: 'M 57.8 0.0 L 43.8 3.7 L 43.9 63.8 L 57.8 63.5 Z' },
  },
  {
    id: 'mz-m',
    letter: 'M',
    lots: range(1, 16),
    zoneId: ZoneId.ZONE_2,
    hotspot: { x: 34.6, y: 35.0, path: 'M 41.2 4.7 L 27.9 8.6 L 27.9 63.7 L 41.3 63.0 Z' },
  },
  {
    id: 'mz-n',
    letter: 'N',
    lots: range(1, 14),
    zoneId: ZoneId.ZONE_2,
    hotspot: { x: 18.3, y: 37.0, path: 'M 24.8 9.4 L 11.4 13.8 L 11.2 58.9 L 18.0 63.6 L 25.0 62.8 Z' },
  },
  // Zona 1
  {
    id: 'mz-o',
    letter: 'O',
    lots: range(8, 22),
    firstFileNumber: 1,
    zoneId: ZoneId.ZONE_1,
    hotspot: { x: 11.9, y: 51.4, path: 'M 15.4 14.3 L 15.3 88.0 L 8.5 89.2 L 8.3 15.0 Z' },
  },
  {
    id: 'mz-p',
    letter: 'P',
    lots: range(1, 15, [10]),
    zoneId: ZoneId.ZONE_1,
    hotspot: { x: 24.4, y: 67.7, path: 'M 17.8 87.8 L 17.9 49.1 L 31.1 48.8 L 31.2 84.8 Z' },
  },
  {
    id: 'mz-q',
    letter: 'Q',
    lots: range(1, 28),
    zoneId: ZoneId.ZONE_1,
    hotspot: { x: 40.0, y: 48.4, path: 'M 33.7 14.2 L 46.4 14.2 L 46.6 80.8 L 33.5 83.8 Z' },
  },
  {
    id: 'mz-r',
    letter: 'R',
    lots: range(1, 13, [9]),
    zoneId: ZoneId.ZONE_1,
    hotspot: { x: 55.5, y: 62.7, path: 'M 61.9 46.9 L 49.0 46.4 L 49.3 80.1 L 62.4 77.2 Z' },
  },
];

// ---------------------------------------------------------------------------
// Orientación: por dónde sale cada lote a la calle
// ---------------------------------------------------------------------------
// Dato OCULTO. No sale en la ficha, ni en el filtro, ni en el rótulo: su única
// misión es elegir cuál de los cuatro giros del módulo se planta sobre el
// render del terreno (`lotModuleImage`). Sin él habría que rotar la capa en el
// navegador, y el cliente ya entregó los cuatro giros hechos.
//
// Se declara como lo dictó el cliente —"del 1 al 4 abajo, del 5 al 9
// izquierda, EL RESTO a la derecha"—: una orientación por defecto para la
// manzana y las excepciones aparte. Escrito así, los huecos se resuelven
// solos: la P no tiene lote 10 ni la R el 9 (son áreas recreativas), y "el
// resto" no tiene que acordarse de saltárselos.
//
// Arriba, abajo, izquierda y derecha son las de la TOMA DE LA ZONA, la misma
// sobre la que están medidos los recortes de aquí arriba. Eso permite
// comprobar cada línea contra su polígono en vez de creerla: los lotes 1–4 de
// la Q ocupan `y 71.6–83.4` en franjas verticales —la fila de abajo de la
// manzana, con la calle por debajo—, y por eso miran ABAJO. Las ocho manzanas
// se repasaron así, una a una, y encajan.

interface BlockFacing {
  /** La orientación de la manzana: el "el resto" del cliente. */
  fallback: LotFacing;
  /** Los lotes que miran a otro lado, por número de lote real. */
  exceptions?: { facing: LotFacing; lots: number[] }[];
}

const BLOCK_FACINGS: Record<string, BlockFacing> = {
  // --- Zona 2 ---
  // K es la única tumbada: dos filas largas, la de arriba a una calle y la de
  // abajo a la otra. No tiene lotes laterales.
  'mz-k': {
    fallback: LotFacing.DOWN,
    exceptions: [{ facing: LotFacing.UP, lots: range(1, 8) }],
  },
  'mz-l': {
    fallback: LotFacing.LEFT,
    exceptions: [
      { facing: LotFacing.UP, lots: range(1, 4) },
      { facing: LotFacing.RIGHT, lots: range(5, 11) },
    ],
  },
  'mz-m': {
    fallback: LotFacing.LEFT,
    exceptions: [
      { facing: LotFacing.UP, lots: range(1, 4) },
      { facing: LotFacing.RIGHT, lots: range(5, 10) },
    ],
  },
  'mz-n': {
    fallback: LotFacing.LEFT,
    exceptions: [
      { facing: LotFacing.UP, lots: range(1, 4) },
      { facing: LotFacing.RIGHT, lots: range(5, 9) },
    ],
  },
  // --- Zona 1 ---
  // O es una sola columna contra la avenida: los quince miran al mismo sitio.
  'mz-o': { fallback: LotFacing.RIGHT },
  'mz-p': {
    fallback: LotFacing.RIGHT,
    exceptions: [
      { facing: LotFacing.DOWN, lots: range(1, 4) },
      { facing: LotFacing.LEFT, lots: range(5, 9) },
    ],
  },
  'mz-q': {
    fallback: LotFacing.RIGHT,
    exceptions: [
      { facing: LotFacing.DOWN, lots: range(1, 4) },
      { facing: LotFacing.LEFT, lots: range(5, 16) },
    ],
  },
  'mz-r': {
    fallback: LotFacing.RIGHT,
    exceptions: [
      { facing: LotFacing.DOWN, lots: range(1, 4) },
      { facing: LotFacing.LEFT, lots: range(5, 8) },
    ],
  },
};

/**
 * Hacia dónde sale a la calle el lote `number` de la manzana `blockId`.
 *
 * Devuelve `undefined` solo si la manzana no está en la tabla —hoy están las
 * ocho—, y entonces la ficha se queda sin módulos en vez de plantar uno
 * mirando a cualquier parte.
 */
export const lotFacingOf = (blockId: string, number: number): LotFacing | undefined => {
  const declared = BLOCK_FACINGS[blockId];
  if (!declared) return undefined;

  const exception = declared.exceptions?.find((group) => group.lots.includes(number));
  return exception?.facing ?? declared.fallback;
};

// ---------------------------------------------------------------------------
// Recortes: los polígonos que entregó el cliente
// ---------------------------------------------------------------------------
// Un lote es una franja estrecha, así que el recorte se traza lote a lote; no
// hay forma honrada de deducirlos de la manzana (las esquinas y los fondos no
// miden igual). El punto del rótulo (`x`, `y`) es el centro del polígono.

const LOT_HOTSPOTS: Record<string, Record<number, ZoneElementHotspot>> = {
  // --- Zona 2 ---
  'mz-k': {
    1: { x: 55.7, y: 72.2, path: 'M 57.1 78.0 L 57.1 66.6 L 54.2 66.6 L 54.3 77.7 Z' },
    2: { x: 52.9, y: 72.2, path: 'M 54.2 77.8 L 54.2 66.6 L 51.5 66.7 L 51.5 77.5 Z' },
    3: { x: 50.1, y: 72.2, path: 'M 51.6 77.5 L 51.5 66.5 L 48.6 66.6 L 48.7 78.0 Z' },
    4: { x: 47.3, y: 72.1, path: 'M 48.7 77.7 L 48.7 66.4 L 45.8 66.6 L 45.9 77.9 Z' },
    5: { x: 44.5, y: 72.2, path: 'M 45.9 77.7 L 43.0 77.7 L 43.1 66.6 L 45.9 66.6 Z' },
    6: { x: 41.7, y: 72.2, path: 'M 40.2 77.9 L 43.1 77.8 L 43.1 66.5 L 40.3 66.4 Z' },
    7: { x: 38.9, y: 72.2, path: 'M 40.2 77.8 L 37.4 77.5 L 37.5 66.6 L 40.3 66.7 Z' },
    8: { x: 36.0, y: 72.3, path: 'M 37.4 77.7 L 37.4 66.6 L 34.7 66.8 L 34.6 77.9 Z' },
    9: { x: 36.1, y: 83.2, path: 'M 34.8 88.6 L 37.4 88.6 L 37.5 77.8 L 34.6 78.0 Z' },
    10: { x: 38.9, y: 83.2, path: 'M 37.4 78.1 L 40.2 77.9 L 40.4 88.5 L 37.6 88.5 Z' },
    11: { x: 41.7, y: 83.1, path: 'M 40.3 88.5 L 40.2 78.0 L 43.1 77.8 L 43.0 88.5 Z' },
    12: { x: 44.5, y: 83.1, path: 'M 43.1 88.3 L 46.0 88.6 L 45.9 77.7 L 43.0 77.9 Z' },
    13: { x: 47.3, y: 83.0, path: 'M 48.6 88.5 L 45.9 88.3 L 45.9 77.8 L 48.7 77.7 Z' },
    14: { x: 50.1, y: 83.2, path: 'M 48.6 77.8 L 48.7 88.5 L 51.6 88.6 L 51.5 77.9 Z' },
    15: { x: 53.0, y: 83.1, path: 'M 54.4 88.5 L 54.4 78.1 L 51.5 77.6 L 51.6 88.5 Z' },
    16: { x: 55.8, y: 83.2, path: 'M 54.3 77.9 L 57.2 77.7 L 57.2 88.6 L 54.3 88.5 Z' },
  },
  'mz-l': {
    1: { x: 46.0, y: 19.0, path: 'M 47.6 12.8 L 47.6 25.0 L 44.5 24.7 L 44.4 13.6 Z' },
    2: { x: 49.4, y: 18.4, path: 'M 51.0 12.1 L 47.6 12.8 L 47.8 24.5 L 51.0 24.6 Z' },
    3: { x: 52.6, y: 18.1, path: 'M 54.1 24.4 L 54.1 11.1 L 51.0 12.1 L 51.0 24.8 Z' },
    4: { x: 55.6, y: 17.7, path: 'M 57.1 24.6 L 57.1 10.5 L 54.0 11.3 L 54.1 24.6 Z' },
    5: { x: 54.0, y: 27.2, path: 'M 57.1 24.8 L 50.8 24.6 L 50.8 29.5 L 57.1 29.7 Z' },
    6: { x: 54.0, y: 32.1, path: 'M 57.2 34.7 L 57.1 29.6 L 50.8 29.6 L 50.7 34.5 Z' },
    7: { x: 53.9, y: 37.1, path: 'M 57.1 39.6 L 57.1 34.7 L 50.8 34.6 L 50.8 39.6 Z' },
    8: { x: 53.9, y: 42.1, path: 'M 57.0 44.5 L 57.0 39.6 L 50.7 39.7 L 50.8 44.5 Z' },
    9: { x: 54.0, y: 47.1, path: 'M 57.1 49.5 L 57.1 44.6 L 50.8 44.6 L 50.8 49.5 Z' },
    10: { x: 53.9, y: 52.1, path: 'M 57.1 54.5 L 57.0 49.6 L 50.7 49.6 L 50.8 54.5 Z' },
    11: { x: 53.9, y: 57.0, path: 'M 57.0 59.5 L 57.0 54.6 L 50.7 54.6 L 50.8 59.4 Z' },
    12: { x: 47.5, y: 57.0, path: 'M 50.7 59.5 L 50.7 54.6 L 44.2 54.5 L 44.4 59.5 Z' },
    13: { x: 47.6, y: 52.0, path: 'M 50.7 54.6 L 44.4 54.6 L 44.4 49.5 L 50.8 49.5 Z' },
    14: { x: 47.5, y: 47.0, path: 'M 50.7 49.5 L 50.7 44.4 L 44.4 44.6 L 44.4 49.7 Z' },
    15: { x: 47.6, y: 42.1, path: 'M 50.8 44.5 L 50.8 39.6 L 44.4 39.7 L 44.5 44.7 Z' },
    16: { x: 47.6, y: 37.1, path: 'M 50.7 39.5 L 50.8 34.6 L 44.5 34.7 L 44.5 39.6 Z' },
    17: { x: 47.6, y: 32.1, path: 'M 50.7 34.6 L 50.7 29.6 L 44.5 29.7 L 44.5 34.6 Z' },
    18: { x: 47.6, y: 27.1, path: 'M 50.7 29.5 L 50.7 24.6 L 44.5 24.7 L 44.5 29.7 Z' },
  },
  'mz-m': {
    1: { x: 29.9, y: 23.3, path: 'M 31.5 29.5 L 31.5 16.7 L 28.3 17.3 L 28.3 29.8 Z' },
    2: { x: 33.2, y: 22.8, path: 'M 34.8 29.5 L 31.5 29.5 L 31.6 16.3 L 34.9 15.7 Z' },
    3: { x: 36.3, y: 22.4, path: 'M 37.7 29.4 L 34.9 29.4 L 34.8 15.9 L 37.8 15.2 Z' },
    4: { x: 39.2, y: 22.1, path: 'M 40.5 29.6 L 40.6 14.5 L 37.7 15.3 L 37.8 29.5 Z' },
    5: { x: 37.5, y: 32.3, path: 'M 40.7 34.8 L 40.6 29.9 L 34.3 29.9 L 34.4 34.6 Z' },
    6: { x: 37.5, y: 37.2, path: 'M 40.7 39.6 L 40.6 34.9 L 34.4 34.7 L 34.4 39.6 Z' },
    7: { x: 37.5, y: 42.2, path: 'M 34.4 39.7 L 40.6 39.8 L 40.6 44.7 L 34.4 44.7 Z' },
    8: { x: 37.4, y: 47.0, path: 'M 40.5 49.4 L 40.5 44.7 L 34.3 44.6 L 34.5 49.5 Z' },
    9: { x: 37.5, y: 52.1, path: 'M 40.5 54.5 L 40.6 49.5 L 34.4 49.7 L 34.4 54.6 Z' },
    10: { x: 37.5, y: 57.1, path: 'M 40.6 59.5 L 40.5 54.8 L 34.4 54.6 L 34.5 59.5 Z' },
    11: { x: 31.3, y: 57.2, path: 'M 34.3 59.7 L 28.5 59.7 L 28.3 54.6 L 34.2 54.8 Z' },
    12: { x: 31.4, y: 52.2, path: 'M 34.4 54.5 L 34.3 49.7 L 28.5 49.6 L 28.5 54.9 Z' },
    13: { x: 31.4, y: 47.0, path: 'M 34.3 49.5 L 34.3 44.6 L 28.3 44.5 L 28.5 49.4 Z' },
    14: { x: 31.4, y: 42.1, path: 'M 34.4 44.5 L 34.3 39.6 L 28.4 39.6 L 28.5 44.7 Z' },
    15: { x: 31.5, y: 37.1, path: 'M 34.4 39.7 L 28.4 39.7 L 28.5 34.6 L 34.4 34.3 Z' },
    16: { x: 31.4, y: 32.2, path: 'M 34.3 34.4 L 34.3 29.6 L 28.5 29.9 L 28.5 34.7 Z' },
  },
  'mz-n': {
    1: { x: 13.7, y: 25.9, path: 'M 15.5 31.1 L 15.6 20.4 L 11.8 21.1 L 11.8 31.1 Z' },
    2: { x: 17.2, y: 25.5, path: 'M 18.5 31.1 L 18.9 19.6 L 15.6 20.7 L 15.6 31.0 Z' },
    3: { x: 20.1, y: 25.3, path: 'M 21.5 30.8 L 21.7 19.0 L 18.8 19.9 L 18.5 31.2 Z' },
    4: { x: 23.1, y: 25.0, path: 'M 24.6 31.2 L 24.5 18.3 L 21.8 19.1 L 21.6 30.8 Z' },
    5: { x: 21.4, y: 33.7, path: 'M 24.7 31.3 L 24.6 36.3 L 18.1 36.1 L 18.0 31.3 Z' },
    6: { x: 21.2, y: 38.6, path: 'M 24.5 36.2 L 18.0 36.0 L 17.9 41.1 L 24.6 41.2 Z' },
    7: { x: 21.2, y: 43.7, path: 'M 24.5 46.0 L 24.6 41.2 L 17.9 41.2 L 17.9 46.3 Z' },
    8: { x: 21.3, y: 48.7, path: 'M 24.6 51.3 L 24.6 46.1 L 17.9 46.1 L 17.9 51.2 Z' },
    9: { x: 21.4, y: 55.4, path: 'M 24.6 51.0 L 18.0 51.3 L 18.1 59.8 L 24.7 59.6 Z' },
    10: { x: 15.2, y: 54.6, path: 'M 17.9 59.6 L 18.0 51.1 L 11.9 51.1 L 11.9 56.4 Z' },
    11: { x: 14.8, y: 48.6, path: 'M 17.9 50.9 L 17.9 46.3 L 11.9 46.2 L 11.7 51.0 Z' },
    12: { x: 15.0, y: 43.6, path: 'M 17.9 46.1 L 18.0 41.0 L 11.9 41.3 L 11.9 46.1 Z' },
    13: { x: 14.9, y: 38.6, path: 'M 18.0 41.1 L 17.9 36.0 L 11.9 36.0 L 12.0 41.4 Z' },
    14: { x: 14.8, y: 33.8, path: 'M 17.9 36.1 L 17.9 31.4 L 11.9 31.2 L 11.8 36.3 Z' },
  },
  // --- Zona 1 ---
  'mz-o': {
    8: { x: 11.7, y: 84.5, path: 'M 14.7 87.2 L 14.8 81.3 L 8.7 81.5 L 8.7 88.2 Z' },
    9: { x: 11.5, y: 79.0, path: 'M 14.8 81.2 L 14.6 76.8 L 8.4 76.5 L 8.3 81.5 Z' },
    10: { x: 11.6, y: 74.2, path: 'M 14.7 76.4 L 14.7 71.7 L 8.5 71.9 L 8.5 76.6 Z' },
    11: { x: 11.5, y: 69.5, path: 'M 14.7 71.8 L 14.6 67.0 L 8.4 66.9 L 8.5 72.1 Z' },
    12: { x: 11.6, y: 64.5, path: 'M 14.8 66.8 L 14.7 62.0 L 8.5 61.9 L 8.6 67.1 Z' },
    13: { x: 11.8, y: 59.9, path: 'M 15.0 62.2 L 14.9 57.4 L 8.7 57.3 L 8.8 62.5 Z' },
    14: { x: 11.6, y: 55.1, path: 'M 14.7 52.6 L 8.6 52.6 L 8.4 57.5 L 14.8 57.6 Z' },
    15: { x: 11.5, y: 50.2, path: 'M 14.6 47.7 L 8.5 47.7 L 8.3 52.6 L 14.7 52.7 Z' },
    16: { x: 11.6, y: 45.6, path: 'M 14.7 43.1 L 8.6 43.1 L 8.4 48.0 L 14.8 48.1 Z' },
    17: { x: 11.7, y: 40.7, path: 'M 14.8 38.2 L 8.7 38.2 L 8.5 43.1 L 14.9 43.2 Z' },
    18: { x: 11.7, y: 36.1, path: 'M 14.8 33.6 L 8.7 33.6 L 8.5 38.5 L 14.9 38.6 Z' },
    19: { x: 11.9, y: 31.1, path: 'M 15.0 28.6 L 8.9 28.6 L 8.7 33.5 L 15.1 33.6 Z' },
    20: { x: 11.9, y: 26.4, path: 'M 15.0 23.9 L 8.9 23.9 L 8.7 28.8 L 15.1 28.9 Z' },
    21: { x: 11.9, y: 21.6, path: 'M 15.0 19.1 L 8.9 19.1 L 8.7 24.0 L 15.1 24.1 Z' },
    22: { x: 11.9, y: 16.8, path: 'M 15.0 14.3 L 8.9 14.3 L 8.7 19.2 L 15.1 19.3 Z' },
  },
  'mz-p': {
    1: { x: 28.8, y: 78.7, path: 'M 30.5 83.4 L 30.4 73.5 L 27.2 73.4 L 27.3 84.5 Z' },
    2: { x: 25.6, y: 79.1, path: 'M 27.2 84.2 L 27.1 73.5 L 24.0 73.5 L 24.0 85.1 Z' },
    3: { x: 22.4, y: 79.4, path: 'M 24.0 85.1 L 24.0 73.4 L 20.9 73.4 L 20.9 85.8 Z' },
    4: { x: 19.6, y: 79.7, path: 'M 20.9 85.9 L 20.9 73.5 L 18.2 73.3 L 18.3 86.2 Z' },
    5: { x: 21.3, y: 70.9, path: 'M 24.2 73.2 L 24.2 68.3 L 18.4 68.8 L 18.3 73.2 Z' },
    6: { x: 21.2, y: 66.1, path: 'M 24.2 68.7 L 24.2 63.8 L 18.1 63.6 L 18.3 68.5 Z' },
    7: { x: 21.2, y: 61.3, path: 'M 24.2 63.5 L 24.1 58.9 L 18.3 59.0 L 18.3 63.7 Z' },
    8: { x: 21.2, y: 56.5, path: 'M 24.1 58.9 L 24.2 54.2 L 18.4 53.9 L 18.4 58.9 Z' },
    9: { x: 21.2, y: 51.7, path: 'M 24.2 54.1 L 24.1 49.6 L 18.3 49.4 L 18.4 53.9 Z' },
    11: { x: 27.4, y: 51.7, path: 'M 30.6 53.9 L 30.5 49.2 L 24.2 49.5 L 24.4 54.1 Z' },
    12: { x: 27.4, y: 56.5, path: 'M 30.5 58.7 L 30.5 54.1 L 24.3 54.2 L 24.3 58.9 Z' },
    13: { x: 27.3, y: 61.3, path: 'M 30.5 63.5 L 30.4 59.1 L 24.3 59.0 L 24.2 63.7 Z' },
    14: { x: 27.4, y: 66.1, path: 'M 30.5 68.5 L 30.4 63.7 L 24.3 63.6 L 24.3 68.6 Z' },
    15: { x: 27.2, y: 70.6, path: 'M 30.5 73.0 L 30.5 68.5 L 24.1 67.8 L 24.2 73.1 Z' },
  },
  'mz-q': {
    1: { x: 44.1, y: 76.2, path: 'M 45.6 80.1 L 45.7 71.9 L 42.6 71.9 L 42.6 80.8 Z' },
    2: { x: 41.1, y: 76.6, path: 'M 39.7 81.4 L 39.6 72.0 L 42.6 72.1 L 42.6 80.8 Z' },
    3: { x: 38.2, y: 76.8, path: 'M 39.8 71.7 L 39.6 81.3 L 36.7 82.8 L 36.8 71.6 Z' },
    4: { x: 35.5, y: 77.4, path: 'M 36.9 71.9 L 36.9 82.8 L 34.3 83.4 L 34.1 71.6 Z' },
    5: { x: 37.0, y: 69.4, path: 'M 39.9 71.8 L 39.8 67.2 L 34.1 66.9 L 34.2 71.7 Z' },
    6: { x: 37.0, y: 64.6, path: 'M 39.9 67.0 L 39.9 62.3 L 34.2 62.1 L 34.2 67.1 Z' },
    7: { x: 37.0, y: 59.7, path: 'M 39.9 62.1 L 39.8 57.4 L 34.1 57.3 L 34.2 62.1 Z' },
    8: { x: 37.0, y: 55.0, path: 'M 39.9 57.3 L 39.8 52.5 L 34.2 52.7 L 34.2 57.3 Z' },
    9: { x: 37.1, y: 50.1, path: 'M 39.9 52.6 L 39.9 47.5 L 34.2 47.8 L 34.2 52.7 Z' },
    10: { x: 37.1, y: 45.2, path: 'M 39.9 43.0 L 39.9 47.4 L 34.3 47.5 L 34.2 43.0 Z' },
    11: { x: 37.1, y: 40.5, path: 'M 40.0 43.0 L 39.9 38.1 L 34.2 38.0 L 34.4 43.0 Z' },
    12: { x: 37.1, y: 35.8, path: 'M 39.9 38.1 L 39.9 33.4 L 34.1 33.5 L 34.3 38.1 Z' },
    13: { x: 37.1, y: 31.0, path: 'M 39.9 33.3 L 39.9 28.6 L 34.3 28.7 L 34.2 33.5 Z' },
    14: { x: 37.1, y: 26.2, path: 'M 40.0 28.7 L 39.9 23.7 L 34.2 24.0 L 34.3 28.6 Z' },
    15: { x: 37.0, y: 21.5, path: 'M 39.9 23.5 L 39.9 19.1 L 34.2 19.2 L 34.3 24.1 Z' },
    16: { x: 37.1, y: 16.6, path: 'M 40.0 19.2 L 39.9 14.1 L 34.2 14.2 L 34.2 19.0 Z' },
    17: { x: 43.0, y: 16.4, path: 'M 45.9 19.1 L 40.0 18.8 L 39.9 13.9 L 46.0 13.8 Z' },
    18: { x: 42.9, y: 21.4, path: 'M 45.9 19.1 L 46.0 24.0 L 40.0 24.0 L 39.9 18.7 Z' },
    19: { x: 42.9, y: 26.2, path: 'M 45.9 23.8 L 39.8 23.6 L 39.9 28.6 L 45.9 28.7 Z' },
    20: { x: 42.9, y: 31.0, path: 'M 45.9 28.6 L 45.9 33.4 L 40.0 33.3 L 39.9 28.6 Z' },
    21: { x: 43.1, y: 35.9, path: 'M 46.1 33.5 L 46.1 38.3 L 40.2 38.2 L 40.1 33.5 Z' },
    22: { x: 42.9, y: 40.7, path: 'M 45.9 38.3 L 45.9 43.1 L 40.0 43.0 L 39.9 38.3 Z' },
    23: { x: 42.8, y: 45.5, path: 'M 45.8 43.1 L 45.8 47.9 L 39.9 47.8 L 39.8 43.1 Z' },
    24: { x: 42.9, y: 50.2, path: 'M 45.9 47.8 L 45.9 52.6 L 40.0 52.5 L 39.9 47.8 Z' },
    25: { x: 43.0, y: 55.1, path: 'M 46.0 52.7 L 46.0 57.5 L 40.1 57.4 L 40.0 52.7 Z' },
    26: { x: 43.0, y: 59.9, path: 'M 46.0 57.5 L 46.0 62.3 L 40.1 62.2 L 40.0 57.5 Z' },
    27: { x: 43.0, y: 64.6, path: 'M 46.0 62.2 L 46.0 67.0 L 40.1 66.9 L 40.0 62.2 Z' },
    28: { x: 43.1, y: 69.6, path: 'M 46.1 67.2 L 46.1 72.0 L 40.2 71.9 L 40.1 67.2 Z' },
  },
  'mz-r': {
    1: { x: 60.0, y: 71.3, path: 'M 61.7 76.0 L 61.6 66.1 L 58.3 66.0 L 58.4 76.9 Z' },
    2: { x: 56.8, y: 71.7, path: 'M 58.2 77.0 L 58.2 66.1 L 55.4 66.0 L 55.3 77.4 Z' },
    3: { x: 53.8, y: 72.0, path: 'M 55.3 66.0 L 52.3 66.1 L 52.3 78.3 L 55.4 77.6 Z' },
    4: { x: 50.9, y: 72.2, path: 'M 52.2 78.3 L 52.2 66.0 L 49.5 65.8 L 49.6 78.9 Z' },
    5: { x: 52.5, y: 63.5, path: 'M 55.6 65.7 L 55.6 61.3 L 49.5 61.1 L 49.5 65.9 Z' },
    6: { x: 52.5, y: 58.7, path: 'M 55.6 61.0 L 55.6 56.4 L 49.5 56.3 L 49.5 61.2 Z' },
    7: { x: 52.5, y: 53.9, path: 'M 55.6 56.3 L 55.6 51.6 L 49.5 51.5 L 49.5 56.2 Z' },
    8: { x: 52.5, y: 49.1, path: 'M 55.6 51.6 L 55.4 46.6 L 49.4 46.6 L 49.5 51.5 Z' },
    10: { x: 58.6, y: 49.3, path: 'M 55.6 46.7 L 61.6 47.1 L 61.6 51.7 L 55.7 51.7 Z' },
    11: { x: 58.6, y: 54.0, path: 'M 61.7 51.7 L 61.7 56.2 L 55.6 56.4 L 55.6 51.6 Z' },
    12: { x: 58.6, y: 58.7, path: 'M 61.7 60.9 L 61.6 56.5 L 55.6 56.2 L 55.7 61.3 Z' },
    13: { x: 58.7, y: 63.5, path: 'M 61.6 65.6 L 61.6 61.0 L 55.7 61.4 L 55.7 65.9 Z' },
  },
};

// ---------------------------------------------------------------------------
// Inventario: área, posición y estado
// ---------------------------------------------------------------------------
// Los tres ejes del filtro de la zona salen de AQUÍ, y de ningún otro sitio.
// Es la única tabla que hay que rellenar cuando el cliente entregue el
// inventario; ni la UI ni el filtro se tocan.
//
// QUÉ HAY Y QUÉ FALTA (25/08):
//
//   ÁREA      declarada en las ocho manzanas, los 133 lotes.
//   POSICIÓN  declarada en las ocho, los 133. Las 64 de la Zona 2 y las 12 de la
//             R llegaron el 25/08; O, P y Q ya estaban.
//   ESTADO    no lo declara ninguno: los 133 salen con `DEFAULT_LOT_STATUS`.
//             Precio, tampoco. Son los dos ejes que siguen pendientes.
//
// POR QUÉ NO SE DEDUCE LO QUE FALTA. El área y la posición son cifras de
// contrato: el plano de manzaneo las trae lote a lote y las tomas acotadas
// (`{n}-medidas.webp`) las llevan rotuladas. Ponerlas a ojo —o deducir la
// esquina de que el recorte caiga al final de una fila— daría un catálogo que
// parece correcto y no lo es. El filtro funciona con lo que haya declarado y
// avisa de lo que falta.
//
// LAS 76 ÁREAS DE LA ENTREGA SE COTEJARON UNA A UNA contra su toma acotada, que
// es la misma imagen que ve el comprador en la ficha: si el panel y el plano no
// dijeran lo mismo, la contradicción se vería en pantalla. Coinciden las 76.
// (El lote 2 de la L entró como 89.19 y se corrigió a 89.18, que es lo que
// rotula su plano; confirmado por el cliente.)
//
// CÓMO SE RELLENA. Por manzana y por número de lote, con lo que se sepa: los
// tres campos son opcionales y se pueden ir completando por tandas.
//
//   'mz-q': {
//     1:  { areaSqm: 78,  position: LotPosition.CORNER, status: UnitStatus.SOLD },
//     2:  { areaSqm: 66,  position: LotPosition.MIDDLE },
//     ...
//   },
//
// `DEFAULT_LOT_STATUS` es la red de seguridad del estado: sin inventario todo
// figura disponible, que es lo que se venía haciendo. El área y la posición no
// tienen equivalente — un lote sin declarar sale como "sin dato" y el filtro lo
// deja fuera solo cuando se filtra por ese eje.

export interface LotAttributes {
  /** Área del lote en m², tal como la da el plano de manzaneo. */
  areaSqm?: number;
  /** Esquinera o medianera. */
  position?: LotPosition;
  /** Estado comercial real. Si falta, se usa `DEFAULT_LOT_STATUS`. */
  status?: UnitStatus;
}

/**
 * Estado con el que sale un lote del que no se sabe nada. Es una afirmación
 * comercial, así que vive en una sola constante y no repartida por el código.
 */
export const DEFAULT_LOT_STATUS = UnitStatus.AVAILABLE;

/** Inventario declarado, por manzana y número de lote. */
const LOT_ATTRIBUTES: Record<string, Record<number, LotAttributes>> = {
  'mz-k': {
    1: { areaSqm: 66, position: LotPosition.CORNER },
    2: { areaSqm: 66, position: LotPosition.MIDDLE },
    3: { areaSqm: 66, position: LotPosition.MIDDLE },
    4: { areaSqm: 66, position: LotPosition.MIDDLE },
    5: { areaSqm: 66, position: LotPosition.MIDDLE },
    6: { areaSqm: 66, position: LotPosition.MIDDLE },
    7: { areaSqm: 66, position: LotPosition.MIDDLE },
    8: { areaSqm: 66, position: LotPosition.CORNER },
    9: { areaSqm: 66, position: LotPosition.CORNER },
    10: { areaSqm: 66, position: LotPosition.MIDDLE },
    11: { areaSqm: 66, position: LotPosition.MIDDLE },
    12: { areaSqm: 66, position: LotPosition.MIDDLE },
    13: { areaSqm: 66, position: LotPosition.MIDDLE },
    14: { areaSqm: 66, position: LotPosition.MIDDLE },
    15: { areaSqm: 66, position: LotPosition.MIDDLE },
    16: { areaSqm: 66, position: LotPosition.CORNER },
  },
  'mz-l': {
    1: { areaSqm: 83.54, position: LotPosition.CORNER },
    2: { areaSqm: 89.18, position: LotPosition.MIDDLE },
    3: { areaSqm: 86.94, position: LotPosition.MIDDLE },
    4: { areaSqm: 92.48, position: LotPosition.CORNER },
    5: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    6: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    7: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    8: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    9: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    10: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    11: { areaSqm: 68.75, position: LotPosition.CORNER },
    12: { areaSqm: 68.75, position: LotPosition.CORNER },
    13: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    14: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    15: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    16: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    17: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    18: { areaSqm: 68.75, position: LotPosition.MIDDLE },
  },
  'mz-m': {
    1: { areaSqm: 91.4, position: LotPosition.CORNER },
    2: { areaSqm: 96.98, position: LotPosition.MIDDLE },
    3: { areaSqm: 88.13, position: LotPosition.MIDDLE },
    4: { areaSqm: 90.57, position: LotPosition.CORNER },
    5: { areaSqm: 66, position: LotPosition.MIDDLE },
    6: { areaSqm: 66, position: LotPosition.MIDDLE },
    7: { areaSqm: 66, position: LotPosition.MIDDLE },
    8: { areaSqm: 66, position: LotPosition.MIDDLE },
    9: { areaSqm: 66, position: LotPosition.MIDDLE },
    10: { areaSqm: 66, position: LotPosition.CORNER },
    11: { areaSqm: 66, position: LotPosition.CORNER },
    12: { areaSqm: 66, position: LotPosition.MIDDLE },
    13: { areaSqm: 66, position: LotPosition.MIDDLE },
    14: { areaSqm: 66, position: LotPosition.MIDDLE },
    15: { areaSqm: 66, position: LotPosition.MIDDLE },
    16: { areaSqm: 66, position: LotPosition.MIDDLE },
  },
  'mz-n': {
    1: { areaSqm: 91.4, position: LotPosition.CORNER },
    2: { areaSqm: 80.63, position: LotPosition.MIDDLE },
    3: { areaSqm: 73.96, position: LotPosition.MIDDLE },
    4: { areaSqm: 76.52, position: LotPosition.CORNER },
    5: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    6: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    7: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    8: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    9: { areaSqm: 116.71, position: LotPosition.CORNER },
    10: { areaSqm: 92.78, position: LotPosition.CORNER },
    11: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    12: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    13: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    14: { areaSqm: 68.75, position: LotPosition.MIDDLE },
  },
  'mz-o': {
    8: { areaSqm: 66, position: LotPosition.CORNER },
    9: { areaSqm: 66, position: LotPosition.MIDDLE },
    10: { areaSqm: 66, position: LotPosition.MIDDLE },
    11: { areaSqm: 66, position: LotPosition.MIDDLE },
    12: { areaSqm: 66, position: LotPosition.MIDDLE },
    13: { areaSqm: 66, position: LotPosition.MIDDLE },
    14: { areaSqm: 66, position: LotPosition.MIDDLE },
    15: { areaSqm: 66, position: LotPosition.MIDDLE },
    16: { areaSqm: 66, position: LotPosition.MIDDLE },
    17: { areaSqm: 66, position: LotPosition.MIDDLE },
    18: { areaSqm: 66, position: LotPosition.MIDDLE },
    19: { areaSqm: 66, position: LotPosition.MIDDLE },
    20: { areaSqm: 66, position: LotPosition.MIDDLE },
    21: { areaSqm: 66, position: LotPosition.MIDDLE },
    22: { areaSqm: 72, position: LotPosition.CORNER },
  },
  'mz-p': {
    1: { areaSqm: 80.81, position: LotPosition.CORNER },
    2: { areaSqm: 86.40, position: LotPosition.MIDDLE },
    3: { areaSqm: 92.03, position: LotPosition.MIDDLE },
    4: { areaSqm: 69.50, position: LotPosition.CORNER },
    5: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    6: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    7: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    8: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    9: { areaSqm: 68.75, position: LotPosition.CORNER },
    11: { areaSqm: 68.75, position: LotPosition.CORNER },
    12: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    13: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    14: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    15: { areaSqm: 68.75, position: LotPosition.MIDDLE },
  },
  'mz-q': {
    1: { areaSqm: 64.77, position: LotPosition.CORNER },
    2: { areaSqm: 64.75, position: LotPosition.MIDDLE },
    3: { areaSqm: 69.50, position: LotPosition.MIDDLE },
    4: { areaSqm: 69.50, position: LotPosition.CORNER },
    5: { areaSqm: 66, position: LotPosition.MIDDLE },
    6: { areaSqm: 66, position: LotPosition.MIDDLE },
    7: { areaSqm: 66, position: LotPosition.MIDDLE },
    8: { areaSqm: 66, position: LotPosition.MIDDLE },
    9: { areaSqm: 66, position: LotPosition.MIDDLE },
    10: { areaSqm: 66, position: LotPosition.MIDDLE },
    11: { areaSqm: 66, position: LotPosition.MIDDLE },
    12: { areaSqm: 66, position: LotPosition.MIDDLE },
    13: { areaSqm: 66, position: LotPosition.MIDDLE },
    14: { areaSqm: 66, position: LotPosition.MIDDLE },
    15: { areaSqm: 66, position: LotPosition.MIDDLE },
    16: { areaSqm: 66, position: LotPosition.CORNER },
    17: { areaSqm: 66, position: LotPosition.CORNER },
    18: { areaSqm: 66, position: LotPosition.MIDDLE },
    19: { areaSqm: 66, position: LotPosition.MIDDLE },
    20: { areaSqm: 66, position: LotPosition.MIDDLE },
    21: { areaSqm: 66, position: LotPosition.MIDDLE },
    22: { areaSqm: 66, position: LotPosition.MIDDLE },
    23: { areaSqm: 66, position: LotPosition.MIDDLE },
    24: { areaSqm: 66, position: LotPosition.MIDDLE },
    25: { areaSqm: 66, position: LotPosition.MIDDLE },
    26: { areaSqm: 66, position: LotPosition.MIDDLE },
    27: { areaSqm: 66, position: LotPosition.MIDDLE },
    28: { areaSqm: 66, position: LotPosition.MIDDLE },
  },
  'mz-r': {
    1: { areaSqm: 80.81, position: LotPosition.CORNER },
    2: { areaSqm: 86.40, position: LotPosition.MIDDLE },
    3: { areaSqm: 92.02, position: LotPosition.MIDDLE },
    4: { areaSqm: 92.02, position: LotPosition.CORNER },
    5: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    6: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    7: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    8: { areaSqm: 68.75, position: LotPosition.CORNER },
    10: { areaSqm: 68.75, position: LotPosition.CORNER },
    11: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    12: { areaSqm: 68.75, position: LotPosition.MIDDLE },
    13: { areaSqm: 68.75, position: LotPosition.MIDDLE },
  },
};

// ---------------------------------------------------------------------------
// Unidades
// ---------------------------------------------------------------------------

/**
 * Los lotes de una manzana como unidades vendibles.
 *
 * Sin recorte salen igual: existen, tienen código y tienen su render, pero no
 * se pueden pulsar sobre la toma de la zona. Es el caso de la Zona 2 mientras
 * no lleguen sus coordenadas.
 */
export const buildBlockUnits = (block: LotBlock): Unit[] => {
  const places = LOT_HOTSPOTS[block.id] ?? {};
  const attributes = LOT_ATTRIBUTES[block.id] ?? {};

  return block.lots.map((number, index) => {
    const place = places[number];
    const attrs = attributes[number] ?? {};
    // Normalmente el archivo se llama como el lote (`P_11.png` es el lote 11,
    // y por eso los huecos de la P y la R también faltan entre los archivos).
    // Solo cuando la manzana declara `firstFileNumber` se cuenta por posición.
    const fileNumber =
      block.firstFileNumber === undefined ? number : block.firstFileNumber + index;

    return {
      id: `${block.id}:lot-${number}`,
      identifier: buildLotIdentifier(block, number),
      kind: UnitKind.LOT,
      // El estado sale del inventario declarado arriba. Mientras no llegue,
      // todas figuran disponibles: es una afirmación comercial, y por eso el
      // valor de reserva está en una constante con nombre y no suelto aquí.
      status: attrs.status ?? DEFAULT_LOT_STATUS,
      elementId: block.id,
      // El acotado va primero y el limpio de respaldo: ver `lotMeasuredPlanImage`.
      planImageMeasured: lotMeasuredPlanImage(block.id, fileNumber),
      planImage: lotPlanImage(block.id, fileNumber),
      x: place?.x,
      y: place?.y,
      path: place?.path,
      // Área y posición: lo que haya en `LOT_ATTRIBUTES`. Sin declarar quedan
      // en `undefined` a propósito —"sin dato", no "0 m²"— para que el filtro
      // pueda distinguir un lote que no encaja de uno del que no se sabe.
      areaSqm: attrs.areaSqm,
      lotPosition: attrs.position,
      // Oculto: no se rotula, solo elige el giro del módulo en la ficha.
      lotFacing: lotFacingOf(block.id, number),
    };
  });
};

/** Todos los terrenos entregados, de las ocho manzanas. */
export const lotUnits: Unit[] = lotBlocks.flatMap(buildBlockUnits);

/** Manzanas de una zona. */
export const blocksOfZone = (zoneId: ZoneId): LotBlock[] =>
  lotBlocks.filter((block) => block.zoneId === zoneId);

/**
 * Terrenos que caen en la toma de una zona. Los que todavía no tienen recorte
 * se quedan fuera: existen como unidad, pero no hay dónde pulsarlos.
 */
export const clickableLotsOfZone = (zoneId: ZoneId): Unit[] => {
  const ids = new Set(blocksOfZone(zoneId).map((block) => block.id));
  return lotUnits.filter((unit) => unit.elementId && ids.has(unit.elementId) && unit.path);
};

// ---------------------------------------------------------------------------
// Filtro de terrenos
// ---------------------------------------------------------------------------
// Los tres ejes que pidió el cliente: área, posición y disponibilidad. Vive
// aquí y no en el componente porque es una regla del catálogo, no de la
// pantalla: el mismo filtro lo va a necesitar el dashboard.

/** Selección activa del filtro. Un eje vacío = ese eje no filtra. */
export interface LotFilter {
  /** Ids de manzana (`mz-o`, `mz-p`, etc.). */
  blockIds: string[];
  /** Áreas exactas en m², de las que ofrece `lotAreaOptions()`. */
  areas: number[];
  positions: LotPosition[];
  statuses: UnitStatus[];
}

export const EMPTY_LOT_FILTER: LotFilter = {
  blockIds: [],
  areas: [],
  positions: [],
  statuses: [],
};

export const isLotFilterActive = (filter: LotFilter): boolean =>
  filter.blockIds.length > 0 ||
  filter.areas.length > 0 ||
  filter.positions.length > 0 ||
  filter.statuses.length > 0;

/** Todos los terrenos de una zona, tengan o no recorte medido. */
export const lotsOfZone = (zoneId: ZoneId): Unit[] => {
  const ids = new Set(blocksOfZone(zoneId).map((block) => block.id));
  return lotUnits.filter((unit) => unit.elementId && ids.has(unit.elementId));
};

/**
 * ¿Este terreno entra en la selección?
 *
 * Un eje sin nada marcado no filtra. Un lote SIN DATO en un eje que sí se está
 * filtrando queda fuera: no se puede afirmar que un lote del que no se sabe el
 * área mida 66 m². Es la diferencia entre "no encaja" y "no se sabe", y por eso
 * el panel enseña aparte cuántos se quedaron sin clasificar.
 */
export const matchesLotFilter = (lot: Unit, filter: LotFilter): boolean => {
  if (filter.blockIds.length > 0) {
    if (!lot.elementId || !filter.blockIds.includes(lot.elementId)) return false;
  }

  if (filter.areas.length > 0) {
    if (lot.areaSqm === undefined) return false;
    if (!filter.areas.includes(lot.areaSqm)) return false;
  }

  if (filter.positions.length > 0) {
    if (!lot.lotPosition) return false;
    if (!filter.positions.includes(lot.lotPosition)) return false;
  }

  if (filter.statuses.length > 0 && !filter.statuses.includes(lot.status)) return false;

  return true;
};

/**
 * Las áreas que existen de verdad en una zona, ordenadas de menor a mayor. El
 * filtro se construye con esto en lugar de con tramos inventados: si el
 * inventario solo trae 66, 78 y 108 m², esas son las tres opciones, y si
 * mañana aparece un lote de 91 m² sale solo.
 */
export const lotAreaOptions = (zoneId: ZoneId): number[] => {
  const areas = new Set<number>();
  for (const lot of lotsOfZone(zoneId)) {
    if (lot.areaSqm !== undefined) areas.add(lot.areaSqm);
  }
  return [...areas].sort((a, b) => a - b);
};

/**
 * ¿Hay algún terreno de la zona con la POSICIÓN declarada?
 *
 * Es por eje, y no un "¿hay inventario?" a secas, porque el área y la posición
 * no llegan a la vez: hoy están las 133 áreas y solo 57 posiciones. Un aviso
 * que mirase las dos juntas se apagaría al llegar las áreas y dejaría el filtro
 * de posición devolviendo cero sin decir por qué — que es justo lo que pasó al
 * cargar las de la Zona 2.
 */
export const hasLotPositionInventory = (zoneId: ZoneId): boolean =>
  lotsOfZone(zoneId).some((lot) => lot.lotPosition !== undefined);
