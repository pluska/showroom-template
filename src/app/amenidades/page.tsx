"use client";

// ============================================================================
// PESTAÑA AMENIDADES — portada con las fases del proyecto
// ----------------------------------------------------------------------------
// La pestaña ya no abre directo en la galería: primero muestra las tarjetas
// verticales, una por fase, y solo la Fase 1 es clicable. Las tarjetas salen
// de `amenitiesPhaseCards`, que ya resuelve el difuminado y el "Próximamente"
// a partir del `status` de cada fase.
// ============================================================================

import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import PhaseCards, { type PhaseCardItem } from '@/components/urbanization/PhaseCards';
import { amenitiesPhaseCards } from '@/data/urbanization/amenities-tab';

const items: PhaseCardItem[] = amenitiesPhaseCards;

export default function AmenidadesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative w-full h-app overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black" />

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="absolute top-5 left-5 z-30 w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 lg:px-6 gap-6">
        <header className="text-center">
          <p className="text-[10px] lg:text-xs uppercase tracking-[0.35em] text-white/60 font-secondary">
            Elige una fase
          </p>
          <h1 className="mt-2 text-xl lg:text-3xl font-primary font-bold uppercase tracking-[0.15em] text-white">
            Amenidades
          </h1>
        </header>

        <PhaseCards items={items} />
      </div>
    </div>
  );
}
