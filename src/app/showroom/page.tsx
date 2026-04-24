"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import SceneController from '@/components/360/SceneController';
import Sidebar from '@/components/layout/Sidebar';
import { Sun, Moon, Rotate3d } from 'lucide-react';
import { preloadImages, preloadVideo } from '@/utils/preload';
import { getAssetUrl } from '@/utils/assets';
import Loader from '@/components/UI/Loader';
import { buildingFaces } from '@/data/buildingData';
import FullScreenToggle from '@/components/UI/FullScreenToggle';
import { showroomConfig } from '@/data/showroom';

const ShowroomContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const startTransition = useStore(state => state.startTransition);
  const viewState = useStore(state => state.viewState);
  const currentRoom = useStore(state => state.currentRoom);
  const rotateBuilding = useStore(state => state.rotateBuilding);
  const timeOfDay = useStore(state => state.timeOfDay);
  const toggleTimeOfDay = useStore(state => state.toggleTimeOfDay);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isHoveringIngresar, setIsHoveringIngresar] = useState(false);
  const currentFace = useStore(state => state.currentFace);
  const isLoadingAssets = useStore(state => state.isLoadingAssets);

  // Reset state on mount or params change
  useEffect(() => {
    const initShowroom = async () => {
        // Set loading initially
        useStore.setState({ isLoadingAssets: true });
        
        const transition = searchParams.get('transition');
        // targetPath is handled by the store or router logic usually, 
        // but here we just need to know if we are entering via a specific flow.
        
        // Reset to Day if entering via Intro (or fresh load) because the Intro video is Day-only.
        const shouldResetToDay = !transition || transition === 'intro';

        useStore.setState({ 
          currentRoom: showroomConfig.initialRoom, 
          viewState: 'IDLE',
          currentFloor: showroomConfig.initialFloor, 
          transitionUrl: null,
          currentFace: showroomConfig.initialFace,
          ...(shouldResetToDay ? { timeOfDay: 'day' } : {})
        });
        
        if (transition) {
             const face0 = buildingFaces[0];
             
             if (transition === 'intro') {
                 // Showroom: Matches Homepage "Entrar" video
                 const introVideoUrl = getAssetUrl('videos/walks/trans_intro_to_0.mp4');
                 
                 useStore.setState({ 
                     viewState: 'TRANSITION_VIDEO',
                     transitionUrl: introVideoUrl,
                     targetDestination: 'Lobby' 
                 });
             } else if (transition === 'floors') {
                 // Plantas: Uses the generic "Central View" walk (Day/Night sensitive)
                 // NOTE: Since we are in the showroom page, 'floors' transition essentially means 
                 // we are PREPARING to go to floors, or we came FROM floors?
                 // Original logic implies we are playing a video related to floors? 
                 // Actually original sidebar logic: navigate('/showroom', { state: { transition: 'floors', targetPath: path } });
                 // This plays the video THEN navigates to the targetPath.
                 
                 const floorsVideoUrl = timeOfDay === 'day' ? face0.day.introVideo : face0.night.introVideo;
                 
                 if (floorsVideoUrl) {
                     useStore.setState({ 
                         viewState: 'TRANSITION_VIDEO',
                         transitionUrl: floorsVideoUrl,
                         targetDestination: 'Floors'
                     });
                 }
             }
        }

        try {
            const face0 = buildingFaces[0];
            const determinedTime = shouldResetToDay ? 'day' : (transition === 'floors' ? timeOfDay : 'day');
            
            const mainAsset = determinedTime === 'day' ? face0.day.background : face0.night.background;
            const secondaryAsset = determinedTime === 'day' ? face0.night.background : face0.day.background;

            await preloadImages([mainAsset]);
            
            preloadImages([secondaryAsset]).catch(() => {});

        } catch (e) { console.warn("Showroom mount preload failed", e); }
        
        useStore.setState({ isLoadingAssets: false });
    };

    initShowroom();
  }, [searchParams]); // Re-run if params change

  // Proximity Loading Logic
  useEffect(() => {
      // Don't preload if we are transitioning or not in lobby
      if (currentRoom !== 'Lobby') return;

      const currentFaceData = buildingFaces[currentFace];
      if (!currentFaceData) return;

      const fastImagesToLoad: string[] = []; 
      const secondaryImagesToLoad: string[] = []; 
      const videosToLoad: string[] = []; 

      // 1. Identify Adjacent Faces
      const adjacentIds = [];
      if (currentFace === 0) adjacentIds.push(1, 2);
      else adjacentIds.push(0);

      adjacentIds.forEach(id => {
          const face = buildingFaces[id];
          const assetSet = timeOfDay === 'day' ? face.day : face.night;
          
          fastImagesToLoad.push(assetSet.background);
          
          if (id === 1 && currentFace === 0) videosToLoad.push(currentFaceData[timeOfDay].transitions.toRight); 
          if (id === 2 && currentFace === 0) videosToLoad.push(currentFaceData[timeOfDay].transitions.toLeft);
          if (currentFace !== 0) videosToLoad.push(currentFaceData[timeOfDay].transitions.toLeft);
      });

      // 2. Identify Alt Time of Day
      if (timeOfDay === 'day') {
          secondaryImagesToLoad.push(currentFaceData.night.background);
      } else {
          secondaryImagesToLoad.push(currentFaceData.day.background);
      }

      // 3. Preload "Ingresar" Walk Video
      if (currentFace === 0) {
          const walkVideo = timeOfDay === 'day' ? currentFaceData.day.introVideo : currentFaceData.night.introVideo;
          if (walkVideo) videosToLoad.push(walkVideo);
      }

      // Execution
      if (fastImagesToLoad.length > 0) {
          preloadImages(fastImagesToLoad).catch(() => console.warn('Fast preload failed'));
      }

      const videoTimer = setTimeout(() => {
          if (videosToLoad.length > 0) {
             videosToLoad.forEach(v => preloadVideo(v).catch(() => {}));
          }
      }, 2000);

      const secondaryTimer = setTimeout(() => {
          if (secondaryImagesToLoad.length > 0) {
              preloadImages(secondaryImagesToLoad).catch(() => {});
          }
      }, 4000);

      return () => {
          clearTimeout(videoTimer);
          clearTimeout(secondaryTimer);
      };

  }, [currentFace, timeOfDay, currentRoom]); 

  const showLeftButton = currentRoom === 'Lobby' && viewState === 'IDLE' && (currentFace === 0 || currentFace === 1);
  const showRightButton = currentRoom === 'Lobby' && viewState === 'IDLE' && (currentFace === 0 || currentFace === 2);

  return (
    <div className="font-sans relative h-full w-full overflow-hidden">
      <SceneController isHighlighted={isHoveringIngresar} />

      <div className="fixed top-6 left-6 z-30 group">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 text-white bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full transition-all hover:scale-105 cursor-pointer shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 backdrop-blur-md text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-secondary tracking-wider uppercase">
          Menú
        </span>
      </div>

      {/* Recorrido General Button */}
      {viewState === 'IDLE' && (
      <button 
        onClick={() => router.push('/recorridos?tourId=building-main')}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-30 px-6 py-2 bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full text-white font-medium text-sm transition-all hover:scale-105 cursor-pointer shadow-lg uppercase tracking-wide flex items-center gap-2"
      >
        <Rotate3d size={18} />
        Recorrido General 
      </button>
      )}

      {/* Right-side Controls Stack */}
      <div className="fixed top-6 right-6 z-30 flex flex-col gap-4 items-end">
        
        {/* Day/Night Toggle */}
        {viewState === 'IDLE' && (
          <div className="relative group">
            <button 
              onClick={toggleTimeOfDay}
              disabled={isLoadingAssets}
              className={`p-3 bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 rounded-full text-white transition-all hover:scale-110 cursor-pointer shadow-lg ${isLoadingAssets ? 'opacity-50 cursor-wait' : ''}`}
            >
              {isLoadingAssets ? <Loader className="w-6 h-6" /> : (timeOfDay === 'day' ? <Moon size={24} /> : <Sun size={24} />)}
            </button>
            <div className="absolute top-1/2 right-full mr-3 -translate-y-1/2 px-3 py-1 bg-black/80 backdrop-blur-sm text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              {timeOfDay === 'day' ? 'Switch to Night' : 'Switch to Day'}
            </div>
          </div>
        )}

        {/* Fullscreen Toggle */}
        <FullScreenToggle />
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Rotation UI */}
      {showLeftButton && (
          <button 
            onClick={() => rotateBuilding('left')}
            disabled={isLoadingAssets}
            className={`fixed top-1/2 left-4 -translate-y-1/2 z-40 p-3 rounded-full bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 text-white transition-all hover:scale-110 cursor-pointer ${isLoadingAssets ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isLoadingAssets ? <Loader className="w-8 h-8" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            )}
          </button>
      )}

      {showRightButton && (
          <button 
            onClick={() => rotateBuilding('right')}
            disabled={isLoadingAssets}
            className={`fixed top-1/2 right-4 -translate-y-1/2 z-40 p-3 rounded-full bg-brand-primary/80 hover:bg-brand-primary backdrop-blur-xl border border-white/20 text-white transition-all hover:scale-110 cursor-pointer ${isLoadingAssets ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isLoadingAssets ? <Loader className="w-8 h-8" /> : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            )}
          </button>
      )}

      {/* Structure Reference Image */}
      {viewState === 'IDLE' && (
        <div className="fixed bottom-6 md:bottom-10 sm:bottom-3 left-6 md:left-10 sm:left-3 z-20 pointer-events-none select-none">
          <img 
            src={showroomConfig.structureImage}
            alt="Structure Reference" 
            className="w-auto h-48 sm:h-32 opacity-90 drop-shadow-lg"
          />
        </div>
      )}

      {/* Floating UI */}
      {viewState === 'IDLE' && (
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
        <button 
          onClick={() => startTransition('Floors')} 
          disabled={isLoadingAssets}
          onMouseEnter={() => setIsHoveringIngresar(true)}
          onMouseLeave={() => setIsHoveringIngresar(false)}
          className={`bg-brand-primary/80 backdrop-blur-xl border border-white/20 text-white px-8 py-3 rounded-full hover:bg-brand-primary transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 ${isLoadingAssets ? 'cursor-wait' : ''}`}
        >
          {isLoadingAssets ? <Loader /> : 'Ingresar'}
        </button>
      </div>
      )}
    </div>
  );
};

export default function ShowroomPage() {
    return (
        <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-black text-white"><Loader /></div>}>
            <ShowroomContent />
        </Suspense>
    )
}
