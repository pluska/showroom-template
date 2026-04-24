export interface Tour {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: string;
  type: 'unit' | 'building';
  target: string;
  floorName?: string;
}

// Example Building Tour Target
const buildingTarget= 'https://kuula.co/share/collection/7HQY1?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es';

// This file is a template. In the actual application, this might import 'floorsData' 
// to dynamically generate tours from units, as seen in the source project.

export const tours: Tour[] = [
  {
    id: 'building-main',
    title: 'Edificio Principal',
    subtitle: 'Showroom Virtual',
    thumbnail: '/plants/details/face_0_daylight.png', // Placeholder adjusted to root relative
    type: 'building',
    target: buildingTarget
  }
];

export const getTours = () => tours;
