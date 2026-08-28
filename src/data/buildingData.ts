// ============================================================================
// HISTORICAL STATIC DATA — DO NOT USE IN PRODUCTION
// This file is kept as a reference. The source of truth is the D1 database.
// See: src/lib/db/schema.ts and seed.sql for the database schema and seed data.
// ============================================================================

interface AssetSet {
  background: string;
  backgroundVideo?: string;
  highlight?: string;
  introVideo?: string; // Moved here to start allowing day/night specific walks
  transitions: {
    toLeft: string;
    toRight: string;
  };
}

export interface BuildingFace {
  id: number;
  name: string;
  dayToNightTransition: string;
  nightToDayTransition: string;
  day: AssetSet;
  night: AssetSet;
}


import { getAssetUrl } from '../utils/assets';

export const buildingFaces: BuildingFace[] = [
  {
    id: 0,
    name: 'Cara Inicial',
    dayToNightTransition: '',
    nightToDayTransition: '',
    day: {
      background: getAssetUrl('building/photos/0.1.webp'),
      backgroundVideo: getAssetUrl('building/videos/0.1.mp4'),
      introVideo: getAssetUrl('building/transitions/0.1_a_1.1.mp4'),
      transitions: {
        toLeft: '',
        toRight: ''
      }
    },
    night: {
      background: getAssetUrl('building/photos/0.1.webp'),
      backgroundVideo: getAssetUrl('building/videos/0.1.mp4'),
      introVideo: getAssetUrl('building/transitions/0.1_a_1.1.mp4'),
      transitions: {
        toLeft: '',
        toRight: ''
      }
    }
  },
  {
    id: 1,
    name: 'Cara Izquierda',
    dayToNightTransition: getAssetUrl('building/transitions/2.1_a_2.2.mp4'),
    nightToDayTransition: getAssetUrl('building/transitions/2.2_a_2.1.mp4'),
    day: {
      background: getAssetUrl('building/photos/2.1.webp'),
      introVideo: getAssetUrl('building/transitions/2.1_a_PISO_6.mp4'),
      transitions: {
        toLeft: '',
        toRight: getAssetUrl('building/transitions/2.1_a_1.1.mp4')
      }
    },
    night: {
      background: getAssetUrl('building/photos/2.2.2.webp'),
      introVideo: getAssetUrl('building/transitions/2.2_a_PISO_6.mp4'),
      transitions: {
        toLeft: '',
        toRight: getAssetUrl('building/transitions/2.2_a_1.2.mp4')
      }
    }
  },
  {
    id: 2,
    name: 'Cara Central',
    dayToNightTransition: getAssetUrl('building/transitions/1.1_a_1.2.mp4'),
    nightToDayTransition: getAssetUrl('building/transitions/1.2_a_1.1.mp4'),
    day: {
      background: getAssetUrl('building/photos/1.1.webp'),
      introVideo: getAssetUrl('building/transitions/1.1_a_PISO_6.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/1.1_a_2.1.mp4'),
        toRight: getAssetUrl('building/transitions/1.1_a_3.1.mp4')
      }
    },
    night: {
      background: getAssetUrl('building/photos/1.2.webp'),
      introVideo: getAssetUrl('building/transitions/1.2_a_PISO_6.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/1.2_A_2.2.mp4'),
        toRight: getAssetUrl('building/transitions/1.2_a_3.2.mp4')
      }
    }
  },
  {
    id: 3,
    name: 'Cara Derecha',
    dayToNightTransition: getAssetUrl('building/transitions/3.1_a_3.2.mp4'),
    nightToDayTransition: getAssetUrl('building/transitions/3.2_a_3.1.mp4'),
    day: {
      background: getAssetUrl('building/photos/3.1.webp'),
      introVideo: getAssetUrl('building/transitions/3.1_a_PISO_6.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/3.1_a_1.1.mp4'),
        toRight: ''
      }
    },
    night: {
      background: getAssetUrl('building/photos/3.2.webp'),
      introVideo: getAssetUrl('building/transitions/3.2_a_PISO_6.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/3.2_a_1.2.mp4'),
        toRight: ''
      }
    }
  }
];
