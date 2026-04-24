/**
 * Topographic Data
 * This file will contain the coordinates and data for the topographic view feature.
 */

export interface TopoPoint {
  id: string;
  name: string;
  elevation: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  description?: string;
}

export const topographicData: TopoPoint[] = [
  // Future topographic data points will be added here
];
