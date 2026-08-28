"use client";

// ============================================================================
// COMPARADOR DÍA / NOCHE DE UN PUNTO DE VISTA
// ----------------------------------------------------------------------------
// La misma toma a dos horas, una encima de otra, con una cortina que se arrastra
// por el medio: a la izquierda queda el día y a la derecha la noche. Llevándola
// a un extremo se ve una de las dos entera.
//
// Por qué funciona el truco: las dos tomas del cliente comparten encuadre EXACTO
// —las mismas personas en el mismo sitio, ver `docs/02-ASSETS.md`—, así que al
// descubrir una sobre la otra no se mueve nada y solo cambia la luz. Si algún
// día llegaran desalineadas, el efecto se rompe y no hay forma de arreglarlo
// desde aquí.
//
// Las dos imágenes se dibujan con `object-contain` dentro del MISMO hueco, que
// es lo que garantiza que caigan píxel sobre píxel sea cual sea la ventana. La
// cortina se recorta con `clip-path` sobre la de día y no cambiando su ancho:
// con el ancho, la imagen se reescalaría al arrastrar y se vería encogerse en
// lugar de descubrirse.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { MoveHorizontal, Sun, Moon, X } from 'lucide-react';

import { getAssetUrl } from '@/utils/assets';
import type { Viewpoint } from '@/data/urbanization/types';

/** Dónde arranca la cortina: por la mitad, que es lo que enseña las dos. */
const INITIAL_POSITION = 50;

/** Cuánto se mueve con cada pulsación de flecha. */
const KEYBOARD_STEP = 4;

const clamp = (value: number) => Math.min(100, Math.max(0, value));

const ViewpointCompare = ({
  point,
  onClose,
}: {
  point: Viewpoint;
  onClose: () => void;
}) => {
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [isDragging, setIsDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);

  const dayUrl = point.image ? getAssetUrl(point.image) : '';
  const nightUrl = point.imageNight ? getAssetUrl(point.imageNight) : '';

  /**
   * Traduce la posición del puntero a porcentaje de la cortina. Se mide contra
   * el MARCO y no contra la imagen: la imagen va centrada con `object-contain`
   * y su caja real depende de la proporción de la ventana, así que medir contra
   * ella daría un desfase que cambia al redimensionar.
   */
  const updateFromPointer = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const { left, width } = frame.getBoundingClientRect();
    if (width === 0) return;
    setPosition(clamp(((clientX - left) / width) * 100));
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
      updateFromPointer(event.clientX);
    },
    [updateFromPointer],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      updateFromPointer(event.clientX);
    },
    [isDragging, updateFromPointer],
  );

  const stopDragging = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDragging(false);
  }, []);

  // Escape cierra, flechas mueven la cortina. Sin esto el comparador sería el
  // único sitio del recorrido del que no se sale con el teclado.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // Se detiene aquí: en la zona las flechas cambian de zona, y con el
        // comparador abierto eso dejaría la cortina sobre una toma que ya no es.
        event.preventDefault();
        event.stopPropagation();
        const step = event.key === 'ArrowLeft' ? -KEYBOARD_STEP : KEYBOARD_STEP;
        setPosition((prev) => clamp(prev + step));
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-neutral-950/95 backdrop-blur-sm animate-in fade-in duration-300">
      {/*
        Arriba solo va la X. La esquina de arriba a la izquierda no es sitio:
        ahí están el botón de menú y el de marcar coordenadas, que van por
        encima de todo esto y se comerían el rótulo. Por eso el nombre de la
        vista baja a la barra de abajo.

        Y a la derecha arranca en `right-[4.5rem]`, no pegada al borde, por lo
        mismo que los botones de volver del recorrido: en esa esquina está el
        botón de pantalla completa, que va por encima (`z-[55]`) y taparía la X
        dejando el comparador sin forma visible de cerrarse.
      */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar la comparación"
        className="absolute top-5 right-[4.5rem] z-10 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/80 flex items-center justify-center hover:bg-black/80 hover:text-white transition-colors cursor-pointer"
      >
        <X size={16} strokeWidth={2} />
      </button>

      <div
        ref={frameRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        className={`relative flex-1 min-h-0 overflow-hidden select-none touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Noche: la capa de abajo, siempre entera. */}
        <img
          src={nightUrl}
          alt={`${point.label} de noche`}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Día: encima, recortada por la cortina. */}
        <img
          src={dayUrl}
          alt={`${point.label} de día`}
          draggable={false}
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Rótulos abajo, por lo mismo que la X: arriba está ocupado. Cada uno
            se apaga cuando la cortina se ha comido su mitad. */}
        <span
          className={`absolute bottom-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-bold pointer-events-none transition-opacity duration-200 ${
            position > 12 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Sun size={12} strokeWidth={2.5} /> Día
        </span>

        <span
          className={`absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-bold pointer-events-none transition-opacity duration-200 ${
            position < 88 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Moon size={12} strokeWidth={2.5} /> Noche
        </span>

        {/* La cortina. El tirador es un input de rango para el lector de
            pantalla: la barra ya se arrastra con el ratón, pero sin esto no
            habría manera de saber en qué posición está. */}
        <div
          style={{ left: `${position}%` }}
          className="absolute inset-y-0 -translate-x-1/2 w-px bg-white/80 shadow-[0_0_12px_rgba(0,0,0,0.8)] pointer-events-none"
        >
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 text-neutral-900 flex items-center justify-center shadow-2xl">
            <MoveHorizontal size={18} strokeWidth={2.5} />
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(position)}
          onChange={(event) => setPosition(clamp(Number(event.target.value)))}
          aria-label="Proporción entre la vista de día y la de noche"
          className="sr-only"
        />
      </div>

      <div className="shrink-0 flex items-baseline justify-center gap-2 px-5 py-3 text-center">
        <p className="text-white font-primary text-[11px] uppercase tracking-[0.2em] font-bold truncate">
          {point.caption ?? point.label}
        </p>
        <span className="text-white/25">·</span>
        <p className="text-[10px] text-white/35 truncate">
          Arrastra la barra para pasar del día a la noche.
        </p>
      </div>
    </div>
  );
};

export default ViewpointCompare;
