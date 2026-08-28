// ============================================================================
// Perímetro del terreno del proyecto, tal como lo entregó el cliente (feature
// "Olimpo" del geojson de ubicaciones). Es un anillo cerrado: el último punto
// repite al primero, así que sirve tanto de LineString como de Polygon.
//
// Se guarda aparte de `olimpo_tumbes_locations.json` porque aquel archivo es
// la lista de POIs que se siembra en la tabla `locations_poi` — puntos con
// nombre, categoría e ícono. Esto no es un POI: es geometría del proyecto y la
// dibuja el mapa como capa, no como marcador.
// ============================================================================

/** [longitud, latitud] de cada vértice del terreno. */
export const projectOutlineCoordinates: [number, number][] = [
  [-80.414301, -3.565197],
  [-80.413282, -3.565461],
  [-80.412989, -3.565715],
  [-80.412611, -3.565396],
  [-80.412132, -3.56525],
  [-80.411809, -3.565844],
  [-80.411066, -3.567613],
  [-80.412059, -3.568355],
  [-80.412497, -3.568819],
  [-80.412864, -3.568441],
  [-80.413164, -3.567911],
  [-80.413828, -3.567346],
  [-80.41412, -3.567135],
  [-80.414475, -3.567038],
  [-80.415, -3.566829],
  [-80.415115, -3.5663],
  [-80.414803, -3.565593],
  [-80.414299, -3.565195],
];

/** El terreno como Polygon, para pintar el relleno. */
export const projectOutlinePolygon = {
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "Polygon" as const,
    coordinates: [projectOutlineCoordinates],
  },
};
