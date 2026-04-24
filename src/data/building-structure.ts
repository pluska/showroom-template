// Define the structure of building levels
export interface BuildingLevel {
    id: string;   // "4", "PH", "PB"
    label: string; // "4", "PH", "PB"
    type: 'residential' | 'amenity' | 'service';
    status?: 'available' | 'sold_out' | 'coming_soon';
}

// Generate floors 1-43 + PH
export const buildingLevels: BuildingLevel[] = [
    { id: "PH", label: "PH", type: 'residential' },
    ...Array.from({ length: 43 }, (_, i) => ({
        id: (43 - i).toString(),
        label: (43 - i).toString(),
        type: 'residential' as const
    })),
    { id: "PB", label: "PB", type: 'amenity' }
];
