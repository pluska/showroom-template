import olimpoLocations from "./olimpo_tumbes_locations.json";

export interface LocationFeature {
  type: "Feature";
  properties: {
    nombre: string;
    categoria?: string;
    /** Ruta bajo public/. `null` cuando el ícono aún no llega: el mapa cae al pin. */
    imagen?: string | null;
    /** Slug del ícono en el geojson del cliente, por si hay que recablearlo. */
    icono?: string;
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

// Respaldo que usa el mapa cuando la tabla `locations_poi` aún no está
// sembrada (ver seedLocations en src/app/actions/locations.ts). Es la misma
// lista de POIs de Tumbes, para que /ubicacion nunca salga vacía.
export const locationsData: LocationCollection = {
  features: olimpoLocations.features as unknown as LocationFeature[],
};
