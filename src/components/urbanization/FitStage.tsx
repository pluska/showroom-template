"use client";

// ============================================================================
// ESCENARIO DE LA TOMA — a pantalla completa, y con UN solo espacio de coordenadas
// ----------------------------------------------------------------------------
// La toma tapa la ventana entera, como siempre. Lo que este componente cambia
// es QUÉ se recorta con ella.
//
// EL PROBLEMA. Antes la imagen se pintaba con `object-cover` y las capas de
// recortes iban en un SVG `0 0 100 100` estirado sobre la VENTANA. Son dos
// espacios distintos: `object-cover` agranda la imagen hasta tapar la ventana y
// deja fuera lo que sobra, mientras el SVG se deforma para llenarla. En una
// ventana 16:9 —la proporción de las tomas— coinciden por casualidad y todo
// parece correcto; en cualquier otra se separan, y un polígono medido en una
// pantalla cae desplazado en otra. Las coordenadas no eran de la toma: eran de
// la ventana en la que se midieron.
//
// CÓMO SE ARREGLA SIN DEJAR BANDAS. Se calcula el rectángulo con la proporción
// de la imagen que TAPA el contenedor (el mayor de los dos encajes, no el
// menor), y dentro van la imagen y las capas de recortes juntas. El
// contenedor recorta lo que sobresale, así que en pantalla se ve exactamente lo
// mismo que con `object-cover` — pero ahora los recortes se recortan CON la
// imagen en lugar de estirarse contra ella. El espacio 0–100 vuelve a ser el de
// la toma: una coordenada medida una vez vale en cualquier pantalla.
//
// Lo que cuesta: en una ventana muy distinta de 16:9, lo que se sale de cuadro
// se sale de verdad, marcadores incluidos. Un punto de vista al borde inferior
// de la toma (y ≈ 99) puede quedar fuera en una ventana ancha. Es el precio de
// cubrir la pantalla, y antes también se pagaba —solo que descolocando los
// recortes en vez de recortarlos.
//
// La cuenta la hace CSS con unidades de contenedor (`cqw`/`cqh`), no un
// `ResizeObserver`: la primera pintada ya sale colocada y el reajuste al girar
// la pantalla es instantáneo.
//
// La proporción se lee de la propia imagen al cargar (`naturalWidth/Height`),
// así que sirve igual para las tomas 16:9 y para las plantas, que no lo son.
// ============================================================================

import { createContext, useContext, useEffect, useState } from 'react';

/**
 * Por dónde el escenario activo se da a conocer. Lo usa la herramienta de
 * coordenadas: sin esto mediría contra la ventana —justo el espacio equivocado
 * que este componente viene a corregir— y escupiría coordenadas que no valen
 * en otra pantalla.
 */
const StageContext = createContext<((el: HTMLDivElement | null) => void) | null>(null);

export const StageProvider = StageContext.Provider;

export interface FitStageProps {
  src: string;
  alt: string;
  /** Fuerza el remontaje de la imagen al cambiar de toma (transición limpia). */
  imageKey?: string;
  /** Proporción de arranque, hasta que la imagen carga y dice la suya. */
  ratio?: number;
  imageClassName?: string;
  className?: string;
  /**
   * El hueco que la toma tiene que tapar. Por defecto, la pantalla entera. Se
   * puede encoger —p. ej. dejando sitio a un panel lateral— y la toma se
   * recoloca sola sin perder ni proporción ni coordenadas: el escenario sigue
   * siendo el rectángulo de la imagen, solo que reencuadrado.
   */
  containerClassName?: string;
  /** Medidas del hueco que no se pueden expresar con clases (p. ej. `right`). */
  containerStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

const FitStage = ({
  src,
  alt,
  imageKey,
  ratio: initialRatio = 16 / 9,
  imageClassName = '',
  className = '',
  containerClassName = 'absolute inset-0',
  containerStyle,
  children,
}: FitStageProps) => {
  const register = useContext(StageContext);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [ratio, setRatio] = useState(initialRatio);

  useEffect(() => {
    if (!register) return;
    register(element);
    return () => register(null);
  }, [register, element]);

  return (
    <div
      className={`${containerClassName} overflow-hidden`}
      style={{ containerType: 'size', ...containerStyle }}
    >
      {/*
        Centrado con `absolute` y no con flex a propósito: el escenario es MÁS
        GRANDE que su contenedor por definición, y un hijo que desborda un
        contenedor flex se descuelga hacia un solo lado. Con `left/top 50%` y el
        retroceso de media caja, el sobrante se reparte por igual a los cuatro
        lados — que es justo lo que hace `object-cover`.
      */}
      <div
        ref={setElement}
        data-showroom-stage=""
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${className}`}
        style={{
          width: `max(100cqw, calc(100cqh * ${ratio}))`,
          height: `max(100cqh, calc(100cqw / ${ratio}))`,
        }}
      >
        <img
          key={imageKey ?? src}
          src={src}
          alt={alt}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            if (naturalWidth > 0 && naturalHeight > 0) setRatio(naturalWidth / naturalHeight);
          }}
          // Una clave que todavía no está en el bucket dejaría el icono de
          // imagen rota encima de la toma. Se oculta y queda el fondo negro:
          // los rótulos y recortes siguen colocados donde toca.
          onError={(event) => {
            event.currentTarget.style.visibility = 'hidden';
          }}
          className={`absolute inset-0 w-full h-full object-cover ${imageClassName}`}
        />
        {children}
      </div>
    </div>
  );
};

export default FitStage;
