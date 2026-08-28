"use client";

// ============================================================================
// MARCADOR DE PUNTO DE VISTA — la cámara con el compás
// ----------------------------------------------------------------------------
// El círculo con el icono de cámara marca DÓNDE estaría plantado el visitante;
// el abanico de cuatro aspas que sale de él marca HACIA DÓNDE mira. Al pulsarlo
// el panel de la zona resalta la foto de esa vista.
//
// TODOS LOS MARCADORES MIDEN LO MISMO. El compás se dibuja en PÍXELES fijos
// —60 de ancho por 40 de alto— y no en una caja que escale con la toma. Antes
// el marcador crecía con el punto de ruptura y las aspas salían de un tamaño en
// una pantalla y de otro en la siguiente; ahora los cuatro destellos son la
// misma cuña girada, y son idénticos en las tres zonas y en cualquier ventana.
//
// LAS CUATRO ASPAS SON LA MISMA PIEZA. Misma abertura (6°), mismos radios,
// mismos huecos entre ellas (6,5°): lo único que cambia es el giro. Así no hay
// forma de que una salga más gorda o más larga que otra.
//
// POR QUÉ ES HTML Y NO UN <path> DENTRO DEL SVG DE LA ZONA. El SVG de recortes
// se dibuja con `viewBox="0 0 100 100"` y `preserveAspectRatio="none"`: estira
// el espacio de forma distinta en X y en Y para que los polígonos calquen la
// toma. A un polígono de manzana eso no le afecta —se deforma igual que la
// imagen—, pero a un círculo lo convertiría en óvalo y al abanico le torcería
// las aspas.
//
// EL ÁNGULO. Llega ya calculado en grados de pantalla (`viewpointHeading()`,
// con la proporción real de la toma), con 0° = arriba. Solo gira el abanico:
// la cámara se queda derecha, porque un icono cabeza abajo no se lee.
// ============================================================================

import { Camera } from 'lucide-react';

// ---------------------------------------------------------------------------
// Geometría, en píxeles y con el origen en el centro del círculo
// ---------------------------------------------------------------------------

/** Medida del abanico, la que pidió el cliente. */
const FAN_WIDTH = 60;
const FAN_HEIGHT = 40;

/** Radio del círculo de la cámara. */
const CIRCLE_RADIUS = 10;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/**
 * Radio del arco exterior. Es el único valor elegido a ojo; todo lo demás se
 * despeja de él y de las dos medidas pedidas. Cualquier valor mayor que medio
 * ancho vale: cuanto más grande, más plano y más abierto sale el abanico.
 */
const BLADE_OUTER_RADIUS = 54;

/**
 * Media abertura del abanico entero. Sale de la anchura pedida: la cuerda que
 * cruza el arco exterior de punta a punta tiene que medir `FAN_WIDTH`.
 */
const FAN_HALF_ANGLE = (Math.asin(FAN_WIDTH / 2 / BLADE_OUTER_RADIUS) * 180) / Math.PI;

/** Media abertura de cada aspa. Las cuatro, la misma. */
const BLADE_HALF_WIDTH = 6;

/**
 * Hueco entre aspas. Se despeja para que las cuatro cuñas y los tres huecos
 * llenen exactamente el abanico: 4·(2·w) + 3·g = 2·mediaAbertura.
 * Repartido así, el hueco del centro mide igual que los otros dos.
 */
const BLADE_GAP = (2 * FAN_HALF_ANGLE - 8 * BLADE_HALF_WIDTH) / 3;

/**
 * Dónde arranca el abanico, despejado para que la figura mida EXACTAMENTE los
 * 40 px de alto que se pidieron.
 *
 * No es `radioExterior − 40`: las aspas son cuñas rectas, no un arco, así que
 * el punto más alto de la figura no está en la vertical sino en el borde
 * interior de las dos aspas centrales, y el más bajo en la esquina interior de
 * las dos de fuera. Restar a secas dejaría la figura un par de píxeles más
 * alta de la cuenta —que es justo lo que medía antes.
 */
const BLADE_INNER_RADIUS =
  (BLADE_OUTER_RADIUS * Math.cos(toRadians(BLADE_GAP / 2)) - FAN_HEIGHT) /
  Math.cos(toRadians(FAN_HALF_ANGLE));

/** Centro de cada aspa, medido desde la vertical. */
const BLADE_ANGLES = [
  -(3 * BLADE_HALF_WIDTH + 1.5 * BLADE_GAP),
  -(BLADE_HALF_WIDTH + 0.5 * BLADE_GAP),
  BLADE_HALF_WIDTH + 0.5 * BLADE_GAP,
  3 * BLADE_HALF_WIDTH + 1.5 * BLADE_GAP,
];

/** El lienzo tiene que dar cabida al abanico en CUALQUIER giro. */
const BOX = Math.ceil(BLADE_OUTER_RADIUS + 4) * 2;

/** Una cuña del abanico, como sector de corona circular. */
const bladePath = (angle: number): string => {
  const point = (deg: number, radius: number) => {
    const rad = toRadians(deg - 90);
    return `${(Math.cos(rad) * radius).toFixed(2)} ${(Math.sin(rad) * radius).toFixed(2)}`;
  };

  const from = angle - BLADE_HALF_WIDTH;
  const to = angle + BLADE_HALF_WIDTH;

  return [
    `M ${point(from, BLADE_INNER_RADIUS)}`,
    `L ${point(from, BLADE_OUTER_RADIUS)}`,
    `L ${point(to, BLADE_OUTER_RADIUS)}`,
    `L ${point(to, BLADE_INNER_RADIUS)}`,
    'Z',
  ].join(' ');
};

const BLADES = BLADE_ANGLES.map(bladePath);

export interface ViewpointMarkerProps {
  /** Dónde cae el círculo, en % de la toma. */
  x: number;
  y: number;
  /** Grados en el sentido del reloj; 0 = el abanico mira hacia arriba. */
  heading: number;
  /** Número que se pinta junto al círculo: es el que empareja con la foto. */
  order: number;
  label: string;
  isActive?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick: () => void;
}

const ViewpointMarker = ({
  x,
  y,
  heading,
  order,
  label,
  isActive = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: ViewpointMarkerProps) => {
  const highlighted = isActive || isHovered;

  return (
    /*
      El botón ocupa el cuadro entero para que el abanico quepa girado, pero NO
      captura el ratón: un cuadro de 116 px alrededor de cada marcador se comería
      los recortes de los lotes que tiene debajo y los de los marcadores vecinos.
      Lo que captura es la figura —aspas, círculo y número—, y el clic sube al
      botón por sí solo.
    */
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      aria-label={label}
      aria-pressed={isActive}
      style={{ left: `${x}%`, top: `${y}%`, width: BOX, height: BOX }}
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none group focus:outline-none"
    >
      <svg
        viewBox={`${-BOX / 2} ${-BOX / 2} ${BOX} ${BOX}`}
        className={`absolute inset-0 w-full h-full transition-transform duration-300 ${
          highlighted ? 'scale-110' : 'group-hover:scale-110'
        }`}
      >
        <g transform={`rotate(${heading})`}>
          {BLADES.map((d, index) => (
            <path
              key={index}
              d={d}
              className={`pointer-events-auto cursor-pointer transition-colors duration-300 ${
                highlighted
                  ? 'fill-brand-orange'
                  : 'fill-white/85 group-hover:fill-brand-light-orange'
              }`}
              // El contorno oscuro es lo que separa el abanico de una toma
              // aérea clara: sin él, sobre una calle de cemento desaparece.
              stroke="rgba(0,0,0,0.45)"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
          ))}
        </g>

        <circle
          cx="0"
          cy="0"
          r={CIRCLE_RADIUS}
          className={`pointer-events-auto cursor-pointer transition-colors duration-300 ${
            highlighted ? 'fill-brand-orange' : 'fill-brand-primary group-hover:fill-brand-orange'
          }`}
          stroke="white"
          strokeWidth="1.6"
        />
      </svg>

      {/* Icono y número: HTML encima del SVG para que no giren con el abanico. */}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-white pointer-events-none">
        <Camera size={11} strokeWidth={2.5} className="drop-shadow" />
      </span>

      <span
        style={{ left: `calc(50% + ${CIRCLE_RADIUS}px)`, top: `calc(50% + ${CIRCLE_RADIUS}px)` }}
        className={`absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white text-[9px] font-bold flex items-center justify-center pointer-events-auto cursor-pointer transition-colors duration-300 ${
          highlighted ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white'
        }`}
      >
        {order}
      </span>
    </button>
  );
};

export default ViewpointMarker;
