// ============================================================================
// ENUMS DEL DOMINIO — Urbanización El Olimpo de Tumbes
// ----------------------------------------------------------------------------
// REGLA CENTRAL DEL ARCHIVO:
//   La CLAVE del enum es el identificador estable (nunca cambia, es lo que
//   viaja a la base de datos, a las URLs y a las analíticas).
//   El TEXTO que ve el usuario vive SIEMPRE en los catálogos `*Label` de abajo.
//
//   Ejemplo: hoy los lados se llaman "Lado 1"…"Lado 4"; si mañana pasan a
//   "Lado Norte" / "Noroeste", se edita SOLO `SideLabel`. Ni el enum, ni las
//   filas de la BD, ni las rutas, ni los assets se tocan.
//
//   Por lo mismo, ningún código debe asumir la CANTIDAD de lados, fases, zonas
//   o torres: siempre se recorre el orden declarado en los archivos de datos.
// ============================================================================

/** Fases del proyecto. Hoy solo la Fase 1 es navegable. */
export enum PhaseId {
  PHASE_1 = 'phase-1',
  PHASE_2 = 'phase-2',
  PHASE_3 = 'phase-3',
  PHASE_4 = 'phase-4',
}

/** Estado comercial/de publicación de una fase o zona. */
export enum PhaseStatus {
  /** Navegable: se puede entrar y ver su contenido. */
  AVAILABLE = 'available',
  /** Se muestra difuminada con el rótulo "Próximamente"; no es clicable. */
  COMING_SOON = 'coming_soon',
}

/** Zonas dentro de una fase. Hoy solo se trabaja la Zona 1 de la Fase 1. */
export enum ZoneId {
  ZONE_1 = 'zone-1',
  ZONE_2 = 'zone-2',
  ZONE_3 = 'zone-3',
  ZONE_4 = 'zone-4',
}

/**
 * Lados (antes "Caras") desde los que se observa la urbanización.
 * Son 4 y el giro es CÍCLICO: del último se vuelve al primero.
 * El número de lados y su nombre son datos, no reglas: ver `sides.ts`.
 */
export enum SideId {
  SIDE_0 = 'side-0',
  SIDE_1 = 'side-1',
  SIDE_2 = 'side-2',
  SIDE_3 = 'side-3',
  SIDE_4 = 'side-4',
}

/** Torres (edificios) de una zona. Se recorren lateralmente: A ↔ B ↔ C. */
export enum TowerId {
  TOWER_A = 'tower-a',
  TOWER_B = 'tower-b',
  TOWER_C = 'tower-c',
}

/**
 * Qué hay en una planta de la torre. La última no tiene departamentos: es la
 * azotea. Se declara como tipo y no como "el piso 6 es especial" para que
 * crecer una torre un piso no obligue a tocar la UI.
 */
export enum TowerFloorKind {
  /** Planta con departamentos. */
  APARTMENTS = 'apartments',
  /** Azotea / terraza: sin unidades vendibles. */
  TERRACE = 'terrace',
}

/** Ejes de desplazamiento dentro de una zona (chevrons). */
export enum PanDirection {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

/** Sentido del giro entre lados y del salto entre torres. */
export enum LateralDirection {
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Celdas de la cuadrícula de una zona, con la nomenclatura que usa el cliente
 * en los archivos: `F1.Z1.ArrIzq` → Fase 1, Zona 1, Arriba Izquierda.
 * Es un ALIAS legible de una coordenada (fila, columna); la navegación real
 * se calcula con fila/columna, así que una zona 3×3 no rompe nada.
 */
export enum ViewSlot {
  TOP_LEFT = 'top-left',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_RIGHT = 'bottom-right',
}

/** Qué producto vive dentro de un elemento de la zona. */
export enum ProductKind {
  /** Casa individual (lote con vivienda). */
  HOUSE = 'house',
  /** Torre / edificio con pisos y departamentos. */
  TOWER = 'tower',
  /** Amenidad (parque, club, piscina, losa deportiva…). */
  AMENITY = 'amenity',
  /** Lote sin producto asignado todavía. */
  LOT = 'lot',
}

/**
 * Tipo de elemento (manzana / polígono clicable) dentro de una zona.
 * Se declara explícito además de `contents` porque el dashboard filtra por él.
 */
export enum ZoneElementKind {
  /** Solo casas. */
  HOUSES_ONLY = 'houses_only',
  /** Solo torres. */
  TOWERS_ONLY = 'towers_only',
  /** Solo amenidades. */
  AMENITIES_ONLY = 'amenities_only',
  /** Mezcla (p. ej. casas + amenidades). */
  MIXED = 'mixed',
}

/** Estado comercial de una unidad (casa o departamento). */
export enum UnitStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  SOLD = 'sold',
}

/** Tipo de unidad vendible. */
export enum UnitKind {
  /** Departamento dentro de una torre. */
  APARTMENT = 'apartment',
  /** Casa dentro de un elemento de casas. */
  HOUSE = 'house',
  /** Terreno sin construir dentro de una manzana de lotes. */
  LOT = 'lot',
  /** Estacionamiento, depósito, etc. */
  STORAGE = 'storage',
}

/**
 * Tipologías de departamento. Son CUATRO, una por posición en la planta, y las
 * mismas en las tres torres y en los cinco pisos con departamentos: la unidad
 * 301 de la Torre A y la 504 de la C comparten plano con la 101 de la B si
 * ocupan el mismo sitio en la planta. Por eso el material del cliente son
 * cuatro juegos (`DEPA 01`…`DEPA 04`) y no setenta y dos.
 *
 * El número del slug es el número del departamento DENTRO de la planta (1…4),
 * el mismo que rotula el recorte sobre el plano — no el del piso. Quién es
 * quién se declara en `apartments.ts`, no se deduce del identificador.
 */
export enum ApartmentTypeId {
  TYPE_1 = 'depa-1',
  TYPE_2 = 'depa-2',
  TYPE_3 = 'depa-3',
  TYPE_4 = 'depa-4',
}

/**
 * Las tres maneras de mirar el mismo departamento. No son tres imágenes
 * sueltas: son tres estados del MISMO encuadre, y entre cualquier par hay un
 * video que lleva de uno a otro (`apartments.ts`), así que el visitante ve la
 * planta transformarse en vez de saltar de foto en foto.
 *
 * El cliente los llama AMOBLADO, CAD y ENTREGABLE; en pantalla se rotulan con
 * lo que significan (`ApartmentViewLabel`). La equivalencia entre sus nombres y
 * estos slugs está en `docs/02-ASSETS.md`.
 */
export enum ApartmentView {
  /** Con muebles: cómo se vive. Es la vista de entrada. */
  FURNISHED = 'furnished',
  /** El plano acotado, con las medidas de cada ambiente rotuladas. */
  MEASURED = 'measured',
  /** Como se entrega, sin amoblar: los mismos metros, vacíos. */
  BARE = 'unfurnished',
}

/**
 * Posición del lote dentro de su manzana. Es lo que el cliente llama
 * "Esquinera" o "Medianera", y es uno de los tres ejes del filtro de terrenos
 * (los otros dos son el área y la disponibilidad).
 *
 * No se deduce del polígono: un lote es esquinero porque así lo dice el plano
 * de manzaneo —y su área lo acompaña—, no porque su recorte caiga al final de
 * una fila. Por eso se declara como dato, junto al área, en `lots.ts`.
 */
export enum LotPosition {
  /** Da a dos calles. En este proyecto son los de 78,00 y 108,00 m². */
  CORNER = 'corner',
  /** Da a una sola calle: el lote corriente de 5,50 × 12,00. */
  MIDDLE = 'middle',
}

/**
 * Hacia dónde SALE el lote a la calle, mirando la toma cenital de su zona.
 *
 * No es un dato que se enseñe: no aparece en la ficha ni en el filtro. Existe
 * porque el módulo de casa se planta con la fachada hacia la calle, y el
 * cliente entregó los cuatro giros ya renderizados (`M1-ARRIBA.png`,
 * `M1-DER.png`, …) en vez de uno solo que la web tuviera que rotar. Elegir el
 * archivo equivocado pondría la puerta contra el lote del vecino.
 *
 * "Arriba" es arriba en la toma de la zona, no el norte: los recortes de
 * `lots.ts` están medidos sobre esa misma imagen, así que ambos hablan del
 * mismo marco. Y los renders cerrados de cada lote comparten encuadre con
 * ella, que es lo que permite superponer el PNG del módulo sin moverlo.
 */
export enum LotFacing {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
}

/**
 * Los dos modelos de casa que se pueden plantar sobre un terreno. Son dos
 * diseños distintos —no dos acabados del mismo—, y el cliente los rotula
 * "Módulo 1" y "Módulo 2".
 *
 * De cada uno llegan CUATRO renders, uno por `LotFacing`, así que el catálogo
 * son ocho archivos y no dos.
 */
export enum LotModuleId {
  ONE = 'module-1',
  TWO = 'module-2',
}

/**
 * Pasos del recorrido. Sirven para (a) saber en qué nivel está el usuario,
 * (b) etiquetar analíticas y (c) construir las rutas del dashboard.
 * Orden real del flujo: ver `docs/01-NAVEGACION.md`.
 *
 * El showroom usa ESTE enum como su máquina de estados, así que el paso en el
 * que está el visitante y el paso que se registra en analíticas son el mismo
 * valor: no hay dos vocabularios que mantener sincronizados.
 *
 * Encadenamiento hacia atrás (cada paso vuelve al anterior de esta lista):
 *   INTRO → PHASES → ZONES → ZONE_VIEW → TOWER → FLOOR
 * SIDES cuelga de PHASES: es un desvío desde el Master Plan, no un paso
 * intermedio para llegar a las fases.
 */
export enum NavigationStep {
  INTRO = 'intro',
  SIDES = 'sides',
  PHASES = 'phases',
  ZONES = 'zones',
  ZONE_VIEW = 'zone_view',
  ELEMENT = 'element',
  TOWER = 'tower',
  FLOOR = 'floor',
  UNIT = 'unit',
}

// ============================================================================
// CATÁLOGOS DE ETIQUETAS — lo único que se edita cuando cambia un nombre
// ============================================================================

/**
 * Nombre de cada vista tal y como lo lee el visitante en los botones de
 * "volver" y en los accesos del showroom.
 *
 * "Master Plan" es el nombre que usa el cliente para la toma con todo el
 * proyecto; antes se rotulaba "Vista general" / "mapa de fases". Cambiarlo
 * otra vez es editar solo esta tabla.
 */
export const NavigationStepLabel: Record<NavigationStep, string> = {
  [NavigationStep.INTRO]: 'Portada',
  [NavigationStep.SIDES]: 'Giro 360°',
  [NavigationStep.PHASES]: 'Master Plan',
  [NavigationStep.ZONES]: 'Zonas',
  [NavigationStep.ZONE_VIEW]: 'Zona',
  [NavigationStep.ELEMENT]: 'Manzana',
  [NavigationStep.TOWER]: 'Torres',
  [NavigationStep.FLOOR]: 'Piso',
  [NavigationStep.UNIT]: 'Unidad',
};

export const PhaseLabel: Record<PhaseId, string> = {
  [PhaseId.PHASE_1]: 'Fase 1',
  [PhaseId.PHASE_2]: 'Fase 2',
  [PhaseId.PHASE_3]: 'Fase 3',
  [PhaseId.PHASE_4]: 'Fase 4',
};

export const ZoneLabel: Record<ZoneId, string> = {
  [ZoneId.ZONE_1]: 'Zona 1',
  [ZoneId.ZONE_2]: 'Zona 2',
  [ZoneId.ZONE_3]: 'Zona 3',
  [ZoneId.ZONE_4]: 'Zona 4',
};

/** Si mañana son "Lado Norte", "Noroeste", etc., se cambia AQUÍ y en ningún otro sitio. */
export const SideLabel: Record<SideId, string> = {
  [SideId.SIDE_0]: 'Portada',
  [SideId.SIDE_1]: 'Lado 1',
  [SideId.SIDE_2]: 'Lado 2',
  [SideId.SIDE_3]: 'Lado 3',
  [SideId.SIDE_4]: 'Lado 4',
};

export const TowerFloorKindLabel: Record<TowerFloorKind, string> = {
  [TowerFloorKind.APARTMENTS]: 'Piso',
  [TowerFloorKind.TERRACE]: 'Terraza',
};

export const TowerLabel: Record<TowerId, string> = {
  [TowerId.TOWER_A]: 'Torre A',
  [TowerId.TOWER_B]: 'Torre B',
  [TowerId.TOWER_C]: 'Torre C',
};

export const PhaseStatusLabel: Record<PhaseStatus, string> = {
  [PhaseStatus.AVAILABLE]: 'Disponible',
  [PhaseStatus.COMING_SOON]: 'Próximamente',
};

export const UnitKindLabel: Record<UnitKind, string> = {
  [UnitKind.APARTMENT]: 'Departamento',
  [UnitKind.HOUSE]: 'Casa',
  [UnitKind.LOT]: 'Terreno',
  [UnitKind.STORAGE]: 'Depósito',
};

export const UnitStatusLabel: Record<UnitStatus, string> = {
  [UnitStatus.AVAILABLE]: 'Disponible',
  [UnitStatus.RESERVED]: 'Apartado',
  [UnitStatus.SOLD]: 'Vendido',
};

export const ApartmentTypeLabel: Record<ApartmentTypeId, string> = {
  [ApartmentTypeId.TYPE_1]: 'Departamento 1',
  [ApartmentTypeId.TYPE_2]: 'Departamento 2',
  [ApartmentTypeId.TYPE_3]: 'Departamento 3',
  [ApartmentTypeId.TYPE_4]: 'Departamento 4',
};

/** Lo que se lee en el botón. */
export const ApartmentViewLabel: Record<ApartmentView, string> = {
  [ApartmentView.FURNISHED]: 'Amoblado',
  [ApartmentView.MEASURED]: 'Medidas',
  [ApartmentView.BARE]: 'Sin amoblar',
};

export const LotPositionLabel: Record<LotPosition, string> = {
  [LotPosition.CORNER]: 'Esquinera',
  [LotPosition.MIDDLE]: 'Medianera',
};

export const LotModuleLabel: Record<LotModuleId, string> = {
  [LotModuleId.ONE]: 'Módulo 1',
  [LotModuleId.TWO]: 'Módulo 2',
};

export const ProductKindLabel: Record<ProductKind, string> = {
  [ProductKind.HOUSE]: 'Casa',
  [ProductKind.TOWER]: 'Torre',
  [ProductKind.AMENITY]: 'Amenidad',
  [ProductKind.LOT]: 'Lote',
};

export const ZoneElementKindLabel: Record<ZoneElementKind, string> = {
  [ZoneElementKind.HOUSES_ONLY]: 'Casas',
  [ZoneElementKind.TOWERS_ONLY]: 'Torres',
  [ZoneElementKind.AMENITIES_ONLY]: 'Amenidades',
  [ZoneElementKind.MIXED]: 'Mixto',
};

/**
 * Sufijo que el cliente usa en los archivos entregados para cada celda.
 * Solo se usa para RESOLVER NOMBRES DE ASSETS, nunca para navegar.
 */
export const ViewSlotAssetSuffix: Record<ViewSlot, string> = {
  [ViewSlot.TOP_LEFT]: 'ArrIzq',
  [ViewSlot.TOP_RIGHT]: 'ArrDer',
  [ViewSlot.BOTTOM_LEFT]: 'AbjIzq',
  [ViewSlot.BOTTOM_RIGHT]: 'AbjDer',
};

export const ViewSlotLabel: Record<ViewSlot, string> = {
  [ViewSlot.TOP_LEFT]: 'Arriba izquierda',
  [ViewSlot.TOP_RIGHT]: 'Arriba derecha',
  [ViewSlot.BOTTOM_LEFT]: 'Abajo izquierda',
  [ViewSlot.BOTTOM_RIGHT]: 'Abajo derecha',
};
