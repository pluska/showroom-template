// ============================================================================
// PUNTOS DE VISTA — desde dónde se mira cada zona
// ----------------------------------------------------------------------------
// Sobre la toma de una zona hay unos cuantos marcadores de cámara: el visitante
// pulsa uno y el panel le enseña la foto de lo que se vería plantado ahí. Es el
// "compás" del showroom — el círculo con el abanico apuntando en la dirección
// de la mirada.
//
// CÓMO ESTÁN MEDIDOS. Cada punto son DOS coordenadas tomadas con la
// herramienta del showroom (formato `polygon`, dos clics):
//
//     1º clic → dónde está la cámara      → `anchor`  (el círculo)
//     2º clic → algo que quede en el eje  → `target`  (hacia dónde mira)
//
// El ángulo NO se escribe: lo calcula `viewpointHeading()` a partir de esos dos
// puntos. Guardar grados a mano obligaría a convertirlos a ojo y a rehacer la
// tabla entera si la toma cambia; con dos clics se vuelve a medir en segundos.
//
// EL ORDEN ES EL EMPAREJAMIENTO CON LA FOTO. `order` empieza en 1, se pinta
// dentro del marcador y es lo que resuelve la clave R2: el punto 3 de la Zona 1
// enseña `urbanization/viewpoints/zone-1/3.day.webp`. Reordenar los puntos
// reordena las fotos — no hay nombre de archivo que lo desmienta.
//
// DE CADA PUNTO HAY DOS TOMAS, de día y de noche, con el encuadre exacto. El
// panel enseña la de día; la de noche solo sale en el comparador de cortina de
// la ficha. Si alguna faltara, el panel sigue funcionando: enseña el hueco
// rotulado en lugar de una imagen rota, y sin la de noche no hay cortina.
// ============================================================================

import { viewpointImage } from './assets';
import { ZoneId, ZoneLabel } from './enums';
import type { Viewpoint } from './types';

/** Un par de clics tal como sale de la herramienta de coordenadas. */
type MeasuredViewpoint = {
  anchor: { x: number; y: number };
  target: { x: number; y: number };
  label?: string;
  caption?: string;
};

/**
 * Lo medido sobre cada toma, en el orden en el que se numeran los marcadores.
 * Es lo único que hay que tocar para mover, añadir o quitar un punto.
 */
const MEASURED: Partial<Record<ZoneId, MeasuredViewpoint[]>> = {
  [ZoneId.ZONE_1]: [
    { anchor: { x: 11.6, y: 90.0 }, target: { x: 14.9, y: 87.8 } },
    { anchor: { x: 21.2, y: 89.0 }, target: { x: 23.2, y: 88.6 } },
    { anchor: { x: 32.3, y: 14.6 }, target: { x: 32.3, y: 22.2 } },
    { anchor: { x: 63.8, y: 16.1 }, target: { x: 63.8, y: 21.7 } },
  ],
  [ZoneId.ZONE_2]: [
    { anchor: { x: 10.7, y: 53.9 }, target: { x: 9.0, y: 48.5 } },
    { anchor: { x: 26.7, y: 61.9 }, target: { x: 26.7, y: 54.0 } },
    { anchor: { x: 31.5, y: 87.1 }, target: { x: 30.1, y: 83.1 } },
    { anchor: { x: 34.4, y: 90.8 }, target: { x: 36.8, y: 92.6 } },
  ],
  [ZoneId.ZONE_3]: [
    { anchor: { x: 7.9, y: 67.3 }, target: { x: 11.0, y: 66.4 } },
    { anchor: { x: 18.1, y: 35.6 }, target: { x: 21.8, y: 35.6 } },
    { anchor: { x: 25.6, y: 65.3 }, target: { x: 22.9, y: 65.4 } },
    { anchor: { x: 48.7, y: 67.2 }, target: { x: 46.0, y: 64.4 } },
  ],
};

const buildZoneViewpoints = (zoneId: ZoneId, measured: MeasuredViewpoint[]): Viewpoint[] =>
  measured.map((point, index) => {
    const order = index + 1;

    return {
      id: `${zoneId}:vp-${order}`,
      zoneId,
      order,
      label: point.label ?? `Vista ${order}`,
      anchor: point.anchor,
      target: point.target,
      image: viewpointImage(zoneId, order, 'day'),
      imageNight: viewpointImage(zoneId, order, 'night'),
      caption: point.caption ?? `${ZoneLabel[zoneId]} · Vista ${order}`,
    };
  });

/** Todos los puntos de vista declarados, de todas las zonas. */
export const viewpoints: Viewpoint[] = Object.entries(MEASURED).flatMap(([zoneId, measured]) =>
  buildZoneViewpoints(zoneId as ZoneId, measured ?? []),
);

/** Los puntos de vista de una zona, ya ordenados por su número. */
export const viewpointsOfZone = (zoneId: ZoneId): Viewpoint[] =>
  viewpoints.filter((point) => point.zoneId === zoneId).sort((a, b) => a.order - b.order);

/**
 * Hacia dónde mira el abanico, en grados, con 0° = hacia arriba de la toma y
 * el giro en el sentido de las agujas del reloj. Es lo que se le pasa al
 * `rotate()` del marcador.
 *
 * El `+ 90` es la conversión entre las dos convenciones: `atan2` mide desde el
 * eje X hacia la derecha, y el marcador se dibuja apuntando hacia arriba.
 *
 * Ojo: se calcula en el espacio 0–100 de la imagen, que NO es cuadrado. Para
 * que el ángulo salga en grados de pantalla y no en grados deformados, el
 * componente corrige la componente vertical con la proporción real de la toma
 * (ver `ViewpointMarker`).
 */
export const viewpointHeading = (point: Viewpoint, aspectRatio = 1): number => {
  const dx = point.target.x - point.anchor.x;
  const dy = (point.target.y - point.anchor.y) / aspectRatio;
  return (Math.atan2(dy, dx) * 180) / Math.PI + 90;
};
