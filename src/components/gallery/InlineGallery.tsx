import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { GalleryImage } from '../../data/galleries';
import GalleryViewer from './GalleryViewer';

interface InlineGalleryProps {
  images: GalleryImage[];
  showInfo?: boolean;
}

const InlineGallery: React.FC<InlineGalleryProps> = ({ images, showInfo = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isHoveringRoomBtn, setIsHoveringRoomBtn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(new Set());

  // Reset failed sources when gallery changes AND validate in background
  React.useEffect(() => {
      setFailedSrcs(new Set());
      setCurrentIndex(0);
      setIsLoading(false);
      
      // Background validation to prevent "white window" on navigation
      images.forEach(img => {
          const image = new Image();
          image.src = img.src;
          image.onerror = () => {
              setFailedSrcs(prev => {
                  const newSet = new Set(prev);
                  newSet.add(img.src);
                  return newSet;
              });
          };
      });
  }, [images]);

  const validImages = images.filter(img => !failedSrcs.has(img.src));

  if (!validImages || validImages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-3xl text-gray-400">
        No images available
      </div>
    );
  }

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isLoading) return;

    const nextIndex = (currentIndex + 1) % validImages.length;
    
    // Lock interface and preload
    setIsLoading(true);
    const img = new Image();
    img.src = validImages[nextIndex].src;
    
    const onComplete = () => {
        setCurrentIndex(nextIndex);
        setIsLoading(false);
    };

    img.onload = onComplete;
    img.onerror = onComplete; // Proceed anyway, handleImageError will catch display issues
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isLoading) return;

    const prevIndex = (currentIndex - 1 + validImages.length) % validImages.length;
    
    // Lock interface and preload
    setIsLoading(true);
    const img = new Image();
    img.src = validImages[prevIndex].src;
    
    const onComplete = () => {
        setCurrentIndex(prevIndex);
        setIsLoading(false);
    };

    img.onload = onComplete;
    img.onerror = onComplete;
  };
  
  // Ensure index is valid
  const safeIndex = currentIndex >= validImages.length ? 0 : currentIndex;
  const currentImage = validImages[safeIndex];

  const handleImageError = () => {
      console.warn("Gallery image failed to load:", currentImage.src);
      setFailedSrcs(prev => {
          const newSet = new Set(prev);
          newSet.add(currentImage.src);
          // If we remove current image, safeIndex will point to next one automatically (or 0)
          return newSet;
      });
  };

  return (
    <div className="w-full h-full flex flex-col">
       {/* Fullscreen Viewer */}
       <GalleryViewer
        images={validImages}
        initialIndex={safeIndex}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        showInfo={showInfo}
      />

      <div className="relative w-full flex-1 min-h-0 bg-white shadow-xl overflow-hidden group">
        
        {/* Main Image Layer */}
        <div 
            className="absolute inset-0"
        >
            <img 
                key={currentImage.src} // Key ensures remount on change
                src={currentImage.src} 
                alt={currentImage.alt} 
                className="w-full h-full object-cover"
                onError={handleImageError}
            />
            {/* Highlight Image Layer (fades in) */}
            {currentImage.highlightUrl && (
              <img 
                  src={currentImage.highlightUrl} 
                  alt={currentImage.alt + " Highlight"} 
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isHoveringRoomBtn ? 'opacity-100' : 'opacity-0'}`}
              />
            )}
            
            {/* Hover overlay hint */}
            
            {/* Loading Indicator Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px] transition-all duration-300">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin shadow-lg"></div>
                </div>
            )}
        </div>

        {/* Navigation Controls */}
        {validImages.length > 1 && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4 z-10">
                <button
                    onClick={handlePrev}
                    className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-neutral-900 shadow-lg backdrop-blur-sm flex items-center justify-center pointer-events-auto transition-all transform hover:scale-110 active:scale-95"
                >
                    <ChevronLeft size={20} />
                </button>

                <button
                    onClick={handleNext}
                    className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-neutral-900 shadow-lg backdrop-blur-sm flex items-center justify-center pointer-events-auto transition-all transform hover:scale-110 active:scale-95"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        )}

        {/* Info Bar & Entrar Button */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10">
            <div className="flex items-end justify-between text-white">
                <div>
                    <h3 className="font-semibold text-lg drop-shadow-md">{currentImage.title || currentImage.alt}</h3>
                    {currentImage.description && (
                        <p className="text-sm opacity-90 font-light drop-shadow-sm line-clamp-1">{currentImage.description}</p>
                    )}
                </div>
                
                <div className="flex flex-col items-end gap-3">
                   {/* Entrar Button - Only if highlight exists */}
                   {currentImage.highlightUrl && (
                      <button
                        className="pointer-events-auto px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white text-sm font-medium tracking-wide border border-white/30 hover:border-white/50 transition-all shadow-lg"
                        onMouseEnter={() => setIsHoveringRoomBtn(true)}
                        onMouseLeave={() => setIsHoveringRoomBtn(false)}
                      >
                        Entrar
                      </button>
                   )}

                   {validImages.length > 1 && (
                       <div className="text-xs font-medium bg-black/30 px-3 py-1 rounded-full backdrop-blur-md">
                          {safeIndex + 1} / {validImages.length}
                       </div>
                   )}

                   {/* Expand Button */}
                   <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsViewerOpen(true);
                        }}
                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                   >
                        <Maximize2 size={16} />
                   </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default InlineGallery;
