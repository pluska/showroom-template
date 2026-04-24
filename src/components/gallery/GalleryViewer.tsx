import React, { useEffect, useCallback } from 'react';
import type { GalleryImage } from '../../data/galleries';
import { Menu, ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react';
import { preloadImages } from '../../utils/preload';

interface GalleryViewerProps {
  images: GalleryImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenSidebar?: () => void;
  showInfo?: boolean;
}

const GalleryViewer: React.FC<GalleryViewerProps> = ({ images, initialIndex, isOpen, onClose, onOpenSidebar, showInfo = true }) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  
  // Double Buffer State
  const [backgroundSrc, setBackgroundSrc] = React.useState<string>(images[initialIndex]?.src);
  const [loadedSrc, setLoadedSrc] = React.useState<string | null>(images[initialIndex]?.src);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    // Reset buffer state on open
    if (images[initialIndex]) {
        setBackgroundSrc(images[initialIndex].src);
        setLoadedSrc(images[initialIndex].src);
    }
  }, [initialIndex, images]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // FIX 1: Smart Background Preloading (Side Effect)
  // Aggressively preload next 3 images and previous 1
  useEffect(() => {
    if (!isOpen || !images || images.length === 0) return;
    
    const count = images.length;
    const next1 = (currentIndex + 1) % count;
    const next2 = (currentIndex + 2) % count;
    const prev = (currentIndex - 1 + count) % count;
    
    // Fire and forget preload for neighbors
    preloadImages([
        images[next1].src, 
        images[next2].src,
        images[prev].src
    ]).catch(() => {});
  }, [currentIndex, images, isOpen]);

  // FIX 2: Non-blocking Navigation
  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Immediate state update
    setCurrentIndex(current => (current + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Immediate state update
    setCurrentIndex(current => (current - 1 + images.length) % images.length);
  }, [images.length]);

  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  if (!isOpen) return null;

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];
  if (!currentImage) return null; // Safe guard for index out of bounds

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black" // Changed to black for immersive feel with object-cover
      onClick={(e) => e.stopPropagation()}
    >
        {/* Top Bar Controls */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-50 pointer-events-none">
            {/* Left Controls */}
            <div className="flex flex-col items-start gap-4 pointer-events-auto">
                 <div className="flex gap-4">
                     <button
                        onClick={onOpenSidebar}
                        className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center hover:bg-brand-dark-orange transition-colors shadow-lg"
                     >
                        <Menu size={20} />
                     </button>
                 </div>
                 
                 {/* Title Pill */}
                 {showInfo && (currentImage.title || currentImage.alt) && (
                  <div className="mt-2 px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs uppercase tracking-widest font-secondary rounded-sm border border-white/10">
                      {currentImage.title || currentImage.alt}
                  </div>
                 )}
            </div>

            {/* Right Controls */}
            <div className="flex gap-4 pointer-events-auto">
                 <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-black/50 hover:bg-black text-white flex items-center justify-center transition-colors backdrop-blur-md border border-white/10"
                 >
                     <Minimize2 size={20} />
                 </button>
            </div>
        </div>

      {/* Main Image Area */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden group">
        
        {/* Prev Arrow */}
         <button 
             className="absolute left-6 z-40 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/80 transition-all backdrop-blur-sm border border-white/10 translate-x-[-200%] group-hover:translate-x-0 duration-300"
             onClick={handlePrev}
         >
             <ChevronLeft size={24} />
         </button>

         {/* Image Container - Double Buffered */}
         <div className="w-full h-full relative">
             {/* Background Buffer (Previous Image) */}
             {/* usage of backgroundSrc ensures we always have something to show while loading */}
             <img 
                 src={backgroundSrc || currentImage.src} 
                 alt="" 
                 className="absolute inset-0 w-full h-full object-cover z-0"
             />

             {/* Foreground Image (Current Target) */}
             <img 
                 key={currentImage.src} // Force remount on change to restart transition state
                 src={currentImage.src} 
                 alt={currentImage.alt} 
                 loading="eager"
                 decoding="sync"
                 className={`absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500 ease-in-out ${
                    loadedSrc === currentImage.src ? 'opacity-100' : 'opacity-0'
                 }`} 
                 onLoad={() => {
                     setLoadedSrc(currentImage.src);
                     // Update background buffer after transition completes to be ready for next switch
                     setTimeout(() => {
                        setBackgroundSrc(currentImage.src);
                     }, 500);
                 }}
             />
         </div>

         {/* Next Arrow */}
         <button 
             className="absolute right-6 z-40 w-12 h-12 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/80 transition-all backdrop-blur-sm border border-white/10 translate-x-[200%] group-hover:translate-x-0 duration-300"
             onClick={handleNext}
         >
             <ChevronRight size={24} />
         </button>
      </div>

    </div>
  );
};

export default GalleryViewer;
