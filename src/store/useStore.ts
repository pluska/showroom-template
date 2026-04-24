import { create } from 'zustand';
import { buildingFaces } from '../data/buildingData';
import { preloadVideo, preloadImages } from '../utils/preload';
import { floorsData } from '../data/floors';

interface ShowroomState {
  currentFloor: number | null;
  currentRoom: string;
  viewState: string; // 'IDLE' | 'TRANSITION_VIDEO' | 'TRANSITION_ROTATION' | 'TRANSITION_TIMELAPSE'
  isLoading: boolean;
  currentFace: number;
  nextFace: number | null;
  transitionUrl: string | null;
  targetDestination: string | null; // e.g. 'Lobby', 'Floors'
  timeOfDay: 'day' | 'night';
  
  // Actions
  setFloor: (floor: number | string) => Promise<void>;
  preloadAllFloors: () => Promise<void>;
  startTransition: (destination: string) => void;
  endTransition: (newRoom: string) => void;
  rotateBuilding: (direction: 'left' | 'right') => Promise<void>;
  confirmRotation: () => void;
  finishRotation: () => void;
  toggleTimeOfDay: () => Promise<void>;
  finishTimeLapse: () => void;
  
  // Loading State
  isLoadingAssets: boolean;
  setLoading: (loading: boolean) => void;

  // Global Loader
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
  
  // Brochure
  isBrochureOpen: boolean;
  toggleBrochure: (isOpen?: boolean) => void;

  // Landscape Mode
  isForcedLandscape: boolean;
  setForcedLandscape: (forced: boolean) => void;
}

export const useStore = create<ShowroomState>((set, get) => ({
  currentFloor: 1,
  currentRoom: 'Lobby',
  viewState: 'IDLE',
  isLoading: true,
  currentFace: 0,
  nextFace: null,
  transitionUrl: null,
  targetDestination: null,
  timeOfDay: 'day',
  isLoadingAssets: false,
  isGlobalLoading: false,
  isBrochureOpen: false,
  
  setLoading: (loading) => set({ isLoadingAssets: loading }),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
  toggleBrochure: (isOpen) => set((state) => ({ 
      isBrochureOpen: isOpen !== undefined ? isOpen : !state.isBrochureOpen 
  })),

  // Landscape Mode
  isForcedLandscape: false,
  setForcedLandscape: (forced) => set({ isForcedLandscape: forced }),

  setFloor: async (floorId) => {
    // 1. Find the floor to get the image
    const floor = floorsData.find(f => f.id === String(floorId));
    
    if (floor) {
        set({ isLoadingAssets: true });
        try {
            await preloadImages([floor.floorPlanImage]);
        } catch(e) { console.warn("Floor preload failed", e); }
        set({ isLoadingAssets: false });
    }

    set({ currentFloor: Number(floorId) });
  },

  preloadAllFloors: async () => {
    const allFloorImages = floorsData.map(f => f.floorPlanImage);
    try {
        // Preload efficiently in background
        await preloadImages(allFloorImages);
    } catch (e) {
        console.warn("Batch floor preload failed", e);
    }
  },
  
  startTransition: (destination) => {
    const state = get();
    const face = buildingFaces[state.currentFace];
    const assetSet = face[state.timeOfDay];
    // Use the introWalk video for the current face/time as the transition to inside
    const videoUrl = assetSet.introVideo;

    set({ 
      viewState: 'TRANSITION_VIDEO',
      targetDestination: destination,
      transitionUrl: videoUrl
    });
  },
  
  endTransition: (newRoom) => set({ 
    viewState: 'IDLE',
    currentRoom: newRoom,
    targetDestination: null
  }),

  rotateBuilding: async (direction) => {
    const state = get();
    const totalFaces = buildingFaces.length;
    if (totalFaces <= 1) return;

    let nextFaceIndex: number;
    let videoUrl: string = '';

    const currentFaceData = buildingFaces[state.currentFace];
    // Access transitions based on current time of day
    const timeOfDayData = currentFaceData[state.timeOfDay];

    if (direction === 'right') {
      nextFaceIndex = (state.currentFace + 1) % totalFaces;
      videoUrl = timeOfDayData.transitions.toRight;
    } else {
      nextFaceIndex = (state.currentFace - 1 + totalFaces) % totalFaces;
      videoUrl = timeOfDayData.transitions.toLeft;
    }
    
    console.log('[Store] rotateBuilding', {
        direction,
        currentFace: state.currentFace,
        nextFaceIndex,
        videoUrl
    });

    // If no video URL is defined, just snap
    if (!videoUrl) {
      set({ currentFace: nextFaceIndex });
      return;
    }

    // Preload Logic
    set({ isLoadingAssets: true });
    
    // Determine the next background image to preload
    const nextFaceData = buildingFaces[nextFaceIndex];
    const nextTimeData = nextFaceData[state.timeOfDay]; // 'day' or 'night'
    const nextBackgroundUrl = nextTimeData.background;

    try {
        // OPTIMIZATION:
        // We only STRICTLY need the video to start the transition.
        // The background image is needed ONLY when the video ends.
        
        // 1. Race: Video Load vs Timeout (1.5s)
        // If the video is already cached, preloadVideo resolves instantly.
        // If it takes too long (network lag), we skip the video to preserve flow.
        let videoReady = false;
        try {
            await Promise.race([
                preloadVideo(videoUrl).then(() => { videoReady = true; }),
                new Promise(resolve => setTimeout(resolve, 1500))
            ]);
        } catch(e) {}
        
        if (!videoReady) {
             console.warn("Transition video slow/not ready - Skipping for instant feedback");
             // Just snap to the next face immediately
             set({ currentFace: nextFaceIndex, isLoadingAssets: false });
             return;
        }
        
        // 2. Start preloading the image in the background (fire and forget)
        // We don't await this because the video duration usually covers the download time.
        // Even if it doesn't, the browser will render it as it arrives.
        preloadImages([nextBackgroundUrl]).catch((e) => console.warn('Background image preload failed', e));

    } catch (e) {
        console.warn('Failed to preload rotation video', e);
        // If video fails, we might just snap? For now we proceed to try.
    }
    
    set({ 
      isLoadingAssets: false,
      nextFace: nextFaceIndex, 
      transitionUrl: videoUrl,
      viewState: 'TRANSITION_ROTATION' 
    });
  },

  confirmRotation: () => set((state) => {
    console.log('[Store] confirmRotation', {
        nextFace: state.nextFace,
        currentFace: state.currentFace,
        resolvedFace: state.nextFace !== null ? state.nextFace : state.currentFace
    });
    return { 
        currentFace: state.nextFace !== null ? state.nextFace : state.currentFace,
        nextFace: null 
    };
  }),

  finishRotation: () => set({ 
    viewState: 'IDLE', 
    transitionUrl: null 
  }),

  toggleTimeOfDay: async () => {
    const state = get();
    const currentFaceData = buildingFaces[state.currentFace];
    const isDay = state.timeOfDay === 'day';
    const videoUrl = isDay ? currentFaceData.dayToNightTransition : currentFaceData.nightToDayTransition;
    
    if (videoUrl) {
        set({ isLoadingAssets: true });
        try {
            await preloadVideo(videoUrl);
        } catch (e) { console.warn('Failed to preload timelapse', e); }
        set({ isLoadingAssets: false });
    }

    set({ 
      viewState: 'TRANSITION_TIMELAPSE',
      transitionUrl: videoUrl
    });
  },

  finishTimeLapse: () => set((state) => ({ 
    timeOfDay: state.timeOfDay === 'day' ? 'night' : 'day',
    viewState: 'IDLE',
    transitionUrl: null
  })),
}));
