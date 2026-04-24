"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { galleries, type GalleryImage } from '@/data/galleries';
import { assetManifest, getAssetUrl } from '@/utils/assets';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { Menu, ChevronLeft, ChevronRight } from 'lucide-react'; 
import { preloadImages } from '@/utils/preload';
import { useStore } from '@/store/useStore';

const GalleryPage = () => {
  const [activeTabId, setActiveTabId] = useState(galleries[0]?.id || 'general');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dynamicImages, setDynamicImages] = useState<GalleryImage[]>([]);
  const setGlobalLoading = useStore((state) => state.setGlobalLoading);

  const activeGalleryBase = useMemo(() => {
     return galleries.find(g => g.id === activeTabId) || galleries[0];
  }, [activeTabId]);

  // 2. Load Images from Manifest
  useEffect(() => {
    setCurrentIndex(0); // Reset index on tab change
    setGlobalLoading(true);
    
    // Simulate a brief loading time for smoothness/Asset discovery
    const timer = setTimeout(() => {
        if (activeGalleryBase?.folderPrefix) {
            const prefix = activeGalleryBase.folderPrefix;
            const matchingAssets = assetManifest.filter(path => path.startsWith(prefix));
            
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
            setDynamicImages([]);
        }
        setGlobalLoading(false);
    }, 300); // 300ms min loading time to prevent flicker

    return () => clearTimeout(timer);
  }, [activeGalleryBase, setGlobalLoading]);

  const displayImages = useMemo(() => {
      // If gallery base has hardcoded images (from mock), use them, else use dynamic, or mix
      // The original migration logic suggests galleries.ts might be empty and rely on dynamic
      // But let's support both
      return [...(activeGalleryBase?.images || []), ...dynamicImages];
  }, [activeGalleryBase, dynamicImages]);

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

  // 6. Current Image Safety
  const currentImage = displayImages[currentIndex];

  // 7. Render
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
            <div className="text-gray-500">
                {galleries.length === 0 ? 'No galleries configured.' : 'Loading images...'}
            </div>
         )}
      </div>

    </div>
  );
};
export default GalleryPage;
