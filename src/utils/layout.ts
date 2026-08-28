/**
 * Ancho real de la caja de la app, en píxeles.
 *
 * `ForcedLandscapeWrapper` gira la app 90° en el móvil, y entonces lo que se
 * dibuja mide de ancho el ALTO de la ventana, no su ancho: `window.innerWidth`
 * mide el teléfono de pie y contesta 375 donde la caja tiene 812.
 *
 * La señal de que el giro está puesto es el mismo atributo que globals.css usa
 * para reabrir los breakpoints, así que el CSS y el JS que decide un layout
 * inicial leen la misma verdad y no pueden discrepar.
 *
 * En el servidor no hay caja que medir: se contesta el ancho de escritorio, que
 * es la hipótesis que menos sorprende antes de hidratar.
 */
export const appBoxWidth = (): number => {
  if (typeof window === 'undefined') return 1280;

  return document.documentElement.dataset.flBp !== undefined
    ? window.innerHeight
    : window.innerWidth;
};
