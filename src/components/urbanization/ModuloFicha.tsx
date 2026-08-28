"use client";

// ============================================================================
// FICHA DEL MÓDULO (CASA) — Tipología Módulo 1 y Módulo 2
// ----------------------------------------------------------------------------
// Se abre como capa encima del terreno (`LoteFicha`), tapándolo, y al cerrarla
// el visitante sigue en el mismo lote de la misma zona.
//
// Diseño idéntico al de Océano y Departamentos:
//   · Panel blanco a la izquierda con datos e instalaciones.
//   · Plano amoblado/acotado/entregable a la derecha con transiciones animadas.
//   · Selector de Piso 1 y Piso 2 para viviendas de dos plantas.
//   · Botones de Galería y Recorrido 360° en la esquina superior derecha.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { appBoxWidth } from '@/utils/layout';
import {
  ArrowLeft,
  Bath,
  Bed,
  ChevronLeft,
  ChevronRight,
  Images,
  Info,
  Mail,
  Menu,
  Rotate3d,
  Ruler,
  Share2,
  X,
} from 'lucide-react';

import GalleryViewer from '@/components/gallery/GalleryViewer';
import RequestInfoModal from '@/components/modals/RequestInfoModal';
import TourHeader from '@/components/UI/TourHeader';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import TransitionVideo from '@/components/urbanization/TransitionVideo';
import { apartmentViewOrder, defaultApartmentView } from '@/data/urbanization/apartments';
import {
  ApartmentView,
  ApartmentViewLabel,
  LotModuleId,
} from '@/data/urbanization/enums';
import { getModuleTypology } from '@/data/urbanization/modules';
import type { Unit } from '@/data/urbanization/types';
import { getAssetUrl } from '@/utils/assets';
import { preloadImages } from '@/utils/preload';

const Instalacion = ({
  Icon,
  value,
}: {
  Icon: typeof Ruler;
  value: string;
}) => (
  /* En fila (icono encima del texto) mientras el panel es una hoja a pantalla
     completa, y en lista de una columna cuando cabe al lado del plano. */
  <li className="flex flex-col items-center gap-2 text-center xl:flex-row xl:items-center xl:gap-4 xl:text-left">
    <Icon strokeWidth={1.5} size={22} className="shrink-0 text-brand-orange" />
    <span className="text-sm font-medium text-neutral-700">{value}</span>
  </li>
);

export interface ModuloFichaProps {
  moduleId: LotModuleId;
  lot?: Unit | null;
  onClose: () => void;
}

export default function ModuloFicha({ moduleId, lot, onClose }: ModuloFichaProps) {
  const moduleData = useMemo(() => getModuleTypology(moduleId), [moduleId]);

  const [activeFloorLevel, setActiveFloorLevel] = useState(1);
  const [view, setView] = useState<ApartmentView>(defaultApartmentView);
  const [transition, setTransition] = useState<{ url: string; to: ApartmentView } | null>(null);
  const [holdingLastFrame, setHoldingLastFrame] = useState(false);
  /* Arranca con el panel abierto solo si la caja da para tenerlo AL LADO del
     plano. Es el mismo criterio de Océano, Venecia y Altamira —y el de la ficha
     de `unidad/[id]` de este mismo repo—: por debajo de `xl` el panel es una
     hoja a pantalla completa, así que abrirlo de entrada taparía el plano que
     se acaba de pedir. En la ventana girada la caja mide 812, no 1280: se
     entra al plano, y el panel se llama desde el botón de información. */
  const [showDetails, setShowDetails] = useState(() => appBoxWidth() >= 1280);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const activeFloor = useMemo(() => {
    return (
      moduleData.floors.find((f) => f.level === activeFloorLevel) ??
      moduleData.floors[0]
    );
  }, [moduleData, activeFloorLevel]);

  // Precargar las 3 vistas del piso actual
  useEffect(() => {
    if (!activeFloor) return;
    preloadImages(apartmentViewOrder.map((v) => getAssetUrl(activeFloor.images[v]))).catch(
      () => {},
    );
  }, [activeFloor]);

  const isAnimating = transition !== null && !holdingLastFrame;

  const goTo = useCallback(
    (next: ApartmentView) => {
      if (!activeFloor || isAnimating || next === view) return;

      const video = activeFloor.transitions[view]?.[next];
      if (!video) {
        setView(next);
        setTransition(null);
        setHoldingLastFrame(false);
        return;
      }

      setHoldingLastFrame(false);
      setTransition({ url: getAssetUrl(video), to: next });
    },
    [activeFloor, isAnimating, view],
  );

  const endTransition = useCallback(() => {
    if (!transition) return;
    setView(transition.to);
    setHoldingLastFrame(true);
  }, [transition]);

  const revealImage = useCallback(() => {
    setTransition(null);
    setHoldingLastFrame(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleShare = async () => {
    const shareData = {
      title: `${moduleData.label} - El Olimpo de Tumbes`,
      text: `Conoce el ${moduleData.label} en El Olimpo de Tumbes`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  const [leftTarget, rightTarget] = useMemo(
    () => apartmentViewOrder.filter((item) => item !== view),
    [view],
  );

  const imageKey = activeFloor?.images[view] ?? null;
  // Foto 2 de la galería para el cartel de disponibilidad (Módulo 1 y Módulo 2)
  const posterImage = moduleData.gallery[1] || moduleData.gallery[0] || null;

  const galleryImages = useMemo(() => {
    return moduleData.gallery.map((path, idx) => ({
      id: `${moduleId}-gallery-${idx}`,
      src: getAssetUrl(path),
      alt: `${moduleData.label} — Foto ${idx + 1}`,
      title: `${moduleData.label} — Foto ${idx + 1}`,
      description: `${moduleData.label} · ${moduleData.subtitle}`,
    }));
  }, [moduleData, moduleId]);

  const contextLabel = lot ? `Terreno ${lot.identifier}` : 'El Olimpo de Tumbes';

  return (
    <div className="absolute inset-0 z-40 flex bg-gray-50 text-neutral-800 animate-in fade-in duration-300">
      <RequestInfoModal
        isOpen={isRequestOpen}
        onClose={() => setIsRequestOpen(false)}
        unitId={lot?.id || moduleId}
        unitIdentifier={`${moduleData.label}${lot ? ` · ${lot.identifier}` : ''}`}
        floorId={moduleData.floorsCount > 1 ? `Piso ${activeFloorLevel}` : '1'}
      />

      {/* PANEL LATERAL DE DATOS (Blanco, estilo Océano) */}
      {showDetails && (
        <aside className="relative z-20 flex w-full xl:w-[clamp(320px,30%,420px)] shrink-0 flex-col bg-white shadow-2xl border-r border-gray-100">
          <header className="px-6 pt-16 pb-2">
            <button
              type="button"
              onClick={onClose}
              title="Volver al terreno"
              className="p-2 -ml-2 rounded-full text-neutral-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="flex justify-between items-start pt-2">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 xl:text-3xl">
                  {moduleData.label}
                </h2>
                <p className="text-sm font-medium text-slate-500 xl:text-base">{moduleData.subtitle}</p>
                {lot && (
                  <p className="text-xs font-semibold text-brand-primary mt-0.5">
                    Sobre {lot.identifier}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-600 border-green-100">
                  Disponible
                </span>
                <button
                  type="button"
                  onClick={handleShare}
                  title="Compartir"
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <Share2 size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetails(false)}
                  title="Ocultar los datos y ver el plano a pantalla completa"
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 xl:py-8 xl:space-y-8">
            {/* Poster de Disponibilidad con Foto 2 de la Galería */}
            <div
              className="hidden xl:block relative overflow-hidden rounded-xl bg-neutral-900 py-12 text-center shadow-inner"
              style={
                posterImage
                  ? {
                      backgroundImage: `url(${getAssetUrl(posterImage)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              <div className="absolute inset-0 bg-black/45" />
              <p className="relative z-10 font-serif italic text-lg text-white drop-shadow-md">
                Esta tipología está disponible
              </p>
            </div>

            <div className="hidden xl:block border-t border-gray-100" />

            {/* Instalaciones */}
            <div>
              <h3 className="hidden xl:block mb-6 text-xs font-bold uppercase tracking-widest text-neutral-900">
                Instalaciones
              </h3>
              <ul className="flex items-start justify-center gap-10 rounded-2xl bg-gray-50 p-4 xl:block xl:space-y-6 xl:rounded-none xl:bg-transparent xl:p-0">
                <Instalacion
                  Icon={Ruler}
                  value={`Área total ${moduleData.areaSqm.toLocaleString('es-PE')} m²`}
                />
                <Instalacion
                  Icon={Bed}
                  value={`${moduleData.bedrooms} ${moduleData.bedrooms === 1 ? 'Dormitorio' : 'Dormitorios'}`}
                />
                <Instalacion
                  Icon={Bath}
                  value={`${moduleData.bathrooms} ${moduleData.bathrooms === 1 ? 'Baño' : 'Baños'}`}
                />
              </ul>

              <p className="hidden xl:block mt-6 text-xs leading-relaxed text-neutral-400">
                Las medidas de cada ambiente están rotuladas en la vista{' '}
                {ApartmentViewLabel[ApartmentView.MEASURED]}.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-white p-4 xl:p-6">
            <button
              type="button"
              onClick={() => setIsRequestOpen(true)}
              className="group flex w-full cursor-pointer items-center justify-between py-2"
            >
              <span className="text-sm font-bold text-neutral-900 transition-colors group-hover:text-brand-primary">
                Solicitar información
              </span>
              <Mail
                size={22}
                className="text-gray-300 transition-colors group-hover:text-brand-primary"
              />
            </button>
          </div>
        </aside>
      )}

      {/* LIENZO DEL PLANO */}
      <div
        className={`relative min-w-0 flex-1 overflow-hidden bg-white ${
          showDetails ? 'hidden xl:block' : 'block'
        }`}
      >
        {/* Envoltorio con el padding: TransitionVideo mide su propio contenedor
            para tapar la costura del video justo en su borde real (y no en el
            padding vacío), sea cual sea el tamaño de pantalla. */}
        <div className="absolute inset-0 p-4 md:p-8">
          {imageKey && (
            <img
              key={imageKey}
              src={getAssetUrl(imageKey)}
              alt={`${moduleData.label} · ${activeFloor?.label} · ${ApartmentViewLabel[view]}`}
              onLoad={revealImage}
              onError={(event) => {
                event.currentTarget.style.visibility = 'hidden';
                revealImage();
              }}
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}

          {transition && (
            <TransitionVideo
              src={transition.url}
              onEnded={endTransition}
              onError={() => {
                console.error('No se pudo reproducir la transición del módulo:', transition.url);
                setView(transition.to);
                revealImage();
              }}
            />
          )}
        </div>

        {/* Botón para recuperar panel cuando está oculto */}
        {!showDetails && (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="absolute left-6 top-20 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-black/40 px-5 py-3 text-white backdrop-blur transition-all hover:bg-black/60 shadow-lg"
          >
            <Info size={20} />
            <span className="text-sm font-medium uppercase tracking-wide">{moduleData.label}</span>
          </button>
        )}

        {/* Botón volver cuando el panel está oculto */}
        {!showDetails && (
          <button
            type="button"
            onClick={onClose}
            className="absolute left-[4.5rem] top-5 z-30 flex cursor-pointer items-center gap-2 rounded-full bg-black/40 px-5 py-2.5 text-white backdrop-blur transition-all hover:bg-black/60 shadow-lg"
          >
            <ArrowLeft size={18} />
            <span className="text-xs font-medium uppercase tracking-wide">Volver al terreno</span>
          </button>
        )}

        {/* Pastillas laterales para alternar entre vistas */}
        {!isAnimating && (
          <>
            {leftTarget && (
              <button
                type="button"
                onClick={() => goTo(leftTarget)}
                className="group absolute left-6 top-1/2 z-30 flex -translate-y-1/2 cursor-pointer items-center gap-3 rounded-full bg-black/40 p-3 pr-5 text-white backdrop-blur transition-all hover:bg-black/60 shadow-xl"
              >
                <ChevronLeft size={28} className="transition-transform group-hover:-translate-x-1" />
                <span className="hidden text-sm font-medium uppercase tracking-wide sm:block">
                  {ApartmentViewLabel[leftTarget]}
                </span>
              </button>
            )}

            {rightTarget && (
              <button
                type="button"
                onClick={() => goTo(rightTarget)}
                className="group absolute right-6 top-1/2 z-30 flex -translate-y-1/2 cursor-pointer items-center gap-3 rounded-full bg-black/40 p-3 pl-5 text-white backdrop-blur transition-all hover:bg-black/60 shadow-xl"
              >
                <span className="hidden text-sm font-medium uppercase tracking-wide sm:block">
                  {ApartmentViewLabel[rightTarget]}
                </span>
                <ChevronRight size={28} className="transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </>
        )}

        {/* Selector de Pisos inferior (Módulo 1 tiene 2 pisos, estilo Océano Dúplex) */}
        {moduleData.floorsCount > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-full bg-neutral-900/80 backdrop-blur-md border border-white/15 shadow-2xl">
            {moduleData.floors.map((fl) => {
              const isActive = activeFloorLevel === fl.level;
              return (
                <button
                  key={fl.level}
                  type="button"
                  onClick={() => {
                    setActiveFloorLevel(fl.level);
                    setTransition(null);
                    setHoldingLastFrame(false);
                  }}
                  className={`px-5 py-2 rounded-full text-xs uppercase font-bold tracking-wider transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-brand-primary text-white shadow-lg scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Piso {fl.level}
                </button>
              );
            })}
          </div>
        )}

        {/* Botones en la Esquina Superior Derecha (Galería, Recorrido Kuula, Pantalla Completa) */}
        <div className="absolute top-6 right-6 z-30 flex items-center gap-3">
          {galleryImages.length > 0 && (
            <button
              type="button"
              onClick={() => setIsGalleryOpen(true)}
              className="px-5 py-3 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 flex items-center gap-2 bg-brand-primary/85 text-white hover:bg-brand-primary hover:scale-105 cursor-pointer font-bold text-xs uppercase tracking-wider"
              title="Ver Galería de Fotos"
            >
              <Images size={18} />
              <span>Galería ({galleryImages.length})</span>
            </button>
          )}

          {moduleData.tourUrl && (
            <button
              type="button"
              onClick={() => setIsTourOpen(true)}
              className="px-5 py-3 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 flex items-center gap-2 bg-brand-primary/85 text-white hover:bg-brand-primary hover:scale-105 cursor-pointer font-bold text-xs uppercase tracking-wider"
              title="Abrir Recorrido Virtual 360°"
            >
              <Rotate3d size={18} />
              <span>Recorrido</span>
            </button>
          )}

          <FullScreenToggle />
        </div>
      </div>

      {/* Visor inmersivo de Galería */}
      <GalleryViewer
        images={galleryImages}
        initialIndex={0}
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
      />

      {/* Visor inmersivo de Recorrido Virtual 360° en Kuula */}
      {isTourOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
          <TourHeader
            title={`Recorrido Virtual 360° · ${moduleData.label}`}
            subtitle={`${contextLabel} · ${moduleData.subtitle}`}
            onBack={() => setIsTourOpen(false)}
          />
          <div className="flex-1 w-full h-full pt-0">
            <iframe
              src={moduleData.tourUrl}
              className="w-full h-full border-0"
              allowFullScreen
              allow="xr-spatial-tracking; gyroscope; accelerometer"
              title={`Recorrido 360 ${moduleData.label}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
