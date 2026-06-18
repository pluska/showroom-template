import { create } from 'zustand';
import { buildingFaces, type BuildingFace } from '../data/buildingData';
import { preloadVideo, preloadImages } from '../utils/preload';
import { type Floor } from '../data/floors';
import { getAssetUrl } from '../utils/assets';

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
  
  // Building Faces Data
  buildingFacesData: BuildingFace[];
  setBuildingFacesData: (faces: BuildingFace[]) => void;
  
  // Floors Inventory Data
  floorsData: Floor[];
  setFloorsData: (floors: Floor[]) => void;
  
  // Actions
  setFloor: (floor: number | string) => Promise<void>;
  preloadAllFloors: () => Promise<void>;
  startTransition: (destination: string) => Promise<void>;
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
  floorsData: [],
  buildingFacesData: buildingFaces, // fallback fallback default
  
  setBuildingFacesData: (faces) => set({ buildingFacesData: faces }),
  setFloorsData: (floors) => set({ floorsData: floors }),
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
    const floor = get().floorsData.find(f => f.id === String(floorId));
    
    if (floor) {
        set({ isLoadingAssets: true });
        try {
            await preloadImages([getAssetUrl(floor.floorPlanImage)]);
        } catch(e) { console.warn("Floor preload failed", e); }
        set({ isLoadingAssets: false });
    }

    set({ currentFloor: Number(floorId) });
  },

  preloadAllFloors: async () => {
    const allFloorImages = get().floorsData.map(f => getAssetUrl(f.floorPlanImage));
    try {
        // Preload efficiently in background
        await preloadImages(allFloorImages);
    } catch (e) {
        console.warn("Batch floor preload failed", e);
    }
  },
  
  startTransition: async (destination) => {
    const state = get();
    const face = state.buildingFacesData[state.currentFace] || state.buildingFacesData[0];
    if (!face) return;
    const assetSet = face[state.timeOfDay];
    // Use the introWalk video for the current face/time as the transition to inside
    const videoUrl = assetSet.introVideo;

    let targetImage: string | undefined;
    if (destination === 'Floors') {
      const targetFloor = state.floorsData.find(f => f.id === '9');
      if (targetFloor) {
        targetImage = getAssetUrl(targetFloor.floorPlanImage);
      }
    }

    if (videoUrl) {
      set({ isLoadingAssets: true });
      try {
        const promises: Promise<void | HTMLImageElement>[] = [preloadVideo(videoUrl)];
        if (targetImage) {
          promises.push(preloadImages([targetImage]));
        }
        await Promise.all(promises);
      } catch (e) { console.warn('Failed to preload transition video and image', e); }
      set({ isLoadingAssets: false });
    }

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
    const totalFaces = state.buildingFacesData.length;
    if (totalFaces <= 1) return;

    let nextFaceIndex: number;
    let videoUrl: string = '';

    const currentFaceData = state.buildingFacesData[state.currentFace] || state.buildingFacesData[0];
    if (!currentFaceData) return;
    
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

    const nextFaceData = state.buildingFacesData[nextFaceIndex];
    const nextBackgroundUrl = nextFaceData ? nextFaceData[state.timeOfDay]?.background : undefined;

    // Preload Logic (Blocking, like Unit details page)
    set({ isLoadingAssets: true });
    try {
      const promises: Promise<void | HTMLImageElement>[] = [preloadVideo(videoUrl)];
      if (nextBackgroundUrl) {
        promises.push(preloadImages([nextBackgroundUrl]));
      }
      await Promise.all(promises);
    } catch (e) {
      console.warn('Failed to preload rotation video and image', e);
    }
    set({ isLoadingAssets: false });
    
    set({ 
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
    const currentFaceData = state.buildingFacesData[state.currentFace] || state.buildingFacesData[0];
    if (!currentFaceData) return;
    const isDay = state.timeOfDay === 'day';
    const videoUrl = isDay ? currentFaceData.dayToNightTransition : currentFaceData.nightToDayTransition;
    const targetBackground = isDay ? currentFaceData.night?.background : currentFaceData.day?.background;
    const nextTimeOfDay = isDay ? 'night' : 'day';

    if (videoUrl) {
        set({ isLoadingAssets: true });
        try {
            const promises: Promise<void | HTMLImageElement>[] = [preloadVideo(videoUrl)];
            if (targetBackground) {
                promises.push(preloadImages([targetBackground]));
            }
            await Promise.all(promises);
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

