export interface LocationFeature {
  type: "Feature";
  properties: {
    nombre: string;
    categoria?: string;
    imagen?: string;
    [key: string]: any;
  };
  geometry: {
    coordinates: [number, number];
    type: "Point";
  };
  id: string;
}

export interface LocationCollection {
  features: LocationFeature[];
}

export const locationsData: LocationCollection = {
  features: [
    {
      type: "Feature",
      properties: {
        nombre: "Interbank",
        categoria: "Finanzas",
        imagen: "icons/FINANZAS/interbank.png"
      },
      geometry: {
        coordinates: [
          -77.064667,
          -12.077828
        ],
        type: "Point"
      },
      id: "0d6dd416b022ec425411c6e6440e3dfd"
    },
    // Add more features as needed or load from external JSON in real app
  ]
};
