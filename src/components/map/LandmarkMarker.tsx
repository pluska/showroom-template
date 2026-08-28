"use client";
import { useRef } from 'react';
import { Play } from 'lucide-react';
import { getAssetUrl } from '@/utils/assets';
import type { Landmark } from '@/data/landmarks';

interface LandmarkMarkerProps {
  landmark: Landmark;
  /** Travel time in seconds from the project, for the current transport mode. */
  duration?: number;
  /** Whether this hito's card is the one on screen (the map allows only one). */
  active: boolean;
  onActiveChange: (slug: string, active: boolean) => void;
  /** Pick the hito as a destination, like any other point on the map. */
  onSelect: (landmark: Landmark) => void;
  /** Play the hito's clip. */
  onOpen: (slug: string) => void;
}

/**
 * A raised pin for one of the four hitos.
 *
 * Pointer devices open the card on hover; a tap opens it too, which is the
 * only way in on touch. Either way the click also picks the place as a
 * destination, so the route and its travel time behave like any other point.
 * The preview clip is only mounted while the card is open.
 */
export default function LandmarkMarker({ landmark, duration, active, onActiveChange, onSelect, onOpen }: LandmarkMarkerProps) {
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onActiveChange(landmark.slug, true);
  };

  // Small grace period so the pointer can travel from the pin to the card
  // without the card disappearing under it.
  const hide = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => onActiveChange(landmark.slug, false), 120);
  };

  const minutes = duration ? Math.round(duration / 60) : null;

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer"
      style={{ zIndex: active ? 9998 : 40 }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(landmark);
        // A click only picks the destination and opens the card with the travel
        // time; the clip is reserved for "Ver más". Touch has no hover, so the
        // tap is also the only way the card gets opened there.
        show();
      }}
    >
      {/* Preview card */}
      <div
        className={`absolute bottom-full mb-3 w-48 rounded-2xl overflow-hidden bg-black shadow-2xl ring-1 ring-black/10 transition-all duration-300 ${active ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      >
        <div className="relative w-full aspect-[9/16]">
          {active && (
            <video
              src={getAssetUrl(landmark.preview)}
              poster={getAssetUrl(landmark.poster)}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/90 to-transparent">
            <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
              {landmark.category}
            </p>
            <h3 className="text-sm font-bold text-white leading-tight">{landmark.name}</h3>
            {minutes !== null && (
              <p className="text-[11px] text-white/80 mt-0.5">A {minutes} min del proyecto</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpen(landmark.slug);
              }}
              className="mt-2 inline-flex items-center gap-1.5 bg-white hover:bg-white/90 text-gray-900 text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <Play size={12} className="fill-current" />
              Ver más
            </button>
          </div>
        </div>
      </div>

      {/* Pin */}
      <div className={`relative transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white shadow-xl border-2 border-brand-orange relative z-10">
          <img
            src={getAssetUrl(landmark.poster)}
            alt={landmark.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
            <Play size={16} className="text-white fill-current drop-shadow" />
          </div>
        </div>
        {/* Triangle pointer */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-2.5 w-6 h-6 bg-brand-orange rotate-45 shadow-sm z-0" />
      </div>

      {/* Name plate — absolute so the pin's tip, not the plate, marks the spot */}
      <div className="absolute top-full mt-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm shadow-md whitespace-nowrap">
        <span className="text-[10px] font-bold text-gray-800">{landmark.name}</span>
        {minutes !== null && <span className="text-[10px] text-brand-orange font-bold"> · {minutes} min</span>}
      </div>
    </div>
  );
}
