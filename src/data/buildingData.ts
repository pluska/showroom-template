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
    name: 'Cara Central',
    dayToNightTransition: getAssetUrl('building/transitions/trans_0_day_to_night.mp4'),
    nightToDayTransition: getAssetUrl('building/transitions/trans_0_night_to_day.mp4'),
    day: {
      background: getAssetUrl('building/photos/face_0_daylight.png'),
      backgroundVideo: getAssetUrl('building/videos/face_0_daylight.mp4'),
      introVideo: getAssetUrl('videos/walks/walk_center_daylight.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/trans_0_to_2_daylight.mp4'),
        toRight: getAssetUrl('building/transitions/trans_0_to_1_daylight.mp4')
      }
    },
    night: {
      background: getAssetUrl('building/photos/face_0_nightlight.png'),
      backgroundVideo: getAssetUrl('building/videos/face_0_nightlight.mp4'),
      introVideo: getAssetUrl('videos/walks/walk_center_nightlight.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/trans_0_to_2_nightlight.mp4'),
        toRight: getAssetUrl('building/transitions/trans_0_to_1_nightlight.mp4')
      }
    }
  },
  {
    id: 1,
    name: 'Cara Derecha',
    dayToNightTransition: getAssetUrl('building/transitions/trans_1_day_to_night.mp4'),
    nightToDayTransition: getAssetUrl('building/transitions/trans_1_night_to_day.mp4'),
    day: {
      background: getAssetUrl('building/photos/face_1_daylight.png'),
      introVideo: getAssetUrl('videos/walks/walk_right_daylight.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/trans_1_to_0_daylight.mp4'),
        toRight: getAssetUrl('building/transitions/trans_1_to_0_daylight.mp4')
      }
    },
    night: {
      background: getAssetUrl('building/photos/face_1_nightlight.png'),
      introVideo: getAssetUrl('videos/walks/walk_right_nightlight.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/trans_1_to_0_nightlight.mp4'),
        toRight: getAssetUrl('building/transitions/trans_1_to_0_nightlight.mp4')
      }
    }
  },
  {
    id: 2,
    name: 'Cara Izquierda',
    dayToNightTransition: getAssetUrl('building/transitions/trans_2_day_to_night.mp4'),
    nightToDayTransition: getAssetUrl('building/transitions/trans_2_night_to_day.mp4'),
    day: {
      background: getAssetUrl('building/photos/face_2_daylight.png'),
      introVideo: getAssetUrl('videos/walks/walk_left_daylight.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/trans_2_to_0_daylight.mp4'),
        toRight: getAssetUrl('building/transitions/trans_2_to_0_daylight.mp4')
      }
    },
    night: {
      background: getAssetUrl('building/photos/face_2_nightlight.png'),
      introVideo: getAssetUrl('videos/walks/walk_left_nightlight.mp4'),
      transitions: {
        toLeft: getAssetUrl('building/transitions/trans_2_to_0_nightlight.mp4'),
        toRight: getAssetUrl('building/transitions/trans_2_to_0_nightlight.mp4')
      }
    }
  },
];
