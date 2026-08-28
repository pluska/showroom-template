"use client";

// ============================================================================
// TARJETAS DE AMENIDADES — rectángulos verticales (2:3) para cada amenidad
// ----------------------------------------------------------------------------
// Se usa en /amenidades/[phaseId] para explorar las amenidades de una fase.
// Al hacer clic en cualquier tarjeta, se abre el visor inmersivo de galería.
// ============================================================================

import { Images } from 'lucide-react';
import { getAssetUrl } from '@/utils/assets';
import type { PhaseAmenity } from '@/data/urbanization/types';

interface AmenityCardProps {
  amenity: PhaseAmenity;
  onSelect: (amenity: PhaseAmenity) => void;
}

const AmenityCard = ({ amenity, onSelect }: AmenityCardProps) => {
  return (
    <button
      onClick={() => onSelect(amenity)}
      className="group relative overflow-hidden rounded-2xl aspect-[2/3] w-full bg-neutral-900 shadow-2xl transition-all duration-500 hover:-translate-y-1 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {/* Imagen de portada */}
      <img
        src={getAssetUrl(amenity.coverImage)}
        alt={amenity.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.style.visibility = 'hidden';
        }}
      />

      {/* Degradado oscuro */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />

      {/* Anillo de hover redondeado */}
      <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-inset ring-white/70 transition-all duration-300" />

      {/* Contenido */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between p-5 lg:p-6 text-center">
        {/* Badge superior con cantidad de fotos */}
        <div className="w-full flex justify-end">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-[10px] text-white/90 uppercase tracking-widest font-secondary font-medium shadow-sm">
            <Images size={11} className="text-brand-primary" />
            {amenity.photoCount} {amenity.photoCount === 1 ? 'Foto' : 'Fotos'}
          </span>
        </div>

        {/* Textos inferiores */}
        <div className="w-full flex flex-col items-center">
          <h3 className="font-primary uppercase tracking-[0.18em] text-white font-bold text-base lg:text-xl leading-tight">
            {amenity.title}
          </h3>

          {amenity.subtitle && (
            <p className="mt-1 text-xs text-white/70 font-secondary font-light line-clamp-1">
              {amenity.subtitle}
            </p>
          )}

          <span className="mt-3 text-[10px] lg:text-[11px] uppercase tracking-[0.22em] text-brand-primary group-hover:text-white font-semibold font-secondary transition-colors">
            Explorar Galería
          </span>
        </div>
      </div>
    </button>
  );
};

export default function AmenityCards({
  items,
  onSelectAmenity,
}: {
  items: PhaseAmenity[];
  onSelectAmenity: (amenity: PhaseAmenity) => void;
}) {
  return (
    <div
      style={{
        ['--fases' as string]: String(items.length),
        ['--hueco' as string]: '1.5rem',
        ['--alto' as string]: 'calc(var(--app-h) - 12rem)',
        ['--ancho' as string]:
          'calc(var(--alto) * 2 / 3 * var(--fases) + var(--hueco) * (var(--fases) - 1))',
      }}
      className="grid w-full mx-auto grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-[var(--hueco)] sm:max-w-[var(--ancho)]"
    >
      {items.map((amenity) => (
        <AmenityCard key={amenity.id} amenity={amenity} onSelect={onSelectAmenity} />
      ))}
    </div>
  );
}
