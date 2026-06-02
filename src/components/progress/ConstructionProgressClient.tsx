"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { Calendar, ChevronLeft, ChevronRight, Menu, Hammer } from "lucide-react";
import gsap from "gsap";
import FullScreenToggle from "@/components/UI/FullScreenToggle";
import { getAssetUrl } from "@/utils/assets";
import config from "@/config/config";

export interface ProgressUpdateClient {
  id: string;
  date: string; // e.g. "Mayo 2026"
  title: string;
  description: string;
  mediaType: "image" | "video";
  mediaUrl: string;
}

interface ConstructionProgressClientProps {
  initialUpdates: ProgressUpdateClient[];
}

export default function ConstructionProgressClient({ initialUpdates }: ConstructionProgressClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);

  const updates = initialUpdates;
  const currentUpdate = updates[currentIndex];

  useEffect(() => {
    // Animation when changing update
    if (updates.length === 0) return;

    if (contentRef.current) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
    if (mediaRef.current) {
      gsap.fromTo(
        mediaRef.current,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power2.out" }
      );
    }
  }, [currentIndex, updates]);

  const handleNext = () => {
    if (currentIndex < updates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // If there are no updates (e.g. database error/cleared)
  if (updates.length === 0) {
    return (
      <div className="h-full w-full bg-black text-white relative overflow-hidden flex flex-col items-center justify-center p-6 font-sans">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full transition-all cursor-pointer shadow-lg"
          >
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold uppercase tracking-[0.2em]">Avance de Obra</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-secondary">
              {config.company?.buildingName}
            </p>
          </div>
        </div>

        <div className="text-center space-y-4 max-w-md">
          <div className="p-4 rounded-full bg-white/10 text-brand-primary w-fit mx-auto">
            <Hammer size={48} className="text-brand-orange animate-pulse" />
          </div>
          <h2 className="text-2xl font-light tracking-tight">Sin Avances Disponibles</h2>
          <p className="text-gray-400 font-secondary text-sm">
            Pronto subiremos los reportes mensuales de avance de obra. Regresa más tarde para ver el progreso del edificio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black text-white relative overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Header / Navigation */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full transition-all cursor-pointer shadow-lg"
        >
          <Menu size={24} />
        </button>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold uppercase tracking-[0.2em]">Avance de Obra</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-secondary">
            {config.company?.buildingName}
          </p>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-50">
        <FullScreenToggle />
      </div>

      {/* Main Content Area */}
      <div className="relative h-full w-full flex flex-col md:flex-row">
        {/* Media Container */}
        <div className="flex-1 relative bg-neutral-900 overflow-hidden group h-[50vh] md:h-full">
          <div ref={mediaRef} className="absolute inset-0 flex items-center justify-center">
            {currentUpdate.mediaType === "image" ? (
              <img
                src={getAssetUrl(currentUpdate.mediaUrl)}
                alt={currentUpdate.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                key={currentUpdate.mediaUrl}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <source src={getAssetUrl(currentUpdate.mediaUrl)} type="video/mp4" />
              </video>
            )}
          </div>

          {/* Media Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

          {/* Navigation Buttons (Desktop) */}
          <div className="absolute inset-y-0 left-0 w-24 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all ${
                currentIndex === 0 ? "opacity-0" : "cursor-pointer hover:scale-110"
              }`}
            >
              <ChevronLeft size={32} />
            </button>
          </div>
          <div className="absolute inset-y-0 right-0 w-24 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleNext}
              disabled={currentIndex === updates.length - 1}
              className={`p-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 transition-all ${
                currentIndex === updates.length - 1 ? "opacity-0" : "cursor-pointer hover:scale-110"
              }`}
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="w-full md:w-[400px] lg:w-[450px] bg-black/90 backdrop-blur-3xl border-l border-white/10 p-8 lg:p-12 flex flex-col justify-between relative z-20 overflow-y-auto">
          <div ref={contentRef} className="space-y-6 md:mt-24">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/20 border border-brand-primary/30 rounded-full text-brand-primary text-[10px] font-bold uppercase tracking-widest">
              <Calendar size={12} className="text-brand-orange" />
              {currentUpdate.date}
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-light tracking-tight leading-tight">
                {currentUpdate.title}
              </h2>
              <p className="text-gray-400 font-secondary leading-relaxed text-sm lg:text-base whitespace-pre-line">
                {currentUpdate.description}
              </p>
            </div>
          </div>

          {/* Timeline Navigation (Bottom) */}
          <div className="mt-12 md:mt-auto pt-8 border-t border-white/5">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
              {updates.map((update, index) => (
                <button
                  key={update.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-32 group cursor-pointer transition-all text-left ${
                    index === currentIndex ? "opacity-100" : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <div
                    className={`h-1 w-full mb-3 rounded-full transition-all ${
                      index === currentIndex ? "bg-brand-primary" : "bg-white/20"
                    }`}
                  />
                  <p
                    className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                      index === currentIndex ? "text-brand-primary" : "text-white"
                    }`}
                  >
                    {update.date}
                  </p>
                  <p className="text-[9px] text-gray-500 line-clamp-1 uppercase tracking-tighter">
                    {update.title}
                  </p>
                </button>
              ))}
            </div>

            {/* Mobile Navigation Controls */}
            <div className="md:hidden flex justify-between items-center pt-4">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2 bg-white/5 rounded-full disabled:opacity-20"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
                {currentIndex + 1} / {updates.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex === updates.length - 1}
                className="p-2 bg-white/5 rounded-full disabled:opacity-20"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
