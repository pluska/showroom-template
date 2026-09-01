"use client";

import React, { useState, useRef } from 'react';

interface ImageComparisonSliderProps {
  dayImage: string;
  nightImage: string;
  alt?: string;
  /** Edge-to-edge mode: drops the card chrome (rounding, border, shadow) so the
   *  comparison can sit flush against the viewport. */
  fullBleed?: boolean;
}

export const ImageComparisonSlider: React.FC<ImageComparisonSliderProps> = ({
  dayImage,
  nightImage,
  alt = 'Amenities Comparison',
  fullBleed = false
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    let position = (x / rect.width) * 100;
    if (position < 0) position = 0;
    if (position > 100) position = 100;
    setSliderPosition(position);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.current) return;
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // Only move if not clicking the handle itself to avoid jitter
    const target = e.target as HTMLElement;
    if (target.closest('.slider-handle-btn')) return;
    handleMove(e.clientX);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none cursor-pointer bg-neutral-900 ${
        fullBleed ? '' : 'rounded-2xl shadow-2xl border border-white/10'
      }`}
      onClick={handleContainerClick}
    >
      {/* Day Image (Background / Underneath) */}
      <div className="w-full h-full flex items-center justify-center">
        <img 
          src={dayImage} 
          alt={`${alt} - Day`} 
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Night Image (Overlay / Clipped) */}
      {/* We clip the LEFT side: from 0% to sliderPosition% is Day, from sliderPosition% to 100% is Night */}
      {/* This means the night version shows up on the right, and the day version on the left */}
      <div 
        className="absolute inset-0 pointer-events-none flex items-center justify-center"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img 
          src={nightImage} 
          alt={`${alt} - Night`} 
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>

      {/* Vertical Slider Line divider */}
      <div 
        className="absolute inset-y-0 z-20 w-[2px] bg-white cursor-ew-resize drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Handle Button */}
        <button 
          type="button"
          aria-label="Arrastra para comparar"
          className="slider-handle-btn absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-white hover:bg-neutral-50 active:scale-95 text-ocean-800 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.35)] border border-neutral-200 select-none cursor-ew-resize transition-all duration-150"
        >
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none"
          >
            <path 
              d="M8 7L3 12L8 17M16 7L21 12L16 17" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Dynamic Labels for Day and Night */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-secondary font-bold px-3 py-1 rounded border border-white/10 pointer-events-none">
        Día
      </div>
      <div className="absolute bottom-4 right-4 z-10 bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-secondary font-bold px-3 py-1 rounded border border-white/10 pointer-events-none">
        Noche
      </div>
    </div>
  );
};

export default ImageComparisonSlider;
