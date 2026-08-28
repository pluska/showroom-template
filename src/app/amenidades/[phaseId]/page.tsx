"use client";

// ============================================================================
// AMENIDADES DE FASE — /amenidades/[phaseId]
// ----------------------------------------------------------------------------
// Muestra las tarjetas de amenidades de la fase seleccionada (ej. Club House,
// Parque Mz. R, Parque Mz. P para Fase 1). Al hacer clic en cualquiera de las
// tarjetas, se abre el visor inmersivo a pantalla completa con todas sus fotos.
// ============================================================================

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { ArrowLeft, Menu } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import GalleryViewer from '@/components/gallery/GalleryViewer';
import AmenityCards from '@/components/urbanization/AmenityCards';
import { phases } from '@/data/urbanization/phases';
import { PhaseLabel, PhaseStatus } from '@/data/urbanization/enums';
import { getAmenitiesByPhase } from '@/data/urbanization/amenities-tab';
import type { PhaseAmenity } from '@/data/urbanization/types';
import type { GalleryImage } from '@/data/galleries';
import { getAssetUrl } from '@/utils/assets';

export default function AmenidadesFasePage() {
  const params = useParams();
  const phaseId = (params?.phaseId as string) || '';

  const phase = phases.find((item) => item.id === phaseId);
  if (!phase || phase.status !== PhaseStatus.AVAILABLE) {
    notFound();
  }

  const amenities = useMemo(() => getAmenitiesByPhase(phaseId), [phaseId]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAmenity, setSelectedAmenity] = useState<PhaseAmenity | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Mapeo de fotos al formato que espera GalleryViewer
  const galleryImages: GalleryImage[] = useMemo(() => {
    if (!selectedAmenity) return [];
    return selectedAmenity.gallery.map((imagePath, index) => ({
      id: `${selectedAmenity.id}-${index + 1}`,
      src: getAssetUrl(imagePath),
      alt: `${selectedAmenity.title} - Imagen ${index + 1}`,
      title: `${selectedAmenity.title} · Foto ${index + 1} de ${selectedAmenity.photoCount}`,
    }));
  }, [selectedAmenity]);

  const handleSelectAmenity = (amenity: PhaseAmenity) => {
    setSelectedAmenity(amenity);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedAmenity(null);
  };

  const phaseTitle = phase.label ?? PhaseLabel[phase.id] ?? 'Fase 1';

  return (
    <div className="relative w-full h-app overflow-hidden bg-neutral-950 flex flex-col justify-between p-5 lg:p-8">
      {/* Fondo degradado */}
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-neutral-950 to-black" />

      {/* Barra superior con Controles */}
      <header className="relative z-20 w-full flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-lg hover:bg-brand-primary/90 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={18} />
          </button>

          <Link
            href="/amenidades"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[10px] uppercase tracking-[0.18em] font-semibold hover:bg-black/65 transition-colors shadow-sm"
          >
            <ArrowLeft size={13} /> Volver a Fases
          </Link>
        </div>

        {/* Título de Cabecera */}
        <div className="text-center absolute left-1/2 -translate-x-1/2 pointer-events-none hidden md:block">
          <p className="text-[10px] lg:text-xs uppercase tracking-[0.35em] text-white/60 font-secondary">
            {phaseTitle} · Amenidades
          </p>
          <h1 className="mt-1 text-lg lg:text-2xl font-primary font-bold uppercase tracking-[0.15em] text-white">
            Elige una amenidad
          </h1>
        </div>

        <div className="w-10" />
      </header>

      {/* Título móvil */}
      <div className="relative z-10 text-center md:hidden mt-2">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/60 font-secondary">
          {phaseTitle} · Amenidades
        </p>
        <h1 className="mt-1 text-lg font-primary font-bold uppercase tracking-[0.15em] text-white">
          Elige una amenidad
        </h1>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Contenido principal: Grid de Tarjetas */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto">
        {amenities.length > 0 ? (
          <AmenityCards items={amenities} onSelectAmenity={handleSelectAmenity} />
        ) : (
          <div className="text-center text-white/60">
            <p className="text-sm font-secondary">No hay amenidades registradas para esta fase.</p>
            <Link
              href="/amenidades"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-xs uppercase tracking-wider"
            >
              <ArrowLeft size={14} /> Volver a Fases
            </Link>
          </div>
        )}
      </main>

      {/* Visor de Galería Fotográfica */}
      {isViewerOpen && (
        <GalleryViewer
          images={galleryImages}
          initialIndex={0}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          showInfo={true}
        />
      )}
    </div>
  );
}
