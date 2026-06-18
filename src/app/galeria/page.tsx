"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { type GalleryImage } from '@/data/galleries';
import { assetManifest, getAssetUrl } from '@/utils/assets';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { Menu, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'; 
import { preloadImages } from '@/utils/preload';
import { useStore } from '@/store/useStore';
import { getGalleryCollections, getGalleryImages, seedGalleryCollections } from '@/app/actions/galleries';

const GalleryPage = () => {
  const [collections, setCollections] = useState<any[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dynamicImages, setDynamicImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const setGlobalLoading = useStore((state) => state.setGlobalLoading);

  // 1. Load Collections from Database
  useEffect(() => {
    setGlobalLoading(true);
    setIsLoading(true);
    seedGalleryCollections().then(() => {
      getGalleryCollections().then((data) => {
        const activeCollections = data.filter(c => c.isActive);
        setCollections(activeCollections);
        setActiveTabId('amenities');
      });
    });
  }, [setGlobalLoading]);

  // 2. Load Images from Database or Fallback to Asset Manifest
  useEffect(() => {
    if (!activeTabId) return;
    
    setCurrentIndex(0); // Reset index on tab change
    setGlobalLoading(true);
    setIsLoading(true);
    
    getGalleryImages(activeTabId).then((dbMedia) => {
      const timer = setTimeout(() => {
        const dbImages: GalleryImage[] = dbMedia.map(m => ({
          id: m.id,
          src: getAssetUrl(m.url),
          alt: m.title,
          title: m.title
        }));

        if (dbImages.length > 0) {
          setDynamicImages(dbImages);
        } else {
          // Fallback logic to local assets if DB has no images
          let folderPrefix = undefined;
          if (activeTabId === 'amenities') {
            folderPrefix = 'amenities/';
          } else if (activeTabId === 'general') {
            folderPrefix = 'gallery/';
          }
          
          if (folderPrefix) {
            const matchingAssets = assetManifest.filter(path => path.startsWith(folderPrefix));
            const images: GalleryImage[] = matchingAssets.map(path => {
              const filename = path.split('/').pop() || path;
              const name = filename.split('.')[0].replace(/_/g, ' ').replace(/-/g, ' ');
              let title = name.charAt(0).toUpperCase() + name.slice(1);
              if (/^\d+$/.test(title)) title = `Amenity ${title}`;
              
              return {
                id: path,
                src: getAssetUrl(path),
                alt: title,
                title: title
              };
            });
            setDynamicImages(images);
          } else {
            // General fallback: if no folder prefix, look for any image in asset manifest starting with 'gallery/' as generic
            const matchingAssets = assetManifest.filter(path => path.startsWith('gallery/'));
            const images: GalleryImage[] = matchingAssets.map(path => {
              const filename = path.split('/').pop() || path;
              const name = filename.split('.')[0].replace(/_/g, ' ').replace(/-/g, ' ');
              const title = name.charAt(0).toUpperCase() + name.slice(1);
              return {
                id: path,
                src: getAssetUrl(path),
                alt: title,
                title: title
              };
            });
            setDynamicImages(images);
          }
        }
        setIsLoading(false);
        setGlobalLoading(false);
      }, 300); // 300ms min loading time to prevent flicker

      return () => clearTimeout(timer);
    });
  }, [activeTabId, setGlobalLoading]);

  const displayImages = useMemo(() => {
    return dynamicImages;
  }, [dynamicImages]);

  // 3. Smart Preloading
  useEffect(() => {
    if (displayImages.length === 0) return;
    const count = displayImages.length;
    const nextIndex = (currentIndex + 1) % count;
    const prevIndex = (currentIndex - 1 + count) % count;
    preloadImages([displayImages[nextIndex].src, displayImages[prevIndex].src]).catch(() => {});
  }, [currentIndex, displayImages]);

  // 4. Navigation Handlers
  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (displayImages.length === 0) return;
    setCurrentIndex(current => (current + 1) % displayImages.length);
  }, [displayImages.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (displayImages.length === 0) return;
    setCurrentIndex(current => (current - 1 + displayImages.length) % displayImages.length);
  }, [displayImages.length]);

  // 5. Keyboard Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  const currentImage = displayImages[currentIndex];

  return (
    <div className="flex bg-black h-full relative overflow-hidden group">
      
      {/* Top Controls Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-30 pointer-events-none">
          {/* Left: Sidebar Toggle & Info */}
          <div className="flex flex-col items-start gap-4 pointer-events-auto">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-dark-orange transition-colors shadow-lg"
                >
                  <Menu size={20} />
                </button>
                
                {/* Title Pill */}
                {activeTabId !== 'amenities' && currentImage && (currentImage.title || currentImage.alt) && (
                  <div className="mt-2 px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs uppercase tracking-widest font-secondary rounded-sm border border-white/10">
                      {currentImage.title || currentImage.alt}
                  </div>
                )}
          </div>

          {/* Right: Expand/Fullscreen Toggle */}
          <div className="pointer-events-auto">
              <FullScreenToggle />
          </div>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Image Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black w-full h-full">
         {isLoading ? (
            <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <span className="text-xs uppercase tracking-widest font-secondary">Cargando Galería...</span>
            </div>
         ) : (
           <>
             {displayImages.length > 0 && currentImage ? (
               <>
                 {/* Prev Arrow */}
                 <button 
                     className="absolute left-6 z-20 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/80 transition-all backdrop-blur-sm border border-white/10 duration-300"
                     onClick={handlePrev}
                 >
                     <ChevronLeft size={24} />
                 </button>

                 {/* Image */}
                 <div className="w-full h-full p-0 flex items-center justify-center">
                    <img 
                        key={currentImage.src}
                        src={currentImage.src} 
                        alt={currentImage.alt} 
                        className="w-full h-full object-contain" 
                    />
                 </div>

                 {/* Next Arrow */}
                 <button 
                     className="absolute right-6 z-20 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/80 transition-all backdrop-blur-sm border border-white/10 duration-300"
                     onClick={handleNext}
                 >
                     <ChevronRight size={24} />
                 </button>

                 {/* Counter/Index */}
                 <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
                     <div className="text-xs font-medium bg-black/30 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                        {currentIndex + 1} / {displayImages.length}
                     </div>
                 </div>
               </>
             ) : (
                <div className="text-gray-500 font-secondary text-sm uppercase tracking-widest">
                    No hay imágenes configuradas en esta galería.
                </div>
             )}
           </>
         )}
      </div>

    </div>
  );
};
export default GalleryPage;
