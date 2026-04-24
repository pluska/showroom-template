"use client";
import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import gsap from 'gsap';
import { buildingFaces } from '@/data/buildingData';
import { floorsData } from '@/data/floors';
import { preloadImages } from '@/utils/preload';

interface SceneControllerProps {
  isHighlighted?: boolean;
}

export default function SceneController({ isHighlighted }: SceneControllerProps) {
  const { viewState, endTransition, currentRoom, currentFace, confirmRotation, finishRotation, transitionUrl, timeOfDay, finishTimeLapse, targetDestination } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const panoRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // ROOM TRANSITION (Walk)
    if (viewState === 'TRANSITION_VIDEO' && videoRef.current) {
      // 1. Start Video
      videoRef.current.style.zIndex = "10"; 
      // Use dynamic video based on current face and time of day
      // Fallback to day video if distinct one not provided in data structure (though it is now)
      
      // If we have an explicit transitionUrl (e.g. Intro), use it.
      // Otherwise use the face's introVideo (generic enter)
      const currentAssetSet = buildingFaces[currentFace][timeOfDay];
      videoRef.current.src = transitionUrl || currentAssetSet.introVideo || ""; 
      
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.error("Video play failed:", e));
      
      gsap.to(videoRef.current, { opacity: 1, duration: 0 });

      // Preload destination assets while video plays
      if (targetDestination === 'Floors') {
          // Find the initial floor we navigate to
          const targetFloor = floorsData.find(f => f.id === '9');
          if (targetFloor) {
              preloadImages([targetFloor.floorPlanImage]).catch(e => console.warn("Background preload failed", e));
          }
      }
    }
    
    // ROTATION & TIMELAPSE TRANSITION
    else if ((viewState === 'TRANSITION_ROTATION' || viewState === 'TRANSITION_TIMELAPSE') && videoRef.current && transitionUrl) {
      videoRef.current.style.zIndex = "10";
      // Ensure we load the new URL
      videoRef.current.src = transitionUrl;
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(e => console.error("Transition video play failed:", e));
      
      // Usually rotation videos start matching the current view, so we fade in or cut
      // For now, let's fade in quickly to avoid flash
      gsap.to(videoRef.current, { opacity: 1, duration: 0 });
    }
  }, [viewState, transitionUrl]);

  const handleVideoEnd = () => {
    // If wrapping up a room transition
    // If wrapping up a room transition
    if (viewState === 'TRANSITION_VIDEO') {
        console.log('[Scene] handleVideoEnd: TRANSITION_VIDEO');
        // Navigate immediately without fading out to avoid revealing the background
        
        if (targetDestination === 'Floors') {
            // Keep video visible (zIndex 10) to mask the page unload/load
            endTransition('Sala Principal');
            router.push('/plantas');
        } else {
            if (videoRef.current) videoRef.current.style.zIndex = "-1"; 
            
            // Assume Intro (Lobby)
            // Just transition to IDLE in the Lobby
             // Fade out video to reveal Lobby
            if (videoRef.current) {
                 gsap.to(videoRef.current, {
                    opacity: 0,
                    duration: 0.5,
                    onComplete: () => {
                         if (videoRef.current) videoRef.current.style.zIndex = "-1";
                         endTransition('Lobby');
                    }
                 });
            } else {
                endTransition('Lobby');
            }
        }
    }
    // If wrapping up a rotation
    else if (viewState === 'TRANSITION_ROTATION') {
        console.log('[Scene] handleVideoEnd: TRANSITION_ROTATION - Calling confirmRotation');
        // 1. Commit the new face (background swap) behind the video
        confirmRotation(); 

        // 2. Fade out video to reveal new face
        // 2. Fade out video to reveal new face
        if (videoRef.current) {
             // Add a small delay to allow React to render the new background image
             // before we reveal it.
             gsap.to(videoRef.current, {
                opacity: 0,
                duration: 0.5, // Slower fade for smoother transition
                delay: 0.1, // Wait 100ms for DOM update
                onComplete: () => {
                    if (videoRef.current) videoRef.current.style.zIndex = "-1";
                    finishRotation();
                }
             });
        }
    }
    // If wrapping up a timelapse
    else if (viewState === 'TRANSITION_TIMELAPSE') {
        // 1. Toggle the time of day and reset state (background swap)
        finishTimeLapse();

        // 2. Fade out video to reveal new time of day
        if (videoRef.current) {
             gsap.to(videoRef.current, {
                opacity: 0,
                duration: 0.5,
                delay: 0.1, 
                onComplete: () => {
                    if (videoRef.current) videoRef.current.style.zIndex = "-1";
                }
             });
        }
    }
  };

  return (
    <div className="w-full h-full relative bg-black overflow-hidden">
      
      {/* LAYER 1: 360 Panorama (Static background for now) */}
      {/* LAYER 1: 360 Panorama (Static background for now) */}
      <div ref={panoRef} className="absolute inset-0 bg-gray-800 flex items-center justify-center">
        {/* If we are in the Exterior/Masterplan view, show faces. Otherwise show room name */}
        {currentRoom === 'Lobby' ? ( // Assuming Lobby/Exterior is the default starting point where rotation happens
           <div className="relative w-full h-full">
              <img 
                src={buildingFaces[currentFace][timeOfDay].background} 
                alt={buildingFaces[currentFace].name} 
                className="w-full h-full object-cover"
              />

              {/* Background Video Layer - Fades in when ready */}
              {buildingFaces[currentFace][timeOfDay].backgroundVideo && (
                <video
                  key={`${currentFace}-${timeOfDay}-${buildingFaces[currentFace][timeOfDay].backgroundVideo}`}
                  ref={bgVideoRef}
                  src={buildingFaces[currentFace][timeOfDay].backgroundVideo}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                  onCanPlay={(e) => {
                    gsap.to(e.currentTarget, { 
                      opacity: 1, 
                      duration: 1,
                      ease: "power2.inOut"
                    });
                  }}
                  onError={(e) => {
                    console.warn("Background video failed to load", e);
                  }}
                />
              )}

              {isHighlighted && buildingFaces[currentFace][timeOfDay].highlight && (
                 <img 
                    src={buildingFaces[currentFace][timeOfDay].highlight} 
                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10"
                    alt="Highlight"
                 />
              )}
              <div className="absolute top-10 left-10 p-4 bg-black/50 text-white z-20">
                <h1 className="text-2xl font-light tracking-widest">{buildingFaces[currentFace].name}</h1>
              </div>
           </div>
        ) : (
            <h1 className="text-4xl text-white font-light tracking-widest">
            360 VIEW: {currentRoom}
            </h1>
        )}
      </div>

      {/* LAYER 2: Transition Video (Invisible initially) */}
      <video 
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
        muted 
        playsInline
        onEnded={handleVideoEnd}
        onError={(e) => {
            console.warn("Video failed to load/play, skipping transition", e);
            handleVideoEnd();
        }}
      />
      
    </div>
  );
}
