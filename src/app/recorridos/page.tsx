"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { getToursPublic } from '@/app/actions/tours';
import Sidebar from '@/components/layout/Sidebar';
import TourHeader from '@/components/UI/TourHeader';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import Loader from '@/components/UI/Loader';
import { getAssetUrl } from '@/utils/assets';

interface Tour {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  type: 'unit' | 'building';
  target: string;
  floorName?: string;
}

const RecorridosContent = () => {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Fetch active tours from database
  useEffect(() => {
    async function loadTours() {
      try {
        const activeTours = await getToursPublic();
        const mapped = activeTours.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.subtitle || "",
          thumbnail: t.thumbnailUrl,
          type: t.type as 'unit' | 'building',
          target: t.targetUrl,
          floorName: t.floorName || undefined
        }));
        setTours(mapped);
      } catch (err) {
        console.error("Error loading tours:", err);
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
        const found = tours.find(t => t.id === tourId);
        if (found) setSelectedTour(found);
    }
  }, [searchParams, tours]);

  const handleTourClick = (tour: Tour) => {
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
        {/* Viewer Header */}
        <div className="absolute top-0 left-0 w-full z-50">
           <TourHeader 
                title={selectedTour.title}
                subtitle={`${selectedTour.subtitle} ${selectedTour.floorName ? `- Piso ${selectedTour.floorName}` : ''}`}
                onBack={closeViewer}
            />
        </div>

        {/* Iframe Content */}
        <div className="flex-1 w-full h-full pt-0">
            <iframe 
                src={selectedTour.target} 
                className="w-full h-full border-0"
                allowFullScreen
                allow="xr-spatial-tracking; gyroscope; accelerometer"
            />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 flex flex-col font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 px-6 py-6 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto">
              <div className="relative group pointer-events-auto">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-white bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full shadow-lg transition-all hover:scale-105 cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-secondary tracking-wider uppercase">
                    Menú
                </span>
              </div>
        </div>
        <div className="pointer-events-auto">
             <FullScreenToggle />
        </div>
      </header>

      <div className="container mx-auto px-6 py-24">
        <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-gray-900 mb-4">Recorridos Virtuales</h1>
            <p className="text-gray-500 max-w-2xl mx-auto">
                Explora el edificio y sus unidades desde la comodidad de tu dispositivo. 
                Selecciona una opción para iniciar el recorrido 360°.
            </p>
        </div>

        {tours.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200/60 max-w-lg mx-auto shadow-sm">
            <p className="text-gray-500 text-sm">No hay recorridos virtuales activos por el momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tours.map(tour => (
                  <div 
                      key={tour.id}
                      onClick={() => handleTourClick(tour)}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  >
                      {/* Image Container */}
                      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                          <img 
                              src={getAssetUrl(tour.thumbnail)} 
                              alt={tour.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              onError={(e) => { 
                                e.currentTarget.style.display = 'none'; 
                                e.currentTarget.parentElement!.style.backgroundColor = '#eaeaea'; 
                              }}
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                                  <Play className="text-white ml-1" fill="white" size={24} />
                              </div>
                          </div>
                          
                          {/* Type Badge */}
                          <div className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs uppercase tracking-wider font-medium">
                              {tour.type === 'building' ? 'Edificio' : `Piso ${tour.floorName || 'Unidad'}`}
                          </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                          <h3 className="text-xl font-serif text-gray-900 mb-1 group-hover:text-brand-orange transition-colors">
                              {tour.title}
                          </h3>
                          <p className="text-gray-500 text-sm">
                              {tour.subtitle}
                          </p>
                      </div>
                  </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function RecorridosPage() {
    return (
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-gray-50"><Loader /></div>}>
            <RecorridosContent />
        </Suspense>
    );
}
