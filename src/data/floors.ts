// ============================================================================
// HISTORICAL STATIC DATA — DO NOT USE IN PRODUCTION
// This file is kept as a reference. The source of truth is the D1 database.
// See: src/lib/db/schema.ts and seed.sql for the database schema and seed data.
// ============================================================================

export type UnitStatus = 'available' | 'reserved' | 'sold';

export const UnitStatusString: Record<UnitStatus, string> = {
    available: 'Disponible',
    reserved: 'Separado',
    sold: 'Vendido'
}

export interface Unit {
  id: string;        // e.g. "410"
  identifier?: string; // e.g. "410"
  floorId: string;   // e.g. "4"
  price: number;     // e.g. 1000
  dimensions: number; // m2, e.g. 90
  bedrooms?: number;  // Optional for storage units
  bathrooms?: number; // Optional for storage units
  status: UnitStatus;
  type?: 'apartment' | 'storage'; // To distinguish unit types
  subtitle?: string; // e.g. "Flat", "Duplex", "Bodega"
  description?: string;
  images?: string[];
  tourUrl?: string; // Kuula or other 360 tour URL
  assetId?: string; // Folder name for assets if different from ID (e.g. 'x01')
  x?: number; // Percentage 0-100
  y?: number; // Percentage 0-100
  path?: string; // SVG Path 'd' attribute for irregular shapes (0-100 coordinate space)
  photosFurnished?: string[];
  photosUnfurnished?: string[];
  photosPlans?: string[];
  photosBalcony?: string[];
  gallery?: string[];
}

import { getAssetUrl } from '../utils/assets';

const floor1 = getAssetUrl('plants/floor_1.png');
const floor2 = getAssetUrl('plants/floor_2.png');
const floor3 = getAssetUrl('plants/floor_3.png');
const floor4 = getAssetUrl('plants/floor_4.png');
const floor5 = getAssetUrl('plants/floor_5.png');
const floor6 = getAssetUrl('plants/floor_6.png');
const floor7 = getAssetUrl('plants/floor_7.png');
const floorDuplex1 = getAssetUrl('plants/floor_duplex_1.png');
const floorDuplex2 = getAssetUrl('plants/floor_duplex_2.png');
const floorPB = getAssetUrl('plants/floor_pb.png');

export interface Floor {
  id: string; 
  name: string; 
  floorPlanImage: string;
  units: Unit[];
}

// Sample Data
export const floorsData: Floor[] = [
  {
    id: "pb",
    name: "PB",
    floorPlanImage: floorPB,
    units: [
      
      { id: "PB 7", floorId: "pb", price: 0, dimensions: 3.31, status: 'available', type: 'storage', subtitle: 'Bodega', path: "M 67.1,32.2 L 62.7,32.2 L 62.7,42.2 L 67.1,42.4 Z" },
      { id: "PB 6", floorId: "pb", price: 0, dimensions: 3.36, status: 'available', type: 'storage', subtitle: 'Bodega', path: "M 62.6,42.9 L 67.2,43 L 67.3,53.2 L 62.8,53.1 Z" },
      { id: "PB 5", floorId: "pb", price: 0, dimensions: 3.36, status: 'available', type: 'storage', subtitle: 'Bodega', path: "M 67.3,63.8 L 67.2,53.6 L 62.7,53.6 L 62.7,64.3 Z" },
      { id: "PB 4", floorId: "pb", price: 0, dimensions: 5.55, status: 'sold', type: 'storage', subtitle: 'Bodega', path: "M 57.7,64.2 L 67.1,64.6 L 67.3,72.7 L 57.6,72.5 Z" },
      { id: "PB 3", floorId: "pb", price: 0, dimensions: 4.01, status: 'available', type: 'storage', subtitle: 'Bodega', path: "M 52.9,60 L 57.4,60 L 57.5,72.5 L 52.9,72.7 Z" },
      { id: "PB 2", floorId: "pb", price: 0, dimensions: 3.23, status: 'sold', type: 'storage', subtitle: 'Bodega', path: "M 57.5,49.9 L 52.6,50.3 L 52.8,59.4 L 57.5,59.5 Z" },
      { id: "PB 1", floorId: "pb", price: 0, dimensions: 3.31, status: 'sold', type: 'storage', subtitle: 'Bodega', path: "M 57.4,40 L 52.6,40.1 L 52.6,49.6 L 57.5,49.5 Z" },
    ]
  },
  {
    id: "1",
    name: "1",
    floorPlanImage: floor1,
    units: [
      { 
        id: "101", 
        floorId: "1", 
        price: 1000, 
        dimensions: 52.9, 
        bedrooms: 2, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        x: 30, 
        y: 40, 
        path: "M 62,39.5 L 30.6,39.1 L 31,61 L 62.4,61.2 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9d?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
    ]
  },
  {
    id: "2",
    name: "2",
    floorPlanImage: floor2,
    units: [
      { 
        id: "201", 
        floorId: "2", 
        price: 1100, 
        dimensions: 64.34, 
        bedrooms: 3, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        assetId: 'x01',
        x: 25, 
        y: 35, 
        path: "M 69.1,22.9 L 52.5,22.7 L 52.6,73.4 L 69,75 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9H?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
      { 
        id: "202", 
        floorId: "2", 
        price: 1300, 
        dimensions: 56.66, 
        bedrooms: 2, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        assetId: 'x02',
        x: 55, 
        y: 55, 
        path: "M 31.2,39.9 L 52.3,39 L 52.2,73.9 L 30.2,73.5 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9D?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
    ]
  },
  {
    id: "3",
    name: "3",
    floorPlanImage: floor3,
    units: [
      { 
        id: "301", 
        floorId: "3", 
        price: 1050, 
        dimensions: 64.34, 
        bedrooms: 3, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        assetId: 'x01',
        path: "M 69.1,22.9 L 52.5,22.7 L 52.6,73.4 L 69,75 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9b?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
      { 
        id: "302", 
        floorId: "3", 
        price: 1250, 
        dimensions: 56.66, 
        bedrooms: 2, 
        bathrooms: 2, 
        status: 'available', 
        subtitle: 'Flat', 
        assetId: 'x02',
        path: "M 31.2,39.9 L 52.3,39 L 52.2,73.9 L 30.2,73.5 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9Z?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      }
    ]
  },
  {
    id: "4",
    name: "4",
    floorPlanImage: floor4,
    units: [
      { 
        id: "401", 
        floorId: "4", 
        price: 1150, 
        dimensions: 64.34, 
        bedrooms: 3, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        assetId: 'x01',
        path: "M 69.1,22.9 L 52.5,22.7 L 52.6,73.4 L 69,75 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9K?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
      { 
        id: "402", 
        floorId: "4", 
        price: 1350, 
        dimensions: 56.66, 
        bedrooms: 2, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        assetId: 'x02',
        path: "M 31.2,39.9 L 52.3,39 L 52.2,73.9 L 30.2,73.5 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9c?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
    ]
  },
  {
    id: "5",
    name: "5",
    floorPlanImage: floor5,
    units: [
      { 
        id: "501", 
        floorId: "5", 
        price: 1200, 
        dimensions: 64.34, 
        bedrooms: 3, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        assetId: 'x01',
        path: "M 69.1,22.9 L 52.5,22.7 L 52.6,73.4 L 69,75 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9X?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
      { 
        id: "502", 
        floorId: "5", 
        price: 1400, 
        dimensions: 56.66, 
        bedrooms: 2, 
        bathrooms: 2, 
        status: 'available', 
        subtitle: 'Flat', 
        assetId: 'x02',
        path: "M 31.2,39.9 L 52.3,39 L 52.2,73.9 L 30.2,73.5 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9J?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
    ]
  },
  {
    id: "6",
    name: "6",
    floorPlanImage: floor6,
    units: [
      { 
        id: "601", 
        floorId: "6", 
        price: 1250, 
        dimensions: 64.34, 
        bedrooms: 3, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        assetId: 'x01',
        path: "M 69.1,22.9 L 52.5,22.7 L 52.6,73.4 L 69,75 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9v?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
      { 
        id: "602", 
        floorId: "6", 
        price: 1450, 
        dimensions: 56.66, 
        bedrooms: 2, 
        bathrooms: 2, 
        status: 'available', 
        subtitle: 'Flat', 
        assetId: 'x02',
        path: "M 31.2,39.9 L 52.3,39 L 52.2,73.9 L 30.2,73.5 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9q?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
    ]
  },
  {
    id: "7",
    name: "7",
    floorPlanImage: floor7,
    units: [
      { 
        id: "701", 
        floorId: "7", 
        price: 1300, 
        dimensions: 64.34, 
        bedrooms: 3, 
        bathrooms: 2, 
        status: 'sold', 
        subtitle: 'Flat', 
        assetId: 'x01',
        path: "M 69.1,22.9 L 52.5,22.7 L 52.6,73.4 L 69,75 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9k?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
      { 
        id: "702", 
        floorId: "7", 
        price: 1500, 
        dimensions: 56.66, 
        bedrooms: 2, 
        bathrooms: 2, 
        status: 'available', 
        subtitle: 'Flat', 
        assetId: 'x02',
        path: "M 31.2,39.9 L 52.3,39 L 52.2,73.9 L 30.2,73.5 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9Y?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      }
    ]
  },
  {
    id: "8",
    name: "8",
    floorPlanImage: floorDuplex1,
    units: [
      { 
        id: "801", 
        floorId: "8", 
        price: 1350, 
        dimensions: 134.5, 
        bedrooms: 3, 
        bathrooms: 2.5, 
        status: 'sold',
        subtitle: 'Duplex',
        assetId: '801',
        tourUrl: "https://kuula.co/share/collection/7HQ9P?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es",
        path: "M 52.5,22.1 L 52.6,74.3 L 68,74.1 L 67.6,66.9 L 69.2,67.1 L 69,22.6 Z"
      },
      { 
        id: "802", 
        floorId: "8", 
        price: 1350, 
        dimensions: 56.66, 
        bedrooms: 2, 
        bathrooms: 2, 
        status: 'available',
        subtitle: 'Flat',
        assetId: 'x02',
        path: "M 31.2,39.9 L 52.3,39 L 52.2,73.9 L 30.2,73.5 Z",
        tourUrl: "https://kuula.co/share/collection/7HQ9G?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es"
      },
    ]
  },
  {
    id: "9",
    name: "9",
    floorPlanImage: floorDuplex2,
    units: [
      { 
        id: "801", 
        floorId: "9", 
        price: 1400, 
        dimensions: 110, 
        bedrooms: 1, 
        bathrooms: 2, 
        status: 'sold',
        subtitle: 'Duplex',
        assetId: '901',
        // tourUrl: "https://kuula.co/share/collection/7HjBW?logo=0&info=0&fs=1&vr=1&sd=1&initload=0&thumbs=1", // Link roto
        tourUrl: "https://kuula.co/share/collection/7HQ9P?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es",
        path: "M 52.7,22.8 L 52.4,43.8 L 48,44 L 47.9,58.6 L 52.4,58.6 L 52.5,73.9 L 69,73.6 L 68.9,22.6 Z" 
      },
      { 
        id: "Terraza", 
        floorId: "9", 
        price: 0, 
        dimensions: 0, 
        bedrooms: 0, 
        bathrooms: 0, 
        status: 'available',
        subtitle: 'Terraza',
        assetId: '902',
        tourUrl: "https://kuula.co/share/collection/7HQ90?logo=1&card=1&info=0&logosize=175&fs=1&vr=1&zoom=1&initload=0&thumbs=3&alpha=0.91&inst=es",
        path: "M 31.1,40.2 L 31,73.9 L 52.3,74.1 L 52.1,59.5 L 47.6,59.2 L 47.6,44.1 L 52.2,43.8 L 52.3,39.1 Z" 
      },
    ]
  }
];
