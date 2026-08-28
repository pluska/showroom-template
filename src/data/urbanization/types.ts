// ============================================================================
// TIPOS DEL DOMINIO — Urbanización El Olimpo de Tumbes
// ----------------------------------------------------------------------------
// Estas interfaces son el contrato entre los datos (`src/data/urbanization/*`),
// la UI y —más adelante— las tablas de D1. Cada interfaz tiene su tabla
// equivalente propuesta en `docs/03-SCHEMA-DB.md`.
//
// Convención de geometría (heredada del proyecto Océano Atlántico):
//   `x`, `y`      → porcentaje 0–100 sobre la imagen (punto del marcador)
//   `path`        → atributo `d` de un <path> SVG en espacio 0–100
// Así el recorte funciona igual en cualquier resolución de pantalla.
// ============================================================================

import {
  ApartmentTypeId,
  ApartmentView,
  LotFacing,
  LotPosition,
  PhaseId,
  PhaseStatus,
  ProductKind,
  SideId,
  TowerFloorKind,
  TowerId,
  UnitKind,
  UnitStatus,
  ViewSlot,
  ZoneElementKind,
  ZoneId,
} from './enums';

// ---------------------------------------------------------------------------
// Assets
// ---------------------------------------------------------------------------

/**
 * Juego de assets de un lado. Se mantiene la separación día/noche del
 * proyecto Océano por si el cliente entrega el timelapse; si no llega,
 * `night` puede quedar igual a `day` sin romper nada.
 */
export interface SideAssetSet {
  /** Imagen fija del lado (clave R2, sin dominio). */
  background: string;
  /**
   * Video de entrada al lado: se reproduce UNA vez y termina. Su último
   * fotograma es el primero de `backgroundVideo`, así que al acabar se cede
   * el relevo al bucle sin que se vea el corte.
   */
  introVideo?: string;
  /** Video en bucle opcional sobre la imagen. */
  backgroundVideo?: string;
  /** Video que se reproduce al "ingresar" al proyecto desde este lado. */
  enterVideo?: string;
  /** Transiciones de giro hacia el lado anterior / siguiente. */
  transitions: {
    toLeft: string;
    toRight: string;
  };
}

// ---------------------------------------------------------------------------
// Lados (antes "Caras")
// ---------------------------------------------------------------------------

/**
 * Un lado de la urbanización. El giro es cíclico: desde el último lado a la
 * derecha se llega al primero. NADA debe depender de que sean exactamente 4:
 * el ciclo se calcula sobre `sidesOrder` (ver `sides.ts`).
 */
export interface Side {
  id: SideId;
  /** Posición en el ciclo. Determina quién es el "siguiente" a la derecha. */
  order: number;
  /** Etiqueta visible. Por defecto sale de `SideLabel`; aquí se puede pisar. */
  label?: string;
  dayToNightTransition?: string;
  nightToDayTransition?: string;
  day: SideAssetSet;
  night: SideAssetSet;
}

// ---------------------------------------------------------------------------
// Fases
// ---------------------------------------------------------------------------

/** Una fase del proyecto. Hoy solo la Fase 1 está en `AVAILABLE`. */
export interface Phase {
  id: PhaseId;
  order: number;
  label?: string;
  status: PhaseStatus;
  /** Toma aérea de la fase completa (F1.png). */
  image: string;
  /** Recorte usado en la pestaña Amenidades y en el selector de fases. */
  thumbnail?: string;
  /** Texto bajo el rótulo "Próximamente" cuando `status` no es AVAILABLE. */
  comingSoonNote?: string;
  /**
   * Cuadrícula por la que se desplaza el visitante DENTRO de la fase. Cada
   * celda es una zona. Es dato, no regla: hoy la Fase 1 es 2×2, pero una fase
   * 3×3 o en forma de L funciona sin tocar la navegación ni la UI.
   */
  grid: {
    rows: number;
    cols: number;
  };
  /** Zona por la que se entra a la fase. */
  entryZone: ZoneCoords;
  zones: Zone[];
  /**
   * Área clicable de la fase sobre la toma general (TOMA_FASES), para que las
   * fases salgan resaltadas en la pantalla de Urbanización.
   */
  hotspot?: PhaseHotspot;
}

/**
 * Marcador y polígono de un sitio sobre la toma que lo contiene: una fase
 * sobre el Master Plan, o una zona sobre la toma de su fase.
 */
export interface PhaseHotspot {
  /** Centro del marcador, en % de la imagen. */
  x: number;
  y: number;
  /** Polígono resaltado: atributo `d` de SVG en espacio 0–100. */
  path?: string;
  /**
   * Polígonos de las manzanas que se iluminan cuando la zona se resalta.
   * Si se especifican, son estas manzanas las que se colorean al hacer hover.
   */
  paths?: string[];
  /** Manzanas individuales que componen la zona con sus centros y polígonos. */
  blockHotspots?: ZoneElementHotspot[];
}

// ---------------------------------------------------------------------------
// Zonas y su cuadrícula de vistas
// ---------------------------------------------------------------------------

/**
 * Una zona dentro de una fase, y a la vez UNA CELDA de la cuadrícula de la
 * fase: cada zona es una toma a pantalla completa, y el desplazamiento con
 * chevrons mueve de una zona a la contigua.
 *
 * Esto es lo que describe el cliente ("dentro de fases se escoge la zona con
 * la movilidad tipo chevron") y lo que confirman los archivos: las cuatro
 * tomas `F1.Z1.*` cubren la Fase 1 ENTERA, así que no pueden ser cuatro
 * encuadres de una sola zona — no quedaría sitio para las otras tres.
 *
 * `row`/`col` son la posición en la cuadrícula de la fase. Nada asume 2×2:
 * los chevrons se derivan de qué vecinas existen (ver `navigation.ts`).
 */
export interface Zone extends ZoneCoords {
  id: ZoneId;
  phaseId: PhaseId;
  order: number;
  label?: string;
  status: PhaseStatus;
  /** Alias legible de la celda cuando la cuadrícula es 2×2. */
  slot?: ViewSlot;
  /** Toma de la zona a pantalla completa (clave R2). */
  image: string;
  /**
   * Marcador de la zona sobre la toma de SU FASE. Es lo que hace clicable el
   * paso previo: desde la toma de la Fase 1 se ve dónde cae cada zona y se
   * entra pulsando su rótulo. Sin marcador, la zona solo se alcanza con los
   * chevrons desde una vecina.
   */
  hotspot?: PhaseHotspot;
  /** Video opcional de desplazamiento hacia cada zona vecina. */
  panVideos?: Partial<Record<'up' | 'down' | 'left' | 'right', string>>;
  elements: ZoneElement[];
}

export interface ZoneCoords {
  /** 0 = fila superior. */
  row: number;
  /** 0 = columna izquierda. */
  col: number;
}

/**
 * Elemento clicable dentro de una zona: una manzana / polígono que agrupa
 * casas, torres o amenidades. Como cada zona es una sola toma, un elemento
 * tiene un único área clicable dentro de ella.
 */
export interface ZoneElement {
  id: string;
  zoneId: ZoneId;
  label: string;
  kind: ZoneElementKind;
  /** Qué contiene realmente. `kind` es el resumen para filtrar; esto, el detalle. */
  contents: ProductKind[];
  /** Torres que viven en este elemento (si `contents` incluye TOWER). */
  towerIds?: TowerId[];
  /** Casas que viven en este elemento (si `contents` incluye HOUSE). */
  houseIds?: string[];
  /** Amenidades del elemento (si `contents` incluye AMENITY). */
  amenityIds?: string[];
  /** Área clicable dentro de la toma de su zona. */
  hotspot: ZoneElementHotspot;
}

export interface ZoneElementHotspot {
  /** Centro del marcador, en % de la imagen. */
  x: number;
  y: number;
  /** Polígono clicable: atributo `d` de SVG en espacio 0–100. */
  path?: string;
  /** Polígonos individuales (p. ej. torres o bloques) que se iluminan al hacer hover. */
  paths?: string[];
  /** Sub-elementos individuales con sus centros y polígonos. */
  blockHotspots?: ZoneElementHotspot[];
}

// ---------------------------------------------------------------------------
// Torres
// ---------------------------------------------------------------------------

/**
 * Una torre (edificio). El recorrido lateral entre torres CONSERVA EL PISO:
 * si el usuario está en el piso 3 de la Torre A y va a la B, entra al piso 3
 * de la B (ver `navigation.ts` → `resolveTowerSwitch`).
 */
export interface Tower {
  id: TowerId;
  zoneId: ZoneId;
  /** Elemento de la zona al que pertenece. */
  elementId: string;
  /** Posición lateral: 0 = la más a la izquierda. */
  order: number;
  label?: string;
  /** Imagen de fachada de la torre. */
  facadeImage?: string;
  /**
   * Área clicable de la torre sobre la toma de las tres (`ABC`). Misma
   * convención que el resto: `x`/`y` en % y `path` en espacio 0–100.
   */
  hotspot?: ZoneElementHotspot;
  /**
   * Video de acercamiento desde la toma de las tres torres hasta ESTA torre.
   * Solo se reproduce al ENTRAR desde la vista general: el salto lateral entre
   * torres no lo usa (ver `entryLevel`).
   */
  entryVideo?: string;
  /**
   * Piso en el que aterriza `entryVideo`. Es el último fotograma del video, así
   * que tiene que coincidir con la planta que se muestra al terminar o se nota
   * el corte. Hoy los tres videos terminan en el piso 5.
   *
   * Ojo: esto NO es "el piso por el que se entra siempre". Cuando el visitante
   * pasa de una torre a otra conserva el piso en el que estaba (piso 3 de la A
   * → piso 3 de la B) y no hay video de por medio.
   */
  entryLevel?: number;
  floors: TowerFloor[];
}

/** Un piso de una torre. `level` es el número real; `label` es lo que se muestra. */
export interface TowerFloor {
  id: string;
  towerId: TowerId;
  level: number;
  label: string;
  /**
   * Qué hay en la planta. La azotea se recorre igual que las demás —tiene su
   * toma— pero `units` viene vacío: no hay nada que vender ahí.
   */
  kind: TowerFloorKind;
  /** Plano de planta (clave R2). */
  planImage: string;
  units: Unit[];
}

// ---------------------------------------------------------------------------
// Casas y amenidades
// ---------------------------------------------------------------------------

/** Una casa dentro de un elemento de la zona. */
export interface House {
  id: string;
  zoneId: ZoneId;
  elementId: string;
  /** Código comercial visible: manzana / lote. */
  code: string;
  /** Tipología: "Casa 2 pisos", "Dúplex", etc. */
  typology?: string;
  status: UnitStatus;
  bedrooms?: number;
  bathrooms?: number;
  /** Área techada en m². */
  builtAreaSqm?: number;
  /** Área del lote en m². */
  lotAreaSqm?: number;
  planImage?: string;
  gallery?: string[];
  tourUrl?: string;
  /** Marcador dentro de la vista de la zona. */
  hotspot?: ZoneElementHotspot;
}

/** Una amenidad (parque, club, piscina…). */
export interface Amenity {
  id: string;
  zoneId?: ZoneId;
  elementId?: string;
  label: string;
  description?: string;
  gallery?: string[];
  tourUrl?: string;
  hotspot?: ZoneElementHotspot;
}

// ---------------------------------------------------------------------------
// Unidades vendibles
// ---------------------------------------------------------------------------

/**
 * Unidad vendible. Modelo unificado para departamento de torre y casa: el
 * dashboard trabaja sobre una sola tabla y `kind` decide qué campos aplican.
 */
export interface Unit {
  id: string;
  /** Código visible: "A-301", "Mz. C Lt. 12". */
  identifier: string;
  kind: UnitKind;
  status: UnitStatus;
  /** Presente si `kind = APARTMENT`. */
  towerId?: TowerId;
  floorId?: string;
  /**
   * Tipología a la que pertenece el departamento: de quién son el plano
   * amoblado, el acotado y el entregable que enseña su ficha. Solo depende de
   * la POSICIÓN en la planta, así que las quince unidades que ocupan el sitio
   * 1 en las tres torres comparten tipología (ver `apartments.ts`).
   */
  apartmentTypeId?: ApartmentTypeId;
  /** Presente si `kind = HOUSE`. */
  elementId?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  /**
   * Solo terrenos: esquinera o medianera. Junto con `areaSqm` y `status` es lo
   * que filtra el panel de la zona (ver `lots.ts` → `LOT_ATTRIBUTES`).
   */
  lotPosition?: LotPosition;
  /**
   * Solo terrenos: hacia dónde sale el lote a la calle. Dato OCULTO —no se
   * rotula en ninguna parte— cuya única misión es elegir cuál de los cuatro
   * giros del módulo se planta encima del render (ver `lots.ts` →
   * `BLOCK_FACINGS`).
   */
  lotFacing?: LotFacing;
  price?: number;
  subtitle?: string;
  description?: string;
  /** Área clicable sobre el plano de planta (espacio 0–100). */
  x?: number;
  y?: number;
  path?: string;
  /**
   * Vista cenital propia de la unidad (clave R2). Hoy la usan los terrenos:
   * cada lote tiene su render cerrado, que hace de ficha visual.
   */
  planImage?: string;
  /**
   * La misma vista pero con las medidas rotuladas. Es la que se enseña primero
   * cuando existe: en un terreno, las medidas son el dato. `planImage` queda de
   * respaldo para cuando la versión acotada todavía no está subida.
   */
  planImageMeasured?: string;
  gallery?: string[];
  photosFurnished?: string[];
  photosUnfurnished?: string[];
  photosPlans?: string[];
  tourUrl?: string;
}

// ---------------------------------------------------------------------------
// Tipologías de departamento
// ---------------------------------------------------------------------------

/**
 * Una de las cuatro tipologías de departamento, con sus tres vistas y los seis
 * videos que las enlazan.
 *
 * Es una entidad aparte de `Unit` a propósito: el plano es de la tipología y el
 * precio, el estado y el código son de la unidad. Meterlo todo en `Unit`
 * obligaría a repetir las mismas tres claves en las sesenta unidades y a
 * mantenerlas sincronizadas a mano.
 */
export interface ApartmentType {
  id: ApartmentTypeId;
  /**
   * Sitio que ocupa en la planta (1…4), el mismo número que rotula el recorte
   * sobre el plano del piso. Es el enganche entre la unidad y su tipología.
   */
  unitNumber: number;
  /** Clave R2 de cada vista. Están las tres para las cuatro tipologías. */
  images: Record<ApartmentView, string>;
  /**
   * Clave R2 del video de cada par ordenado de vistas. `transitions[from][to]`;
   * `from === to` no existe.
   */
  transitions: Record<ApartmentView, Partial<Record<ApartmentView, string>>>;
}

// ---------------------------------------------------------------------------
// Puntos de vista
// ---------------------------------------------------------------------------

/**
 * Un punto de vista sobre la toma de una zona: dónde estaría plantada la
 * cámara y hacia dónde apunta. Se dibuja como el marcador de compás —el
 * círculo con el abanico— y al pulsarlo el panel muestra la foto que se vería
 * desde ahí.
 *
 * Se declara con DOS coordenadas y no con un ángulo porque así es como se
 * miden: con la herramienta de coordenadas del showroom se marca primero el
 * sitio y después algo que quede en la dirección de la mirada. El ángulo lo
 * calcula `viewpointHeading()`; escribirlo a mano obligaría a convertir
 * grados a ojo y a rehacerlo entero si la toma cambia.
 */
export interface Viewpoint {
  id: string;
  zoneId: ZoneId;
  /**
   * Orden dentro de la zona, EMPEZANDO EN 1. Es también el número que se pinta
   * en el marcador y el que empareja con la imagen del panel: el punto 3 de la
   * Zona 1 enseña `viewpoints/zone-1/3.day.webp`. Si el orden cambia, cambia
   * la imagen que sale — es un emparejamiento por posición, no por nombre.
   */
  order: number;
  label?: string;
  /** Dónde está la cámara (el círculo del marcador), en % de la imagen. */
  anchor: { x: number; y: number };
  /**
   * Un punto cualquiera en la dirección hacia la que mira. Solo importa el
   * ángulo respecto a `anchor`; la distancia se ignora.
   */
  target: { x: number; y: number };
  /**
   * Foto de día de lo que se ve desde aquí (clave R2). Es la que enseña el
   * panel y la que manda: si solo hubiera una, sería esta.
   */
  image?: string;
  /**
   * La misma toma de noche, con el mismo encuadre exacto. Solo se usa en el
   * comparador de la ficha; si no está, la ficha enseña la de día sola y la
   * cortina no aparece.
   */
  imageNight?: string;
  /** Pie de foto opcional del panel. */
  caption?: string;
}

// ---------------------------------------------------------------------------
// Pestaña Amenidades
// ---------------------------------------------------------------------------

/**
 * Tarjeta vertical de la portada de la pestaña Amenidades: una por fase.
 * Las fases que no están `AVAILABLE` se renderizan borrosas con "Próximamente"
 * y sin click.
 */
export interface AmenitiesPhaseCard {
  phaseId: PhaseId;
  label: string;
  status: PhaseStatus;
  image: string;
  /** A dónde navega la tarjeta cuando la fase está disponible. */
  href?: string;
  note?: string;
}

/**
 * Tarjeta y datos de una amenidad dentro de una fase (p. ej. Club House, Parque Mz. R, Parque Mz. P).
 */
export interface PhaseAmenity {
  id: string;
  phaseId: PhaseId | string;
  title: string;
  subtitle?: string;
  coverImage: string;
  photoCount: number;
  gallery: string[];
}

