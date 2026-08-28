"use client";

import { useStore } from "@/store/useStore";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/* Los mismos anchos que declaran los `@custom-variant` de globals.css. Si allí
   se cambia un breakpoint, se cambia aquí: son las dos mitades del mismo pacto. */
const BREAKPOINTS: readonly (readonly [string, number])[] = [
  ["sm", 640],
  ["md", 768],
  ["lg", 1024],
  ["xl", 1280],
];

/* Alto por debajo del cual una vista tiene que apretarse. Cubre a los teléfonos
   —girados, el alto de la caja es su ancho: 320-430px— y deja fuera a tablets y
   escritorio. Es el mismo umbral que la media query de `short:` en globals.css. */
const SHORT_BOX = 500;

export default function ForcedLandscapeWrapper({ children }: { children: React.ReactNode }) {
  const isForcedLandscape = useStore((state) => state.isForcedLandscape);
  const pathname = usePathname();

  // Exclude dashboard, login, and ubicacion routes from rotation
  const isExcluded = pathname?.startsWith('/dashboard') || pathname?.startsWith('/login') || pathname?.startsWith('/ubicacion');

  const shouldForceLandscape = isForcedLandscape && !isExcluded;

  /* Girada 90°, la caja tiene los ejes cambiados: su ANCHO es el alto de la
     ventana y su ALTO es el ancho. Nada de eso lo pueden ver ni las media
     queries ni `100vh`, que siguen midiendo el viewport físico, de pie. Así
     que se les dice por escrito, en <html>:

       · `data-fl-bp`    — los breakpoints que el ancho de la caja sí cumple;
         globals.css reabre `sm:`/`md:`/`lg:`/`xl:` para ellos. Sin esto la app
         dibujaba su layout de 375px sobre una caja de 812px.
       · `data-fl-short` — la caja es ancha pero BAJA. Los breakpoints sólo
         miden ancho, así que sin este aviso una caja de 812x375 se lleva la
         tipografía y los aires de escritorio, pensados para 800px de alto, y
         un titular se come la vista entera. Enciende la variante `short:`.
       · `--app-h`       — el alto de la caja, para lo que partía de `100dvh`.

     Al salir del modo se borran los tres y todo vuelve a las media queries. */
  useEffect(() => {
    const root = document.documentElement;

    const clear = () => {
      delete root.dataset.flBp;
      delete root.dataset.flShort;
      root.style.removeProperty("--app-h");
    };

    if (!shouldForceLandscape) {
      clear();
      return;
    }

    const sync = () => {
      const boxWidth = window.innerHeight;
      const boxHeight = window.innerWidth;

      root.dataset.flBp = BREAKPOINTS
        .filter(([, min]) => boxWidth >= min)
        .map(([name]) => name)
        .join(" ");

      if (boxHeight <= SHORT_BOX) root.dataset.flShort = "";
      else delete root.dataset.flShort;

      root.style.setProperty("--app-h", `${boxHeight}px`);
    };

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      clear();
    };
  }, [shouldForceLandscape]);

  return (
    <div 
      className={shouldForceLandscape ? "forced-landscape w-screen h-screen relative" : "w-full h-full relative"}
      style={shouldForceLandscape ? {
        width: '100vh',
        height: '100vw',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        zIndex: 1,
        overflow: 'hidden',
        backgroundColor: 'black'
      } : undefined}
    >
      {children}
    </div>
  );
}
