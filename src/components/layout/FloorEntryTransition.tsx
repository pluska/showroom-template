"use client";
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getAssetUrl } from '@/utils/assets';
import { preloadImages } from '@/utils/preload';
import { getEntryFloorId } from '@/data/floors';

const SAFETY_TIMEOUT_MS = 4000;

// Plays the "walk into the building" video as a fixed, full-screen overlay
// that lives at the layout level (outside any page's component tree). This
// way it keeps playing uninterrupted across the showroom -> /plantas/9
// client-side navigation instead of being tied to (and unmounted with) the
// page that triggered it, which is what caused a flash/flicker between the
// video ending and the floor plan appearing.
export default function FloorEntryTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const viewState = useStore(state => state.viewState);
  const transitionUrl = useStore(state => state.transitionUrl);
  const targetDestination = useStore(state => state.targetDestination);
  const floorsData = useStore(state => state.floorsData);
  const hasNavigatedRef = useRef(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isTargetReady, setIsTargetReady] = useState(false);

  const isActive = viewState === 'TRANSITION_VIDEO' && targetDestination === 'Floors' && !!transitionUrl;
  const entryFloorId = getEntryFloorId(floorsData);
  const targetFloor = floorsData.find(f => f.id === entryFloorId);
  const targetFloorImage = targetFloor ? getAssetUrl(targetFloor.floorPlanImage) : null;

  useEffect(() => {
    if (isActive) {
      if (!hasNavigatedRef.current && !pathname.startsWith('/plantas')) {
        hasNavigatedRef.current = true;
        router.push(`/plantas/${entryFloorId}`);
      }
    } else {
      hasNavigatedRef.current = false;
      setVideoEnded(false);
      setIsTargetReady(false);
    }
  }, [isActive, pathname, router, entryFloorId]);

  // Don't reveal /plantas/9 until floor 9's data + image are actually ready —
  // on a very first/cold page load floorsData (or the image) may still be
  // in flight, which previously surfaced a "Floor not found" flash right as
  // the video ended. A safety timeout guarantees we never get stuck black if
  // floor 9 is somehow missing.
  useEffect(() => {
    if (!isActive) return;
    if (!targetFloorImage) return; // floorsData not loaded yet, nothing to warm
    let cancelled = false;
    preloadImages([targetFloorImage])
      .then(() => { if (!cancelled) setIsTargetReady(true); })
      .catch(() => { if (!cancelled) setIsTargetReady(true); });
    return () => { cancelled = true; };
  }, [isActive, targetFloorImage]);

  useEffect(() => {
    if (!isActive || !videoEnded) return;
    if (isTargetReady) {
      useStore.setState({ viewState: 'IDLE', transitionUrl: null, targetDestination: null, currentRoom: 'Lobby' });
      return;
    }
    const timeout = setTimeout(() => {
      useStore.setState({ viewState: 'IDLE', transitionUrl: null, targetDestination: null, currentRoom: 'Lobby' });
    }, SAFETY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [isActive, videoEnded, isTargetReady]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black">
      <video
        key={transitionUrl}
        src={transitionUrl!}
        autoPlay
        muted
        playsInline
        onLoadedMetadata={(e) => { e.currentTarget.play().catch(() => { }); }}
        onEnded={() => setVideoEnded(true)}
        onError={() => setVideoEnded(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
