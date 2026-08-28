// ============================================================================
// PRODUCTOS DE LA ZONA — casas y amenidades
// ----------------------------------------------------------------------------
// Las casas y las amenidades cuelgan de un `ZoneElement` (la manzana), igual
// que los departamentos cuelgan de un piso de torre. Las listas están vacías
// a propósito: son el molde que se llenará con el inventario del cliente y
// que después se migrará a las tablas `houses` / `amenities` (ver
// `docs/03-SCHEMA-DB.md`).
//
// Ejemplo de casa, para referencia al llenar:
//
//   {
//     id: 'f1-z1-mzA-lt01',
//     zoneId: ZoneId.ZONE_1,
//     elementId: 'f1-z1-casas-1',
//     code: 'Mz. A Lt. 01',
//     typology: 'Casa 2 pisos',
//     status: UnitStatus.AVAILABLE,
//     bedrooms: 3,
//     bathrooms: 2.5,
//     builtAreaSqm: 120,
//     lotAreaSqm: 160,
//     hotspot: { viewId: 'zone-1:0-0', x: 42.1, y: 63.8, path: 'M …' },
//   }
// ============================================================================

import type { Amenity, House } from './types';

export const houses: House[] = [];

export const amenities: Amenity[] = [];
