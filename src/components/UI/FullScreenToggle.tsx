"use client";
import { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

interface FullScreenToggleProps {
  className?: string;
}

const FullScreenToggle = ({ className = '' }: FullScreenToggleProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.warn("Fullscreen request failed", e);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className={`relative ${className} z-50`}>
      <button
        onClick={toggleFullscreen}
        className="peer p-2 bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full text-white transition-all hover:scale-110 cursor-pointer shadow-lg"
        aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>
      <div className="absolute top-1/2 right-full mr-3 -translate-y-1/2 px-3 py-1 bg-black/80 backdrop-blur-sm text-white text-xs rounded-md opacity-0 peer-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {isFullscreen ? 'Contraer' : 'Expandir'}
      </div>
    </div>
  );
};

export default FullScreenToggle;
