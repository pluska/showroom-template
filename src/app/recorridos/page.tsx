"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play, Rotate3d, ArrowRight } from 'lucide-react';
import { getToursPublic } from '@/app/actions/tours';
import Sidebar from '@/components/layout/Sidebar';
import TourHeader from '@/components/UI/TourHeader';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import Loader from '@/components/UI/Loader';
import { getAssetUrl } from '@/utils/assets';
import { VIRTUAL_TOURS, VirtualTourItem } from '@/data/urbanization/tours';

const RecorridosContent = () => {
  const [tours, setTours] = useState<VirtualTourItem[]>(VIRTUAL_TOURS);
  const [selectedTour, setSelectedTour] = useState<VirtualTourItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Load tours, merging with database tours if available
  useEffect(() => {
    async function loadTours() {
      try {
        const dbTours = await getToursPublic();
        if (dbTours && dbTours.length > 0) {
          const mappedDb: VirtualTourItem[] = dbTours.map((t) => ({
            id: t.id,
            title: t.title,
            subtitle: t.subtitle || '',
            category: t.type === 'unit' ? 'apartments' : 'general',
            categoryLabel: t.type === 'unit' ? 'Departamentos' : 'Edificio',
            badge: t.type === 'unit' ? `Piso ${t.floorName || 'Unidad'}` : 'Edificio',
            thumbnail: t.thumbnailUrl,
            targetUrl: t.targetUrl,
          }));
          // Put standard 6 tours first, then any custom database tours
          const existingIds = new Set(VIRTUAL_TOURS.map((v) => v.id));
          const uniqueDb = mappedDb.filter((d) => !existingIds.has(d.id));
          setTours([...VIRTUAL_TOURS, ...uniqueDb]);
        } else {
          setTours(VIRTUAL_TOURS);
        }
      } catch (err) {
        console.error('Error loading tours:', err);
        setTours(VIRTUAL_TOURS);
      } finally {
        setLoading(false);
      }
    }
    loadTours();
  }, []);

  // Sync selected tour based on URL search query parameter
  useEffect(() => {
    const tourId = searchParams.get('tourId');
    if (tourId && tours.length > 0) {
      const found = tours.find((t) => t.id === tourId);
      if (found) setSelectedTour(found);
    }
  }, [searchParams, tours]);

  const handleTourClick = (tour: VirtualTourItem) => {
    setSelectedTour(tour);
  };

  const closeViewer = () => {
    const tourId = searchParams.get('tourId');
    if (tourId) {
      router.back();
    } else {
      setSelectedTour(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (selectedTour) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {/* Viewer Header & Controls */}
        <TourHeader
          title={selectedTour.title}
          subtitle={selectedTour.subtitle}
          onBack={closeViewer}
        />
        <div className="absolute top-4 right-4 z-50 pointer-events-auto">
          <FullScreenToggle />
        </div>

        {/* Kuula 360 Iframe Content */}
        <div className="flex-1 w-full h-full pt-0">
          <iframe
            src={selectedTour.targetUrl}
            title={selectedTour.title}
            className="w-full h-full border-0"
            allowFullScreen
            allow="xr-spatial-tracking; gyroscope; accelerometer"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-950 text-white flex flex-col font-sans selection:bg-brand-orange selection:text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Header flotante */}
      <header className="fixed top-0 left-0 w-full z-40 px-6 py-6 short:py-3 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
          <div className="relative group pointer-events-auto">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 text-white bg-neutral-900/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full shadow-2xl transition-all hover:scale-105 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-black/80 backdrop-blur-md text-white text-[11px] font-semibold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Menú
            </span>
          </div>
        </div>
        <div className="pointer-events-auto">
          <FullScreenToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-24 pb-20 short:pt-16 short:pb-8 max-w-7xl flex-1 flex flex-col justify-start">
        <div className="mb-12 short:mb-5 text-center space-y-3 short:space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-orange text-xs uppercase tracking-[0.2em] font-bold">
            <Rotate3d size={14} />
            <span>Experiencia Inmersiva 360°</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl short:text-2xl font-primary uppercase tracking-[0.14em] font-bold text-white">
            Recorridos Virtuales
          </h1>
          <p className="text-neutral-400 text-sm md:text-base short:text-xs max-w-2xl mx-auto font-light leading-relaxed">
            Explora cada rincón de El Olimpo de Tumbes en 360° interactivo. Selecciona un espacio para
            iniciar tu recorrido inmersivo.
          </p>
        </div>

        {/* Grilla de Recorridos 360 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 short:gap-4">
          {tours.map((tour) => (
            <div
              key={tour.id}
              onClick={() => handleTourClick(tour)}
              className="group relative bg-neutral-900/75 hover:bg-neutral-900 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-brand-orange/50 shadow-xl hover:shadow-2xl hover:shadow-brand-orange/10 transition-all duration-500 cursor-pointer transform hover:-translate-y-1.5 flex flex-col"
            >
              {/* Contenedor de la Imagen */}
              <div className="relative aspect-[16/10] overflow-hidden bg-neutral-950">
                <img
                  src={getAssetUrl(tour.thumbnail)}
                  alt={tour.title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 brightness-[0.9] group-hover:brightness-100"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.style.backgroundColor = '#171717';
                    }
                  }}
                />

                {/* Overlay sutil */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/30 group-hover:opacity-75 transition-opacity" />

                {/* Badge de Categoría */}
                <div className="absolute top-3.5 left-3.5 px-3 py-1 bg-black/65 backdrop-blur-md border border-white/15 rounded-full text-white text-[10px] uppercase tracking-[0.18em] font-bold">
                  {tour.badge}
                </div>

                {/* Badge 360° */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 bg-brand-orange/90 backdrop-blur-md rounded-full text-white text-[10px] uppercase tracking-wider font-bold shadow-md">
                  <Rotate3d size={12} />
                  <span>360°</span>
                </div>

                {/* Botón Central Play / Tour */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/15 group-hover:bg-brand-orange backdrop-blur-md border border-white/30 group-hover:border-brand-orange flex items-center justify-center transform scale-90 group-hover:scale-110 transition-all duration-300 shadow-2xl">
                    <Play className="text-white ml-0.5" fill="white" size={20} />
                  </div>
                </div>
              </div>

              {/* Contenido de la Tarjeta */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg lg:text-xl font-primary uppercase tracking-[0.12em] font-bold text-white group-hover:text-brand-orange transition-colors">
                    {tour.title}
                  </h3>
                  <p className="mt-1 text-xs lg:text-sm text-neutral-400 font-light leading-relaxed">
                    {tour.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400 group-hover:text-white transition-colors">
                  <span className="font-semibold uppercase tracking-[0.14em] text-[10px]">
                    Explorar Tour Virtual
                  </span>
                  <ArrowRight
                    size={15}
                    className="text-brand-orange transform group-hover:translate-x-1 transition-transform"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default function RecorridosPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-neutral-950 text-white">
          <Loader />
        </div>
      }
    >
      <RecorridosContent />
    </Suspense>
  );
}
