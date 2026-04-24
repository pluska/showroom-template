"use client";
import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, X, MoreVertical, Menu, Ruler, Bed, Bath, PanelRightOpen, Rotate3d, ImageIcon, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { floorsData, UnitStatusString } from '@/data/floors';
import Sidebar from '@/components/layout/Sidebar';
import RequestInfoModal from '@/components/modals/RequestInfoModal';
import InlineGallery from '@/components/gallery/InlineGallery';
import TourHeader from '@/components/UI/TourHeader';
import { preloadImages, preloadVideo } from '@/utils/preload';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { getAssetUrl, assetManifest } from '@/utils/assets';
import { useStore } from '@/store/useStore';

const UnitPage = () => {
  const params = useParams();
  const unitId = params.id as string;
  const router = useRouter();
  
  // Resolve Unit & Floor
  const floor = floorsData.find(f => f.units.some(u => u.id === unitId));
  const unit = floor?.units.find(u => u.id === unitId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Default to hidden on mobile/tablet (LG/XL breakpoint)
  const [showDetails, setShowDetails] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 1280 : true));
  
  const [viewMode, setViewMode] = useState<'furnished' | 'unfurnished' | 'plans' | 'gallery' | 'tour'>('furnished');
  
  // Transitions
  const [transitionVideo, setTransitionVideo] = useState<string | null>(null);
  const [isPlayingTransition, setIsPlayingTransition] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLoadingNav, setIsLoadingNav] = useState(false);
  
  // --- ASSET RESOLUTION HELPERS ---
  const getTransitionUrl = (assetId: string, type: string) => {
    const relativePath = `plants/details/${assetId}/transitions/${type}.mp4`;
    // Check manifest
    if (assetManifest.includes(relativePath)) {
        return getAssetUrl(relativePath);
    }
    return undefined;
  };

  const getUnitGalleryImages = (assetId: string, title?: string) => {
    // 1. Try Manifest First
    const specificImages = assetManifest
        .filter(path => path.includes(`plants/details/${assetId}/gallery/`));
    
    // 2. Dynamic Fallback (if manifest empty)
    // Used for Terraza (902) where images are on Cloudflare but not in manifest
    if (specificImages.length === 0) {
        const dynamicImages = [];
        // Probe 1..10
        for (let i = 1; i <= 10; i++) {
             dynamicImages.push(`plants/details/${assetId}/gallery/${i}.jpg`);
             dynamicImages.push(`plants/details/${assetId}/gallery/${i}.png`); // Fallback extension
        }
        
        return dynamicImages.map(path => ({
            id: path,
            src: getAssetUrl(path),
            alt: `Gallery Image`, // Generic alt since no manifest title
            title: `Gallery Image`
        }));
    }

    return specificImages.map(path => ({
            id: path,
            src: getAssetUrl(path),
            alt: `Unit ${title || assetId} Gallery`, 
            title: `Unit ${title || assetId}`
    }));
  };

  const getStaticViewUrl = (assetId: string, type: 'furnished' | 'unfurnished' | 'plans') => {
      const extensions = ['jpg', 'jpeg', 'png'];
      for (const ext of extensions) {
          const relativePath = `plants/details/${assetId}/${type}.${ext}`;
          if (assetManifest.includes(relativePath)) {
              return getAssetUrl(relativePath);
          }
      }
      return undefined;
  };

  // Resolve which Asset ID to use
  const assetId = unit?.assetId || unitId || '';
  const unitGalleryImages = getUnitGalleryImages(assetId, unitId);


  // --- TRANSITION HANDLERS ---
  const handleViewChange = (newMode: 'furnished' | 'unfurnished' | 'plans' | 'gallery' | 'tour') => {
      if (!unitId || newMode === viewMode) return;

      // Overlay toggling (Gallery / Tour)
      if (['gallery', 'tour'].includes(newMode)) {
          setViewMode(newMode as any);
          return;
      }
      
      // If currently content overlay (gallery/tour), just switch
      if (['gallery', 'tour'].includes(viewMode)) {
          setViewMode(newMode);
          return;
      }

      // Determine transition
      let transitionName = '';
      if (viewMode === 'furnished' && newMode === 'unfurnished') transitionName = 'furnished_to_unfurnished';
      else if (viewMode === 'unfurnished' && newMode === 'furnished') transitionName = 'unfurnished_to_furnished';
      else if (viewMode === 'furnished' && newMode === 'plans') transitionName = 'furnished_to_plans';
      else if (viewMode === 'plans' && newMode === 'furnished') transitionName = 'plans_to_furnished';
      
      const videoUrl = getTransitionUrl(assetId, transitionName);
      let targetStaticImage: string | undefined;
      
      // Determine target static image based on newMode
      if (newMode === 'furnished' || newMode === 'unfurnished' || newMode === 'plans') {
          targetStaticImage = getStaticViewUrl(assetId, newMode);
      }

      if (videoUrl) {
          // Play transition sequence
          const playSequence = async () => {
             setIsLoadingNav(true);
             try {
                const promises: Promise<void | HTMLImageElement>[] = [preloadVideo(videoUrl)];
                if (targetStaticImage) promises.push(preloadImages([targetStaticImage]));
                await Promise.all(promises);
             } catch(e) { console.warn("Transition preload failed", e); }
             setIsLoadingNav(false);
             
             // 2. Start
            setViewMode(newMode);
            setTransitionVideo(videoUrl);
            setIsPlayingTransition(true);
          };
          playSequence();

      } else {
          if (targetStaticImage) {
              setIsLoadingNav(true);
              preloadImages([targetStaticImage])
                .then(() => setViewMode(newMode))
                .finally(() => setIsLoadingNav(false));
          } else {
              setViewMode(newMode);
          }
      }
  };
  
  const startTransition = (targetMode: 'furnished' | 'unfurnished' | 'plans') => {
      if (!unitId) return;
      
      let transitionName = '';
      // Linear Flow: Unfurnished <-> Furnished <-> Plans
      
      if (viewMode === 'furnished' && targetMode === 'unfurnished') transitionName = 'furnished_to_unfurnished';
      else if (viewMode === 'unfurnished' && targetMode === 'furnished') transitionName = 'unfurnished_to_furnished';
      else if (viewMode === 'furnished' && targetMode === 'plans') transitionName = 'furnished_to_plans';
      else if (viewMode === 'plans' && targetMode === 'furnished') transitionName = 'plans_to_furnished';
      
      const videoUrl = transitionName ? getTransitionUrl(assetId, transitionName) : null;
      const targetStaticImage = getStaticViewUrl(assetId, targetMode);

      if (videoUrl) {
          // Preload video and target image
          const playSequence = async () => {
             setIsLoadingNav(true);
             try {
                const promises: Promise<void | HTMLImageElement>[] = [preloadVideo(videoUrl)];
                if (targetStaticImage) promises.push(preloadImages([targetStaticImage]));
                await Promise.all(promises);
             } catch(e) { console.warn("Nav preload failed", e); }
             setIsLoadingNav(false);
             
             setViewMode(targetMode);
             setTransitionVideo(videoUrl);
             setIsPlayingTransition(true);
          };
          playSequence();
      } else {
           if (targetStaticImage) {
              setIsLoadingNav(true);
              preloadImages([targetStaticImage])
                .then(() => setViewMode(targetMode))
                .finally(() => setIsLoadingNav(false));
          } else {
              setViewMode(targetMode);
          }
      }
  };
  
  useEffect(() => {
     if (isPlayingTransition && videoRef.current) {
         videoRef.current.play().catch(e => console.warn("Transition play failed", e));
     }
  }, [isPlayingTransition]);


  if (!unit || !floor) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center flex-col gap-4">
        <h1 className="text-2xl font-light">Unidad no encontrada</h1>
        <button 
          onClick={() => router.push('/plantas')} 
          className="px-6 py-2 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
        >
          Volver a Plantas
        </button>
      </div>
    );
  }

  // Determine Main Content to display (Underneath video)
  const renderContent = () => {
      if (viewMode === 'gallery') {
          return (
             <div className="w-full h-full bg-black">
                 <InlineGallery images={unitGalleryImages} />
             </div>
          );
      }

      if (viewMode === 'tour' && unit?.tourUrl) {
           return (
               <div className="w-full h-full bg-black">
                   <iframe 
                        width="100%" 
                        height="100%" 
                        style={{ width: '100%', height: '100%', border: 'none' }} 
                        // frameBorder="0" 
                        allow="xr-spatial-tracking; gyroscope; accelerometer" 
                        allowFullScreen 
                        scrolling="no" 
                        src={unit.tourUrl}
                   ></iframe>
               </div>
           );
      }
      
      // Get the correct static image for the current mode
      const staticImageUrl = getStaticViewUrl(assetId, viewMode as any);
      
      return (
          <div className="w-full h-full bg-white relative">
             {staticImageUrl ? (
                 <img 
                    src={staticImageUrl} 
                    className="w-full h-full object-contain p-4 md:p-8"
                    alt={`${viewMode} View`}
                 />
             ) : (
                 <div className="w-full h-full flex items-center justify-center bg-neutral-200">
                     <p className="text-neutral-400">Image not found: {viewMode}</p>
                 </div>
             )}
             
             {/* State Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 backdrop-blur px-6 py-3 rounded-xl text-white font-light uppercase tracking-widest pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                  {viewMode === 'furnished' && (unit.subtitle === 'Terraza' ? 'Terraza' : 'Amueblado')}
                  {viewMode === 'unfurnished' && 'Sin Amueblar'}
                  {viewMode === 'plans' && (unit.subtitle === 'Terraza' ? 'Medidas' : 'Plano Arquitectónico')}
              </div>
          </div>
      );
  };
  
  // Navigation State Logic
  const getNavState = () => {
      // Special case for 'Terraza' unit - No 'unfurnished' view
      if (unit.subtitle === 'Terraza') {
          if (viewMode === 'plans') return { showLeft: true, showRight: false, leftTarget: 'furnished' as const };
          if (viewMode === 'furnished') return { showLeft: false, showRight: true, rightTarget: 'plans' as const }; // showLeft false to hide Unfurnished
          return { showLeft: false, showRight: false };
      }

      if (viewMode === 'unfurnished') return { showLeft: false, showRight: true, rightTarget: 'furnished' as const };
      if (viewMode === 'plans') return { showLeft: true, showRight: false, leftTarget: 'furnished' as const };
      if (viewMode === 'furnished') return { showLeft: true, showRight: true, leftTarget: 'unfurnished' as const, rightTarget: 'plans' as const };
      return { showLeft: false, showRight: false }; // Gallery or other
  };

  const navState = getNavState();

  return (
    <div className="h-full bg-gray-50 font-sans flex flex-col md:flex-row overflow-hidden text-neutral-800">
      
      {/* GLOBAL SIDEBAR */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* MODAL */}
      <RequestInfoModal 
        isOpen={isRequestModalOpen} 
        onClose={() => setIsRequestModalOpen(false)} 
        unitId={unit.id} 
        floorId={floor.id} 
      />

      {/* GLOBAL SIDEBAR TOGGLE */}
      {/* GLOBAL CONTROLS (Left) */}
      <div className="fixed top-6 left-6 z-50 flex flex-col items-start gap-4 group pointer-events-auto">
        
        {/* Row 1: Menu + Back */}
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 text-white bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full shadow-md transition-all hover:scale-105 cursor-pointer relative group/menu"
            >
                <Menu size={24} />
                <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover/menu:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-secondary tracking-wider uppercase">
                    Menú
                </span>
            </button>

            {!showDetails && (
                <button 
                    onClick={() => router.push(`/plantas/${floor.id}`)} 
                    className="p-3 bg-neutral-800 text-white rounded-full hover:bg-black transition-colors shadow-lg"
                >
                    <ArrowLeft size={20} />
                </button>
            )}
        </div>

        {/* Row 2: Ver Detalles (Tablet/Desktop Only - Hidden on Mobile) */}
        {!showDetails && (
            <button 
                onClick={() => setShowDetails(true)} 
                className="hidden lg:flex px-6 py-3 bg-brand-primary/90 hover:bg-brand-primary backdrop-blur-xl border border-white/20 text-white rounded-full transition-all shadow-xl items-center gap-2 font-bold text-sm tracking-wide uppercase hover:scale-105"
            >
                <span>Ver detalles</span>
            </button>
        )}
        
        {/* Badge - Visible when details hidden */}
        {!showDetails && (
             <div className="px-4 py-2 bg-neutral-600/90 backdrop-blur-sm text-white rounded-md shadow-lg text-xs font-medium tracking-wide">
                Planta {floor.name}
             </div>
        )}
      </div>

      <div 
        className={`bg-white border-r border-gray-200 flex flex-col shrink-0 z-[60] shadow-xl transition-all duration-300 ease-in-out
            ${showDetails 
                ? 'fixed inset-0 w-full h-full xl:relative xl:w-[420px] xl:h-full xl:inset-auto translate-x-0 opacity-100' 
                : 'fixed inset-y-0 left-0 w-0 xl:relative xl:w-0 -translate-x-full opacity-0 overflow-hidden'}
        `}
      >
        
        {/* Header / Nav */}
        <div className="px-6 pt-6 pb-2 w-full xl:min-w-[420px]">
            <div className="flex flex-col items-start gap-4 mb-2">
                 <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-3 rounded-full bg-[#fbb03b] hover:bg-[#e09e35] text-white shadow-lg transition-all hover:scale-105"
                    title="Menu"
                 >
                    <Menu size={26} />
                 </button>
                 <button 
                    onClick={() => router.push(`/plantas/${floor.id}`)} 
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-neutral-900"
                    title="Volver"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>
            <div className="flex justify-between items-start pt-2">
                
                {/* Left: Title & Subtitle */}
                <div>
                     <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-0">{unit.id}</h1>
                     <p className="text-base text-slate-500 font-medium">{unit.subtitle || 'Unit'}</p>
                </div>

                {/* Right: Status, Share, Close */}
                <div className="flex items-center gap-2">
                    {/* Status Badge */}
                    {unit.subtitle === 'Terraza' ? (
                         <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border bg-gray-100 text-gray-500 border-gray-200">
                            Common
                        </span>
                    ) : (
                        <span className={`
                            px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border
                            ${unit.status === 'available' ? 'bg-green-50 text-green-600 border-green-100' : ''}
                            ${unit.status === 'reserved' ? 'bg-amber-50 text-amber-600 border-amber-100' : ''}
                            ${unit.status === 'sold' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                        `}>
                            {UnitStatusString[unit.status]}
                        </span>
                    )}

                    <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500">
                        <Share2 size={20} />
                    </button>
                    <button 
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                        onClick={() => setShowDetails(false)}
                    >
                        <X size={20} cursor="pointer"/>
                    </button>
                </div>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto w-full xl:min-w-[420px]">
             
             {/* [MOBILE View (< XL)] - Compact Centered Icons */}
             {unit.subtitle !== 'Terraza' && (
             <div className="block xl:hidden px-6 py-4 flex flex-col justify-center h-full">
                 <div className="bg-gray-50 rounded-2xl p-6 flex justify-center">
                    <ul className="flex items-center gap-8 sm:gap-12">
                        <li className="flex flex-col items-center gap-2 text-neutral-700">
                            <Ruler strokeWidth={1.5} className="text-brand-gold" size={24} />
                            <span className="text-xs font-bold uppercase tracking-wider">{unit.dimensions} m²</span>
                        </li>
                        <li className="flex flex-col items-center gap-2 text-neutral-700">
                            <Bed strokeWidth={1.5} className="text-brand-gold" size={24} />
                            <span className="text-xs font-bold uppercase tracking-wider">{unit.bedrooms} Rec</span>
                        </li>
                        <li className="flex flex-col items-center gap-2 text-neutral-700">
                             <Bath strokeWidth={1.5} className="text-brand-gold" size={24} />
                             <span className="text-xs font-bold uppercase tracking-wider">{unit.bathrooms} Baños</span>
                        </li>
                    </ul>
                 </div>
             </div>
             )}

             {/* [DESKTOP View (>= XL)] - Detailed List & Poster */}
             <div className="hidden xl:block px-6 py-8 space-y-8">
                 {/* Availability Poster - Hidden for Terraza */}
                 {unit.subtitle !== 'Terraza' && (
                 <>
                 <div 
                    className="text-center py-12 rounded-xl relative overflow-hidden group shadow-inner"
                    style={{
                        backgroundImage: (() => {
                            const posterPath = `plants/details/${assetId}/poster.png`;
                            return assetManifest.includes(posterPath) ? `url(${getAssetUrl(posterPath)})` : 'none';
                        })(),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                 >
                     {/* Dark Overlay for readability */}
                     <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                     
                     <p className="text-white italic font-serif text-lg relative z-10 drop-shadow-md">
                        {unit.status === 'available' ? 'Esta unidad está disponible' : 'Esta unidad no está disponible'}
                     </p>
                </div>

                <div className="border-t border-gray-100 my-6" />
                </>
                )}

                {/* Installations List */}
                {unit.subtitle !== 'Terraza' && (
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-900 mb-6">Instalaciones</h3>
                    <ul className="space-y-6">
                        <li className="flex items-center gap-4 text-neutral-700">
                            <Ruler strokeWidth={1.5} className="text-brand-gold" size={22} />
                            <span className="text-sm font-medium">Area total {unit.dimensions} m²</span>
                        </li>
                        <li className="flex items-center gap-4 text-neutral-700">
                            <Bed strokeWidth={1.5} className="text-brand-gold" size={22} />
                            <span className="text-sm font-medium">{unit.bedrooms} Recámaras</span>
                        </li>
                        <li className="flex items-center gap-4 text-neutral-700">
                             <Bath strokeWidth={1.5} className="text-brand-gold" size={22} />
                             <span className="text-sm font-medium">{unit.bathrooms} Baños</span>
                        </li>
                    </ul>
                </div>
                )}

             </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-white w-full xl:min-w-[420px] flex flex-col gap-4">
             {/* Brochure & Disclaimer Group (Row on Mobile/Landscape, Stacked on Desktop) */}
             <div className="flex flex-row items-center gap-4 lg:flex-col lg:gap-6">
                 {/* Brochure Button */}
                 <button 
                    onClick={() => {
                        useStore.getState().toggleBrochure(true);
                    }}
                    className="flex-1 lg:w-full py-4 bg-brand-primary text-white rounded-xl font-bold text-sm transition-colors shadow-sm border border-gray-100"
                 >
                     Ver Brochure
                 </button>

                 {/* Disclaimer */}
                 <p className="flex-1 text-center text-xs text-gray-400 font-medium whitespace-nowrap lg:whitespace-normal">Disclaimer</p>
             </div>

             {/* Request Info Button (Row Style) */}
             {unit.subtitle !== 'Terraza' && (
             <button 
                onClick={() => setIsRequestModalOpen(true)}
                className="w-full flex items-center justify-between py-2 group mt-2"
             >
                 <span className="font-bold text-sm text-neutral-900 group-hover:text-brand-primary transition-colors">Solicitar información</span>
                 <Mail size={22} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
             </button>
             )}
        </div>
      </div>

      {/* RIGHT PANEL - FLOORPLAN / MAP / GALLERY */}
      <div className={`flex-1 relative bg-gray-900 overflow-hidden flex-col ${showDetails ? 'hidden xl:flex' : 'flex'}`}>
            
            {/* Top Bar Controls - Hidden if Tour Mode */}
            {viewMode === 'tour' && (
                <TourHeader 
                    title={`Unidad ${unit.id}`}
                    subtitle={`${unit.subtitle || 'Unidad'} - Piso ${floor.name}`}
                    onBack={() => handleViewChange('furnished')}
                />
            )}

            <div 
                 className={`absolute top-6 right-6 z-20 flex flex-col items-end gap-3 pointer-events-auto transition-opacity duration-300 ${viewMode === 'tour' ? 'opacity-0' : 'opacity-100'}`}
            >
                 {/* Desktop: Horizontal Row including Expand */}
                 <div className="hidden lg:flex flex-row items-center gap-3">
                     
                     {/* Gallery */}
                     <button 
                        onClick={() => handleViewChange(viewMode === 'gallery' ? 'furnished' : 'gallery')}
                        className={`px-5 py-3 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 flex items-center gap-2
                            ${viewMode === 'gallery' ? 'bg-brand-primary text-white' : 'bg-brand-primary/80 text-white hover:bg-brand-primary'}`}
                        title="Galería"
                     >
                         <ImageIcon size={20} />
                         <span className="hidden xl:inline font-medium text-sm tracking-wide">Galería</span>
                     </button>

                     {/* Recorrido */}
                      {unit.tourUrl && (
                          <button 
                            onClick={() => handleViewChange(viewMode === 'tour' ? 'furnished' : 'tour')}
                            className={`px-5 py-3 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/20 flex items-center gap-2
                                ${viewMode === 'tour' ? 'bg-brand-primary text-white' : 'bg-brand-primary/80 text-white hover:bg-brand-primary'}`}
                             title="Recorrido"
                         >
                             <Rotate3d size={20} />
                             <span className="hidden xl:inline font-medium text-sm tracking-wide">Recorrido</span>
                         </button>
                      )}

                     {/* Fullscreen Toggle */}
                     <FullScreenToggle />
                 </div>

                 {/* Mobile: Vertical Stack (Expand + More) */}
                 <div className="lg:hidden flex flex-col items-end gap-3">
                     <FullScreenToggle />
                     <button 
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-3 rounded-full bg-brand-primary/80 text-white hover:bg-brand-primary backdrop-blur-md border border-white/20 shadow-lg transition-colors"
                     >
                         <MoreVertical size={20} />
                     </button>
                 </div>
            </div>

            {/* Mobile Action Menu Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex flex-col items-end justify-center pr-8 md:pr-16 gap-6 animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    {/* Ver Detalles Option */}
                    <button 
                        onClick={() => {
                            setShowDetails(true);
                            setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-4 text-white hover:text-brand-primary transition-colors group text-right"
                    >
                        <span className="text-xl font-light uppercase tracking-widest">Ver Detalles</span>
                        <div className="p-4 rounded-full bg-neutral-800 group-hover:bg-brand-primary transition-colors border border-white/10">
                            <PanelRightOpen size={24} />
                        </div>
                    </button>

                     {/* Tour Button */}
                      {unit.tourUrl && (
                          <button 
                            onClick={() => {
                                setIsMobileMenuOpen(false);
                                handleViewChange(viewMode === 'tour' ? 'furnished' : 'tour');
                            }}
                            className="flex items-center gap-4 text-white hover:text-brand-primary transition-colors group text-right"
                         >
                             <span className="text-xl font-light uppercase tracking-widest">{viewMode === 'tour' ? 'Cerrar Tour' : 'Tour 360'}</span>
                             <div className={`p-4 rounded-full transition-colors border border-white/10 group-hover:bg-brand-primary
                                ${viewMode === 'tour' ? 'bg-brand-primary' : 'bg-neutral-800'}
                            `}>
                                <Rotate3d size={24} />
                            </div>
                         </button>
                      )}
                 
                     {/* Gallery Button */}
                     <button 
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleViewChange(viewMode === 'gallery' ? 'furnished' : 'gallery');
                        }}
                        className="flex items-center gap-4 text-white hover:text-brand-primary transition-colors group text-right"
                     >
                         <span className="text-xl font-light uppercase tracking-widest">{viewMode === 'gallery' ? 'Cerrar Galería' : 'Galería'}</span>
                         <div className={`p-4 rounded-full transition-colors border border-white/10 group-hover:bg-brand-primary
                                ${viewMode === 'gallery' ? 'bg-brand-primary' : 'bg-neutral-800'}
                            `}>
                             <ImageIcon size={24} />
                         </div>
                     </button>
                    
                     {/* Close Menu Button (Optional, clicking bg works too) */}
                     <div className="absolute top-6 right-6">
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                        >
                            <X size={24} />
                        </button>
                     </div>
                </div>
            )}

            {/* Content Area */}
            <div className="absolute inset-0 z-0">
                {/* Main Content (Static/Gallery/Tour) */}
                {renderContent()}
                
                {/* Transition Video Overlay */}
                {isPlayingTransition && transitionVideo && (
                    <div className="absolute inset-0 z-40 bg-black">
                        <video 
                            ref={videoRef}
                            src={transitionVideo}
                            className="w-full h-full object-contain"
                            playsInline
                            // muted 
                            // autoPlay called in useEffect
                            onEnded={() => {
                                setIsPlayingTransition(false);
                                setTransitionVideo(null);
                            }}
                        />
                    </div>
                )}
                
                {/* Loading Overlay */}
                {isLoadingNav && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Navigation Arrows (Only if NOT in gallery or tour) */}
                {viewMode !== 'gallery' && viewMode !== 'tour' && !isPlayingTransition && !isLoadingNav && (
                    <>
                        {navState.showLeft && navState.leftTarget && (
                           <button 
                                onClick={() => startTransition(navState.leftTarget!)}
                                className="absolute left-6 top-1/2 -translate-y-1/2 z-30 flex items-center gap-3 p-3 bg-black/40 hover:bg-black/60 backdrop-blur text-white rounded-full transition-all group pr-5"
                           >
                               <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-medium tracking-wide uppercase hidden sm:block">
                                   {navState.leftTarget === 'furnished' && (unit.subtitle === 'Terraza' ? 'Terraza' : 'Amueblado')}
                                   {navState.leftTarget === 'unfurnished' && 'Sin Amueblar'}
                               </span>
                           </button>
                        )}
                        
                        {navState.showRight && navState.rightTarget && (
                           <button 
                                onClick={() => startTransition(navState.rightTarget!)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex items-center gap-3 p-3 bg-black/40 hover:bg-black/60 backdrop-blur text-white rounded-full transition-all group pl-5"
                           >
                               <span className="text-sm font-medium tracking-wide uppercase hidden sm:block">
                                   {navState.rightTarget === 'furnished' && (unit.subtitle === 'Terraza' ? 'Terraza' : 'Amueblado')}
                                   {navState.rightTarget === 'plans' && (unit.subtitle === 'Terraza' ? 'Medidas' : 'Medidas')}
                               </span>
                               <ChevronRight size={28} className="group-hover:translate-x-1 transition-transform" />
                           </button>
                        )}
                    </>
                )}
            </div>
      </div>
    </div>
  );
};

export default UnitPage;
