"use client";

// ============================================================================
// VIDEO DE TRANSICIÓN ENTRE VISTAS DE UN PLANO
// ----------------------------------------------------------------------------
// Los videos fuente traen una línea negra de ~3px quemada en el primer y
// último cuadro (artefacto de exportación). El video se ajusta con
// `object-contain` dentro de un contenedor cuya proporción cambia según el
// tamaño de pantalla y si el panel lateral está abierto o cerrado, así que
// la franja vacía ("letterbox") que puede quedar arriba/abajo del video no
// mide siempre lo mismo. Este componente mide ese hueco en tiempo real y
// tapa la costura con dos franjas blancas del tamaño justo, sin recortar
// el plano ni depender de un valor fijo que solo funcione en una pantalla.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

export interface TransitionVideoProps {
  src: string;
  onEnded: () => void;
  onError: () => void;
}

export default function TransitionVideo({ src, onEnded, onError }: TransitionVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Arranca en 6px (el margen mínimo que tapa la línea quemada) para que el
  // primer cuadro nunca se vea sin franja mientras se mide el video real.
  const [barHeight, setBarHeight] = useState(6);

  const recalc = useCallback(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || !video.videoWidth || !video.videoHeight) return;

    const boxW = container.clientWidth;
    const boxH = container.clientHeight;
    if (!boxW || !boxH) return;

    const boxAspect = boxW / boxH;
    const videoAspect = video.videoWidth / video.videoHeight;

    // Con object-contain, si el contenedor es más alto/angosto que el video,
    // este se ajusta por ancho y deja franjas vacías arriba/abajo (letterbox).
    // Si no, el video toca el borde superior/inferior directamente.
    const gap = boxAspect < videoAspect ? (boxH - boxW / videoAspect) / 2 : 0;

    // +6px de margen para cubrir también la línea quemada del video.
    setBarHeight(Math.ceil(gap + 6));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ResizeObserver dispara un primer callback (asíncrono) apenas se observa,
    // con el tamaño inicial — no hace falta llamar a recalc() de entrada.
    if (typeof ResizeObserver === 'undefined') {
      const raf = requestAnimationFrame(recalc);
      return () => cancelAnimationFrame(raf);
    }
    const observer = new ResizeObserver(recalc);
    observer.observe(container);
    return () => observer.disconnect();
  }, [recalc, src]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-10">
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        playsInline
        muted
        preload="auto"
        onLoadedMetadata={recalc}
        onCanPlay={(event) => {
          event.currentTarget.play().catch(() => {});
        }}
        onEnded={onEnded}
        onError={onError}
        className="absolute inset-0 h-full w-full object-contain"
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 bg-white"
        style={{ height: barHeight }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 bg-white"
        style={{ height: barHeight }}
      />
    </div>
  );
}
