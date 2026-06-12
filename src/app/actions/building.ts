"use server";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { getDb } from "@/lib/db";
import { buildingFaces } from "@/lib/db/schema";
import { eq, isNull, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getAssetUrl } from "@/utils/assets";

export interface BuildingFace {
  id: number;
  name: string;
  dayToNightTransition: string;
  nightToDayTransition: string;
  day: {
    background: string;
    backgroundVideo?: string;
    highlight?: string;
    introVideo?: string;
    transitions: {
      toLeft: string;
      toRight: string;
    };
  };
  night: {
    background: string;
    backgroundVideo?: string;
    highlight?: string;
    introVideo?: string;
    transitions: {
      toLeft: string;
      toRight: string;
    };
  };
}

function mapDbRowToBuildingFace(row: any): BuildingFace {
  const resolve = (path: string | null) => {
    if (!path) return "";
    return getAssetUrl(path);
  };
  const resolveOpt = (path: string | null) => {
    if (!path) return undefined;
    return getAssetUrl(path);
  };

  return {
    id: row.id,
    name: row.name,
    dayToNightTransition: resolve(row.dayToNightTransition),
    nightToDayTransition: resolve(row.nightToDayTransition),
    day: {
      background: resolve(row.dayBackground),
      backgroundVideo: resolveOpt(row.dayBackgroundVideo),
      highlight: resolveOpt(row.dayHighlight),
      introVideo: resolveOpt(row.dayIntroVideo),
      transitions: {
        toLeft: resolve(row.dayToLeftTransition),
        toRight: resolve(row.dayToRightTransition),
      }
    },
    night: {
      background: resolve(row.nightBackground),
      backgroundVideo: resolveOpt(row.nightBackgroundVideo),
      highlight: resolveOpt(row.nightHighlight),
      introVideo: resolveOpt(row.nightIntroVideo),
      transitions: {
        toLeft: resolve(row.nightToLeftTransition),
        toRight: resolve(row.nightToRightTransition),
      }
    }
  };
}

const defaultFacesSeed = [
  {
    id: 1,
    name: "Cara Central",
    dayBackground: "building/photos/face_0_daylight.png",
    dayBackgroundVideo: "building/videos/face_0_daylight.mp4",
    dayIntroVideo: "videos/walks/walk_center_daylight.mp4",
    dayToLeftTransition: "building/transitions/trans_0_to_2_daylight.mp4",
    dayToRightTransition: "building/transitions/trans_0_to_1_daylight.mp4",
    nightBackground: "building/photos/face_0_nightlight.png",
    nightBackgroundVideo: "building/videos/face_0_nightlight.mp4",
    nightIntroVideo: "videos/walks/walk_center_nightlight.mp4",
    nightToLeftTransition: "building/transitions/trans_0_to_2_nightlight.mp4",
    nightToRightTransition: "building/transitions/trans_0_to_1_nightlight.mp4",
    dayToNightTransition: "building/transitions/trans_0_day_to_night.mp4",
    nightToDayTransition: "building/transitions/trans_0_night_to_day.mp4",
    order: 0,
  },
  {
    id: 2,
    name: "Cara Derecha",
    dayBackground: "building/photos/face_1_daylight.png",
    dayIntroVideo: "videos/walks/walk_right_daylight.mp4",
    dayToLeftTransition: "building/transitions/trans_1_to_0_daylight.mp4",
    dayToRightTransition: "building/transitions/trans_1_to_0_daylight.mp4",
    nightBackground: "building/photos/face_1_nightlight.png",
    nightIntroVideo: "videos/walks/walk_right_nightlight.mp4",
    nightToLeftTransition: "building/transitions/trans_1_to_0_nightlight.mp4",
    nightToRightTransition: "building/transitions/trans_1_to_0_nightlight.mp4",
    dayToNightTransition: "building/transitions/trans_1_day_to_night.mp4",
    nightToDayTransition: "building/transitions/trans_1_night_to_day.mp4",
    order: 1,
  },
  {
    id: 3,
    name: "Cara Izquierda",
    dayBackground: "building/photos/face_2_daylight.png",
    dayIntroVideo: "videos/walks/walk_left_daylight.mp4",
    dayToLeftTransition: "building/transitions/trans_2_to_0_daylight.mp4",
    dayToRightTransition: "building/transitions/trans_2_to_0_daylight.mp4",
    nightBackground: "building/photos/face_2_nightlight.png",
    nightIntroVideo: "videos/walks/walk_left_nightlight.mp4",
    nightToLeftTransition: "building/transitions/trans_2_to_0_nightlight.mp4",
    nightToRightTransition: "building/transitions/trans_2_to_0_nightlight.mp4",
    dayToNightTransition: "building/transitions/trans_2_day_to_night.mp4",
    nightToDayTransition: "building/transitions/trans_2_night_to_day.mp4",
    order: 2,
  }
];

export async function getBuildingFacesData(): Promise<BuildingFace[]> {
  const db = getDb();
  
  let rows = await db
    .select()
    .from(buildingFaces)
    .where(isNull(buildingFaces.deletedAt))
    .orderBy(asc(buildingFaces.order));

  // Check if we need to auto-seed
  if (rows.length === 0) {
    const allRows = await db.select().from(buildingFaces);
    if (allRows.length === 0) {
      try {
        await db.insert(buildingFaces).values(defaultFacesSeed);
        rows = await db
          .select()
          .from(buildingFaces)
          .where(isNull(buildingFaces.deletedAt))
          .orderBy(asc(buildingFaces.order));
      } catch (e) {
        console.error("Error seeding building faces:", e);
        // Fallback mockup mapping in case DB seeding fails in this environment
        return defaultFacesSeed.map(mapDbRowToBuildingFace);
      }
    }
  }

  return rows.map(mapDbRowToBuildingFace);
}

export async function getRawBuildingFaces() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede ver caras del edificio en el panel.");
  }

  const db = getDb();
  
  let rows = await db
    .select()
    .from(buildingFaces)
    .where(isNull(buildingFaces.deletedAt))
    .orderBy(asc(buildingFaces.order));

  if (rows.length === 0) {
    // Force seed check
    await getBuildingFacesData();
    rows = await db
      .select()
      .from(buildingFaces)
      .where(isNull(buildingFaces.deletedAt))
      .orderBy(asc(buildingFaces.order));
  }

  return rows;
}

export async function createBuildingFace(data: any) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede crear caras.");
  }

  const db = getDb();

  // Find max order to assign to the new face
  const existing = await db
    .select()
    .from(buildingFaces)
    .where(isNull(buildingFaces.deletedAt))
    .orderBy(asc(buildingFaces.order));
  
  const nextOrder = existing.length > 0 ? existing[existing.length - 1].order + 1 : 0;

  const [newFace] = await db
    .insert(buildingFaces)
    .values({
      name: data.name,
      dayBackground: data.dayBackground || null,
      dayBackgroundVideo: data.dayBackgroundVideo || null,
      dayHighlight: data.dayHighlight || null,
      dayIntroVideo: data.dayIntroVideo || null,
      dayToLeftTransition: data.dayToLeftTransition || null,
      dayToRightTransition: data.dayToRightTransition || null,
      nightBackground: data.nightBackground || null,
      nightBackgroundVideo: data.nightBackgroundVideo || null,
      nightHighlight: data.nightHighlight || null,
      nightIntroVideo: data.nightIntroVideo || null,
      nightToLeftTransition: data.nightToLeftTransition || null,
      nightToRightTransition: data.nightToRightTransition || null,
      dayToNightTransition: data.dayToNightTransition || null,
      nightToDayTransition: data.nightToDayTransition || null,
      order: nextOrder,
    })
    .returning();

  revalidatePath("/dashboard/building");
  revalidatePath("/showroom");
  return newFace;
}

export async function updateBuildingFace(id: number, data: any) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede actualizar caras.");
  }

  const db = getDb();

  const [updatedFace] = await db
    .update(buildingFaces)
    .set({
      name: data.name,
      dayBackground: data.dayBackground || null,
      dayBackgroundVideo: data.dayBackgroundVideo || null,
      dayHighlight: data.dayHighlight || null,
      dayIntroVideo: data.dayIntroVideo || null,
      dayToLeftTransition: data.dayToLeftTransition || null,
      dayToRightTransition: data.dayToRightTransition || null,
      nightBackground: data.nightBackground || null,
      nightBackgroundVideo: data.nightBackgroundVideo || null,
      nightHighlight: data.nightHighlight || null,
      nightIntroVideo: data.nightIntroVideo || null,
      nightToLeftTransition: data.nightToLeftTransition || null,
      nightToRightTransition: data.nightToRightTransition || null,
      dayToNightTransition: data.dayToNightTransition || null,
      nightToDayTransition: data.nightToDayTransition || null,
      updatedAt: new Date(),
    })
    .where(eq(buildingFaces.id, id))
    .returning();

  revalidatePath("/dashboard/building");
  revalidatePath("/showroom");
  return updatedFace;
}

export async function deleteBuildingFace(id: number) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede eliminar caras.");
  }

  const db = getDb();
  const now = new Date();

  // Soft delete the face
  await db
    .update(buildingFaces)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(buildingFaces.id, id));

  // Re-order remaining faces to ensure consecutive order starting at 0
  const remaining = await db
    .select()
    .from(buildingFaces)
    .where(isNull(buildingFaces.deletedAt))
    .orderBy(asc(buildingFaces.order));

  for (let i = 0; i < remaining.length; i++) {
    await db
      .update(buildingFaces)
      .set({ order: i })
      .where(eq(buildingFaces.id, remaining[i].id));
  }

  revalidatePath("/dashboard/building");
  revalidatePath("/showroom");
  return { success: true };
}

export async function reorderBuildingFaces(orderedIds: number[]) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede ordenar las caras.");
  }

  const db = getDb();

  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(buildingFaces)
      .set({ order: i, updatedAt: new Date() })
      .where(eq(buildingFaces.id, orderedIds[i]));
  }

  revalidatePath("/dashboard/building");
  revalidatePath("/showroom");
  return { success: true };
}

export async function uploadBuildingAsset(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede subir recursos.");
  }

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  const urlPath = `building/assets/${fileName}`;

  let uploadedToR2 = false;
  let finalUrl = "";

  try {
    const env = getRequestContext().env as any;
    if (env && env.R2) {
      const arrayBuffer = await file.arrayBuffer();
      await env.R2.put(urlPath, arrayBuffer, {
        httpMetadata: { contentType: file.type }
      });
      uploadedToR2 = true;

      const isDev = process.env.NODE_ENV === 'development';
      const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      
      if (isDev) {
        finalUrl = `/api/r2/${urlPath}`;
      } else {
        finalUrl = `${r2PublicUrl}/${urlPath}`;
      }
    }
  } catch (e) {
    console.error("R2 upload error", e);
  }

  if (!uploadedToR2) {
    throw new Error("No se pudo subir a R2. Verifica tu configuración de Cloudflare Pages / bindings de R2.");
  }

  return { url: finalUrl };
}
