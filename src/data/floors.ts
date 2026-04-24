export type UnitStatus = 'available' | 'reserved' | 'sold';

export const UnitStatusString: Record<UnitStatus, string> = {
    available: 'Disponible',
    reserved: 'Separado',
    sold: 'Vendido'
}

export interface Unit {
  id: string;        // e.g. "410"
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
}

export interface Floor {
  id: string; 
  name: string; 
  floorPlanImage: string;
  units: Unit[];
}

// NOTE: In the template, we export empty or sample data.
// In a real implementation, you might import specific asset helpers or just use string paths.

export const floorsData: Floor[] = [
  {
    id: "1",
    name: "1",
    floorPlanImage: "/plants/floor_1.png",
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
      }
    ]
  }
];
