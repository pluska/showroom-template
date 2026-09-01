"use server";

import { getDb } from "@/lib/db";
import { floors, units, logs } from "@/lib/db/schema";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { floorsData as staticFloorsData } from "@/data/floors";
import { LOT_DEFAULT_AREA_SQM, lotBlocks, lotUnits } from "@/data/urbanization/lots";
import { towers } from "@/data/urbanization/towers";
import { APARTMENT_AREA_SQM, APARTMENT_TOUR_URL } from "@/data/urbanization/apartments";
import { ApartmentTypeId, ApartmentTypeLabel, TowerLabel, ZoneInventoryNote, ZoneLabel } from "@/data/urbanization/enums";
import { phase1Zones } from "@/data/urbanization/zones";
import { ZoneId, UnitStatus, LotPosition, TowerFloorKind } from "@/data/urbanization/enums";
import { lotPlanImage, lotMeasuredPlanImage } from "@/data/urbanization/assets";
import { getAssetUrl } from "@/utils/assets";

// Helper to audit actions
async function logAction(
  db: any,
  session: any,
  action: "CREATE" | "UPDATE" | "DELETE",
  entityType: "floor" | "unit",
  entityId: string,
  details: any
) {
  await db.insert(logs).values({
    userId: session?.user?.id || "system",
    userName: session?.user?.name || "Dev User",
    action,
    entityType,
    entityId,
    details: JSON.stringify(details),
  });
}

// ----------------------------------------------------
// FLOOR ACTIONS
// ----------------------------------------------------

export async function getFloors() {
  const db = await getDb();
  return await db
    .select()
    .from(floors)
    .where(isNull(floors.deletedAt))
    .orderBy(floors.level);
}

export async function getFloorsData() {
  let isSuperAdmin = false;
  try {
    const session = await auth();
    isSuperAdmin = session?.user?.role === "SUPER_ADMIN";
  } catch (e) {
    // Ignore runtime/environment issues during local dev/tests
  }

  const db = await getDb();
  
  const allFloors = await db
    .select()
    .from(floors)
    .where(isNull(floors.deletedAt))
    .orderBy(floors.level);

  const allUnits = await db
    .select()
    .from(units)
    .where(isNull(units.deletedAt))
    .orderBy(units.identifier);

  return allFloors.map(f => {
    const rawFloorId = f.id.replace('floor_', '');
    const staticFloor = staticFloorsData.find(sf => sf.id === rawFloorId);

    const floorUnits = allUnits
      .filter(u => u.floorId === f.id)
      .filter(u => {
        if (u.state === 'COMMON_AREA') {
          return isSuperAdmin;
        }
        return true;
      })
      .map(u => {
        let status: 'available' | 'reserved' | 'sold' = 'available';
        if (u.state === 'SOLD') status = 'sold';
        else if (u.state === 'RESERVED') status = 'reserved';
        
        const coords = u.coordinates as { x?: number; y?: number; path?: string } | null;
        
        const cleanUnitId = u.id.replace(`unit_${rawFloorId}_`, '');
        const staticUnit = staticFloor?.units.find(
          su => su.id === cleanUnitId || su.id === u.identifier || (su.identifier && su.identifier === u.identifier)
        );

        let subtitle = 'Flat';
        if (u.type === 'STORAGE') {
          subtitle = 'Bodega';
        } else if (u.type === 'DUPLEX') {
          // Marks the unit as spanning two floors, which is what makes the unit
          // page show the level selector between its lower and upper plans.
          subtitle = 'Dúplex';
        } else if (u.identifier === 'Terraza') {
          subtitle = 'Terraza';
        } else if (u.identifier === '801') {
          subtitle = 'Duplex';
        }

        return {
          id: u.id,
          identifier: u.identifier,
          floorId: u.floorId.replace('floor_', ''),
          price: 0,
          dimensions: u.areaSqm || 0,
          bedrooms: u.bedrooms || undefined,
          bathrooms: u.bathrooms || undefined,
          status,
          type: u.type === 'STORAGE' ? ('storage' as const) : ('apartment' as const),
          subtitle,
          description: '',
          images: u.gallery ? (u.gallery as string[]) : [],
          tourUrl: u.tourUrl || undefined,
          x: coords?.x ?? staticUnit?.x,
          y: coords?.y ?? staticUnit?.y,
          path: coords?.path ?? staticUnit?.path,
          photosFurnished: u.photosFurnished ? (u.photosFurnished as string[]) : [],
          photosUnfurnished: u.photosUnfurnished ? (u.photosUnfurnished as string[]) : [],
          photosPlans: u.photosPlans ? (u.photosPlans as string[]) : [],
          photosBalcony: u.photosBalcony ? (u.photosBalcony as string[]) : [],
          gallery: u.gallery ? (u.gallery as string[]) : [],
        };
      });

    return {
      id: f.id.replace('floor_', ''),
      name: f.name,
      level: f.level,
      floorPlanImage: f.imagePath || '',
      units: floorUnits,
    };
  });
}

export async function createFloor(data: {
  name: string;
  level: number;
  type: string;
  imagePath?: string;
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede crear plantas.");
  }

  const db = await getDb();
  const [newFloor] = await db
    .insert(floors)
    .values({
      name: data.name,
      level: data.level,
      type: data.type,
      imagePath: data.imagePath || "",
    })
    .returning();

  await logAction(db, session, "CREATE", "floor", newFloor.id, {
    name: newFloor.name,
    level: newFloor.level,
    type: newFloor.type,
  });

  revalidatePath("/dashboard/units");
  return newFloor;
}

export async function updateFloor(
  id: string,
  data: {
    name: string;
    level: number;
    type: string;
    imagePath?: string;
  }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede editar plantas.");
  }

  const db = await getDb();
  
  // Get original floor
  const [original] = await db.select().from(floors).where(eq(floors.id, id));
  if (!original) throw new Error("Planta no encontrada.");

  const [updatedFloor] = await db
    .update(floors)
    .set({
      name: data.name,
      level: data.level,
      type: data.type,
      imagePath: data.imagePath,
      updatedAt: new Date(),
    })
    .where(eq(floors.id, id))
    .returning();

  await logAction(db, session, "UPDATE", "floor", id, {
    before: { name: original.name, level: original.level, type: original.type },
    after: { name: updatedFloor.name, level: updatedFloor.level, type: updatedFloor.type },
  });

  revalidatePath("/dashboard/units");
  return updatedFloor;
}

export async function deleteFloor(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede eliminar plantas.");
  }

  const db = await getDb();

  // Find units that will be soft-deleted recursively
  const relatedUnits = await db
    .select()
    .from(units)
    .where(and(eq(units.floorId, id), isNull(units.deletedAt)));

  const now = new Date();

  // Soft delete floor
  await db
    .update(floors)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(floors.id, id));

  // Soft delete related units
  if (relatedUnits.length > 0) {
    const unitIds = relatedUnits.map((u) => u.id);
    await db
      .update(units)
      .set({ deletedAt: now, updatedAt: now })
      .where(inArray(units.id, unitIds));
  }

  await logAction(db, session, "DELETE", "floor", id, {
    floorId: id,
    deletedUnitsCount: relatedUnits.length,
    deletedUnitIds: relatedUnits.map((u) => u.id),
  });

  revalidatePath("/dashboard/units");
  return { success: true, deletedUnitsCount: relatedUnits.length };
}

// ----------------------------------------------------
// UNIT ACTIONS
// ----------------------------------------------------

export async function getUnits() {
  const db = await getDb();
  return await db
    .select()
    .from(units)
    .where(isNull(units.deletedAt))
    .orderBy(units.identifier);
}

export async function createUnit(data: {
  floorId: string;
  identifier: string;
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: number;
  state?: string;
  tourUrl?: string;
  photosFurnished?: string[];
  photosUnfurnished?: string[];
  photosPlans?: string[];
  photosBalcony?: string[];
}) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede crear unidades.");
  }

  const db = await getDb();
  const [newUnit] = await db
    .insert(units)
    .values({
      floorId: data.floorId,
      identifier: data.identifier,
      type: data.type || "",
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      areaSqm: data.areaSqm || 0,
      state: data.state || "AVAILABLE",
      tourUrl: data.tourUrl || "",
      photosFurnished: data.photosFurnished || [],
      photosUnfurnished: data.photosUnfurnished || [],
      photosPlans: data.photosPlans || [],
      photosBalcony: data.photosBalcony || [],
      gallery: [],
      renders: [],
    })
    .returning();

  await logAction(db, session, "CREATE", "unit", newUnit.id, {
    identifier: newUnit.identifier,
    floorId: newUnit.floorId,
    state: newUnit.state,
  });

  revalidatePath("/dashboard/units");
  return newUnit;
}

export async function updateUnit(
  id: string,
  data: {
    identifier: string;
    type?: string;
    bedrooms?: number;
    bathrooms?: number;
    areaSqm?: number;
    state?: string;
    tourUrl?: string;
    photosFurnished?: string[];
    photosUnfurnished?: string[];
    photosPlans?: string[];
    photosBalcony?: string[];
  }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede editar detalles de la unidad.");
  }

  const db = await getDb();
  
  // Get original unit
  const [original] = await db.select().from(units).where(eq(units.id, id));
  if (!original) throw new Error("Unidad no encontrada.");

  const [updatedUnit] = await db
    .update(units)
    .set({
      identifier: data.identifier,
      type: data.type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      areaSqm: data.areaSqm,
      state: data.state,
      tourUrl: data.tourUrl,
      photosFurnished: data.photosFurnished || [],
      photosUnfurnished: data.photosUnfurnished || [],
      photosPlans: data.photosPlans || [],
      photosBalcony: data.photosBalcony || [],
      updatedAt: new Date(),
    })
    .where(eq(units.id, id))
    .returning();

  await logAction(db, session, "UPDATE", "unit", id, {
    before: { identifier: original.identifier, state: original.state },
    after: { identifier: updatedUnit.identifier, state: updatedUnit.state },
  });

  revalidatePath("/dashboard/units");
  return updatedUnit;
}

export async function updateUnitState(id: string, newState: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized: Debes iniciar sesión.");
  }

  const db = await getDb();
  
  // Get original unit
  const [original] = await db.select().from(units).where(eq(units.id, id));
  if (!original) throw new Error("Unidad no encontrada.");

  const currentState = original.state;

  // Validation Guard: check for reversion (moving to a previous state)
  const isReversion = (current: string, next: string) => {
    if (current === "SOLD" && (next === "RESERVED" || next === "AVAILABLE")) return true;
    if (current === "RESERVED" && next === "AVAILABLE") return true;
    if (current === "COMMON_AREA" && next !== "COMMON_AREA") return true;
    return false;
  };

  if (isReversion(currentState, newState)) {
    // Requires supervisor status (ADMIN or SUPER_ADMIN)
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      throw new Error(
        "Unauthorized: Revertir el estado de una unidad reservada/vendida requiere autorización de Supervisor."
      );
    }
  }

  const [updatedUnit] = await db
    .update(units)
    .set({
      state: newState,
      updatedAt: new Date(),
    })
    .where(eq(units.id, id))
    .returning();

  await logAction(db, session, "UPDATE", "unit", id, {
    identifier: original.identifier,
    transition: `${currentState} -> ${newState}`,
    authorizedBy: session.user.name,
    role: session.user.role,
  });

  revalidatePath("/dashboard/units");
  return updatedUnit;
}

export async function deleteUnit(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede eliminar unidades.");
  }

  const db = await getDb();
  const now = new Date();

  const [deletedUnit] = await db
    .update(units)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(units.id, id))
    .returning();

  await logAction(db, session, "DELETE", "unit", id, {
    identifier: deletedUnit.identifier,
  });

  revalidatePath("/dashboard/units");
  return { success: true };
}

// ----------------------------------------------------
// AUDIT LOG ACTIONS
// ----------------------------------------------------

export async function getLogs() {
  const db = await getDb();
  return await db
    .select()
    .from(logs)
    .orderBy(logs.createdAt);
}

// ----------------------------------------------------
// URBANIZATION UNITS & FLOORS (OLIMPO TUMBES)
// ----------------------------------------------------

export interface UrbanizationUnit {
  id: string;
  /**
   * La zona a la que pertenece la unidad. Es `ZoneId`, no una unión de tres
   * literales: sumar una zona al proyecto no debería obligar a editar este
   * tipo. `null` cuando la manzana todavía no tiene zona asignada — esas
   * unidades no salen bajo ninguna pestaña del panel, igual que antes, pero
   * ahora se dicen en vez de colarse bajo una zona equivocada.
   */
  zoneId: ZoneId | null;
  zoneName: string;
  kind: "lot" | "apartment";

  // Lotes:
  blockId?: string;
  blockLetter?: string;
  lotNumber?: number;
  lotPosition?: "Esquinera" | "Medianera";

  // Torres / Departamentos:
  towerId?: string;
  towerName?: string;
  floorLevel?: number;
  floorName?: string;
  floorId?: string;
  apartmentTypeId?: string;
  /** Nombre de la tipología, del catálogo de etiquetas. */
  apartmentTypeName?: string;

  // Comercial & Atributos:
  code: string;
  identifier: string;
  type: string;
  areaSqm: number;
  bedrooms?: number;
  bathrooms?: number;
  state: "AVAILABLE" | "RESERVED" | "SOLD" | "COMMON_AREA";
  buyerName?: string | null;
  price?: number;
  tourUrl?: string | null;
  planImage?: string | null;
  planImageMeasured?: string | null;
  gallery?: string[];
  updatedAt?: Date | null;
}

/**
 * Nombre de zona para el inventario: el del catálogo más, si lo hay, el matiz
 * que distingue una zona de otra en el panel. Antes esto era una cadena de
 * ternarios con los nombres escritos a mano, que además daba por hecho que las
 * zonas con lotes eran exactamente dos.
 */
/**
 * Una pestaña del inventario. El panel no puede deducir el orden de las zonas
 * a partir de las unidades: `getUrbanizationUnitsData` recorre las manzanas en
 * orden alfabético (K…N son de la Zona 2, O…R de la Zona 1), así que la
 * primera zona que aparece no es la primera del proyecto. El orden lo declara
 * el dominio en `phase1Zones` y viaja por aquí.
 */
export interface UrbanizationZoneTab {
  id: ZoneId;
  name: string;
}

/**
 * Las zonas que tienen inventario, en el orden del recorrido. Se deriva de las
 * mismas unidades, así que una zona sin nada vendible no genera pestaña vacía.
 *
 * Recibe las unidades ya cargadas para no repetir la consulta: quien pinta las
 * pestañas es la misma página que pinta el inventario.
 */
export async function getUrbanizationZoneTabs(
  units?: UrbanizationUnit[],
): Promise<UrbanizationZoneTab[]> {
  const source = units ?? (await getUrbanizationUnitsData());
  const withInventory = new Set(
    source.map((u) => u.zoneId).filter((id): id is ZoneId => id !== null),
  );

  return phase1Zones
    .filter((zone) => withInventory.has(zone.id))
    .map((zone) => ({ id: zone.id, name: zoneInventoryName(zone.id) }));
}

const zoneInventoryName = (zoneId: ZoneId | undefined): string => {
  if (!zoneId) return "Sin zona asignada";
  const note = ZoneInventoryNote[zoneId];
  return note ? `${ZoneLabel[zoneId]} (${note})` : ZoneLabel[zoneId];
};

export async function getUrbanizationUnitsData(): Promise<UrbanizationUnit[]> {
  const db = await getDb();
  const dbUnits = await db
    .select()
    .from(units)
    .where(isNull(units.deletedAt));

  const dbUnitsMap = new Map(dbUnits.map((u) => [u.id, u]));
  const results: UrbanizationUnit[] = [];

  // 1. Manzanas y Lotes (Zona 1 y Zona 2 - 133 lotes)
  lotBlocks.forEach((block) => {
    // Sale de la manzana, no de un ternario: añadir una tercera zona con lotes
    // ya no exige tocar esto.
    const zoneId = block.zoneId ?? null;
    const zoneName = zoneInventoryName(block.zoneId);

    block.lots.forEach((lotNumber, index) => {
      const unitId = `lot:${block.id}-${lotNumber}`;
      const staticUnit = lotUnits.find((lu) => lu.id === unitId || lu.id === `${block.id}:lot-${lotNumber}`);
      const dbRecord = dbUnitsMap.get(unitId);

      let state: "AVAILABLE" | "RESERVED" | "SOLD" | "COMMON_AREA" = "AVAILABLE";
      if (dbRecord?.state) {
        state = dbRecord.state as any;
      } else if (staticUnit?.status === UnitStatus.SOLD) {
        state = "SOLD";
      } else if (staticUnit?.status === UnitStatus.RESERVED) {
        state = "RESERVED";
      }

      const fileNumber = block.firstFileNumber === undefined ? lotNumber : block.firstFileNumber + index;
      const cleanImg = staticUnit?.planImage || lotPlanImage(block.id, fileNumber);
      const measuredImg = staticUnit?.planImageMeasured || lotMeasuredPlanImage(block.id, fileNumber);

      results.push({
        id: unitId,
        zoneId,
        zoneName,
        kind: "lot",
        blockId: block.id,
        blockLetter: block.letter,
        lotNumber,
        lotPosition: staticUnit?.lotPosition === LotPosition.CORNER ? "Esquinera" : "Medianera",
        code: `Mz. ${block.letter} Lt. ${String(lotNumber).padStart(2, "0")}`,
        identifier: `Lote ${lotNumber}`,
        type: "Lote / Terreno",
        areaSqm: dbRecord?.areaSqm || staticUnit?.areaSqm || LOT_DEFAULT_AREA_SQM,
        state,
        buyerName: dbRecord?.buyerName || null,
        planImage: cleanImg ? getAssetUrl(cleanImg) : null,
        planImageMeasured: measuredImg ? getAssetUrl(measuredImg) : null,
        updatedAt: dbRecord?.updatedAt || null,
      });
    });
  });

  // 2. Torres A, B, C (Zona 3 - 60 departamentos + 3 terrazas)
  towers.forEach((tower) => {
    // Del catálogo de etiquetas y de la zona que declara la propia torre: una
    // cuarta torre, o un cambio de nombre, ya no pasa por aquí.
    const towerName = TowerLabel[tower.id];
    const towerZoneName = zoneInventoryName(tower.zoneId);

    tower.floors.forEach((floor) => {
      const isTerrace = floor.kind === TowerFloorKind.TERRACE;
      const floorName = isTerrace ? "Terraza / Azotea" : `Piso ${floor.level}`;

      floor.units.forEach((unit) => {
        const unitId = unit.id; // e.g. "tower-a:unit-101"
        const dbRecord = dbUnitsMap.get(unitId);

        let state: "AVAILABLE" | "RESERVED" | "SOLD" | "COMMON_AREA" = isTerrace ? "COMMON_AREA" : "AVAILABLE";
        if (dbRecord?.state) {
          state = dbRecord.state as any;
        }

        results.push({
          id: unitId,
          zoneId: tower.zoneId,
          zoneName: towerZoneName,
          kind: "apartment",
          towerId: tower.id,
          towerName,
          floorLevel: floor.level,
          floorName,
          floorId: floor.id,
          apartmentTypeId: unit.apartmentTypeId,
          apartmentTypeName: unit.apartmentTypeId
            ? ApartmentTypeLabel[unit.apartmentTypeId as ApartmentTypeId]
            : undefined,
          code: `${towerName} · Depa ${unit.identifier}`,
          identifier: unit.identifier,
          type: isTerrace ? "Área Común" : "Departamento Flat",
          areaSqm: dbRecord?.areaSqm || unit.areaSqm || APARTMENT_AREA_SQM,
          bedrooms: unit.bedrooms,
          bathrooms: unit.bathrooms,
          state,
          buyerName: dbRecord?.buyerName || null,
          tourUrl: unit.tourUrl || APARTMENT_TOUR_URL,
          gallery: (unit.gallery || []).map(getAssetUrl),
          updatedAt: dbRecord?.updatedAt || null,
        });
      });
    });
  });

  return results;
}

export async function updateUrbanizationUnitState(
  unitId: string,
  newState: "AVAILABLE" | "RESERVED" | "SOLD" | "COMMON_AREA",
  buyerName?: string | null,
  unitMeta?: {
    floorOrBlockId?: string;
    identifier?: string;
    areaSqm?: number;
    type?: string;
  }
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized: Debes iniciar sesión.");
  }

  const db = await getDb();
  const [existing] = await db.select().from(units).where(eq(units.id, unitId));

  const currentState = existing?.state || "AVAILABLE";

  const isReversion = (current: string, next: string) => {
    if (current === "SOLD" && (next === "RESERVED" || next === "AVAILABLE")) return true;
    if (current === "RESERVED" && next === "AVAILABLE") return true;
    if (current === "COMMON_AREA" && next !== "COMMON_AREA") return true;
    return false;
  };

  if (isReversion(currentState, newState)) {
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      throw new Error(
        "Unauthorized: Revertir el estado de una unidad reservada/vendida requiere autorización de Supervisor."
      );
    }
  }

  let updated;
  if (existing) {
    [updated] = await db
      .update(units)
      .set({
        state: newState,
        buyerName: buyerName !== undefined ? buyerName : existing.buyerName,
        updatedAt: new Date(),
      })
      .where(eq(units.id, unitId))
      .returning();
  } else {
    [updated] = await db
      .insert(units)
      .values({
        id: unitId,
        floorId: unitMeta?.floorOrBlockId || "urbanization",
        identifier: unitMeta?.identifier || unitId,
        type: unitMeta?.type || "UNIT",
        state: newState,
        buyerName: buyerName || null,
        areaSqm: unitMeta?.areaSqm || 0,
        updatedAt: new Date(),
      })
      .returning();
  }

  await logAction(db, session, "UPDATE", "unit", unitId, {
    identifier: unitMeta?.identifier || unitId,
    transition: `${currentState} -> ${newState}`,
    buyerName: buyerName || null,
    authorizedBy: session.user.name,
    role: session.user.role,
  });

  revalidatePath("/dashboard/units");
  revalidatePath("/", "layout");
  return updated;
}
