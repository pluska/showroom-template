"use client";

// ============================================================================
// TARJETAS DE FASE — un rectángulo VERTICAL por fase
// ----------------------------------------------------------------------------
// Se usa desde /amenidades para entrar a la galería de amenidades de cada fase.
//
// Nada aquí asume cuántas son: se recorre la lista que llega por props. El
// difuminado y el rótulo "Próximamente" salen de `status`, no de una lista
// aparte, así que cuando la Fase 2 pase a AVAILABLE su tarjeta se ve nítida
// sola. Ver src/data/urbanization/phases.ts.
// ============================================================================

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { getAssetUrl } from '@/utils/assets';
import { PhaseStatus } from '@/data/urbanization/enums';

export interface PhaseCardItem {
  phaseId: string;
  label: string;
  status: PhaseStatus;
  image: string;
  /** Destino cuando la fase es navegable. Sin href, la tarjeta no es clicable. */
  href?: string;
  /** Rótulo mostrado cuando la fase no está disponible. */
  note?: string;
}

const CardInner = ({ item }: { item: PhaseCardItem }) => {
  const isAvailable = item.status === PhaseStatus.AVAILABLE;

  return (
    <>
      {/* La toma de la fase. Las no disponibles van borrosas y desaturadas. */}
      <img
        src={getAssetUrl(item.image)}
        alt={item.label}
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
          isAvailable
            ? 'group-hover:scale-105'
            : 'blur-md scale-110 grayscale-[35%] brightness-75'
        }`}
        // Mientras R2 no tenga la toma de esa fase, ocultarla en vez de dejar
        // el ícono de imagen rota: el degradado de abajo sostiene la tarjeta.
        onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

      {/*
        El realce del hover. Va REDONDEADO igual que la tarjeta: el anillo es un
        recuadro dentro de un `overflow-hidden rounded-2xl`, así que sin radio
        propio sus cuatro esquinas quedaban recortadas y el borde no cerraba.
        Se notaba poco con las tarjetas pequeñas y mucho al agrandarlas.
      */}
      {isAvailable && (
        <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-inset ring-white/70 transition-all duration-300" />
      )}

      <div className="relative z-10 h-full flex flex-col items-center justify-end text-center p-5 lg:p-6">
        {!isAvailable && (
          <div className="mb-auto mt-auto flex flex-col items-center gap-2 text-white/90">
            <Lock size={22} strokeWidth={1.5} />
            <span className="text-[10px] lg:text-xs uppercase tracking-[0.2em] font-semibold">
              {item.note}
            </span>
          </div>
        )}

        <h3
          className={`font-primary uppercase tracking-[0.18em] text-white font-bold ${
            isAvailable ? 'text-base lg:text-xl' : 'text-sm lg:text-base opacity-80'
          }`}
        >
          {item.label}
        </h3>

        {isAvailable && (
          <span className="mt-2 text-[10px] lg:text-[11px] uppercase tracking-[0.2em] text-white/80 font-secondary">
            Explorar
          </span>
        )}
      </div>
    </>
  );
};

/** Rectángulo vertical (2:3). Clicable solo si la fase trae `href`. */
const PhaseCard = ({ item }: { item: PhaseCardItem }) => {
  const base =
    'group relative overflow-hidden rounded-2xl aspect-[2/3] w-full bg-neutral-900 shadow-2xl transition-all duration-500';

  if (!item.href) {
    return (
      <div className={`${base} cursor-not-allowed`} aria-disabled="true">
        <CardInner item={item} />
      </div>
    );
  }

  return (
    <Link href={item.href} className={`${base} hover:-translate-y-1 cursor-pointer`}>
      <CardInner item={item} />
    </Link>
  );
};

export default function PhaseCards({ items }: { items: PhaseCardItem[] }) {
  return (
    // El número de columnas sale de cuántas fases haya, no de una constante:
    // el grid estaba fijo en 3 y al pasar a 4 fases partía la fila en dos.
    // En móvil se queda en 2 columnas, porque cuatro rectángulos verticales
    // en una sola fila quedan demasiado angostos para leerse.
    //
    // EL TOPE LO PONE EL ALTO DE LA VENTANA, no un ancho fijo. Antes era
    // `max-w-4xl` —896 px— y en un monitor las cuatro tarjetas salían
    // diminutas en mitad de la pantalla, con el resto vacío. Ahora se calcula
    // al revés: se decide cuánto alto pueden ocupar (`--alto`, la ventana
    // menos la cabecera) y de ahí sale el ancho que necesitan siendo 2:3.
    //
    // Como además lleva `w-full`, el ancho real es el MENOR de los dos: manda
    // el alto en pantallas anchas y manda el ancho en las apaisadas. Así las
    // tarjetas son siempre lo más grandes que caben, y no desbordan por abajo
    // en ningún caso.
    <div
      style={{
        ['--fases' as string]: String(items.length),
        ['--hueco' as string]: '1.5rem',
        ['--alto' as string]: 'calc(var(--app-h) - 11rem)',
        ['--ancho' as string]:
          'calc(var(--alto) * 2 / 3 * var(--fases) + var(--hueco) * (var(--fases) - 1))',
      }}
      className="grid w-full mx-auto grid-cols-2 gap-3 sm:grid-cols-[repeat(var(--fases),minmax(0,1fr))] sm:gap-[var(--hueco)] sm:max-w-[var(--ancho)]"
    >
      {items.map((item) => (
        <PhaseCard key={item.phaseId} item={item} />
      ))}
    </div>
  );
}
