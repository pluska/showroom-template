"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { tours, units, floors } from "@/lib/db/schema";
import { eq, and, isNull, desc, ne, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getToursAdmin() {
  const db = await getDb();

  return await db
    .select({
      id: tours.id,
      title: tours.title,
      subtitle: tours.subtitle,
      thumbnailUrl: tours.thumbnailUrl,
      type: tours.type,
      targetUrl: tours.targetUrl,
      unitId: tours.unitId,
      isActive: tours.isActive,
      order: tours.order,
      createdAt: tours.createdAt,
      unitIdentifier: units.identifier,
      floorName: floors.name,
    })
    .from(tours)
    .leftJoin(units, eq(tours.unitId, units.id))
    .leftJoin(floors, eq(units.floorId, floors.id))
    .where(isNull(tours.deletedAt))
    .orderBy(asc(tours.order), desc(tours.createdAt));
}

export async function getToursPublic() {
  const db = await getDb();

  return await db
    .select({
      id: tours.id,
      title: tours.title,
      subtitle: tours.subtitle,
      thumbnailUrl: tours.thumbnailUrl,
      type: tours.type,
      targetUrl: tours.targetUrl,
      unitId: tours.unitId,
      isActive: tours.isActive,
      order: tours.order,
      createdAt: tours.createdAt,
      unitIdentifier: units.identifier,
      floorName: floors.name,
    })
    .from(tours)
    .leftJoin(units, eq(tours.unitId, units.id))
    .leftJoin(floors, eq(units.floorId, floors.id))
    .where(and(eq(tours.isActive, true), isNull(tours.deletedAt)))
    .orderBy(asc(tours.order), desc(tours.createdAt));
}

export async function uploadTour(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede crear recorridos.");
  }

  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const subtitle = formData.get("subtitle") as string || null;
  const type = formData.get("type") as "building" | "unit" || "building";
  const targetUrl = formData.get("targetUrl") as string;
  const unitId = formData.get("unitId") as string || null;
  const existingThumbnailUrl = formData.get("existingThumbnailUrl") as string || null;
  const order = Number(formData.get("order")) || 0;

  if (!title) throw new Error("El título es obligatorio.");
  if (!targetUrl) throw new Error("La URL del recorrido es obligatoria.");

  let thumbnailUrl = existingThumbnailUrl;

  // Si subieron un archivo nuevo de imagen de portada
  if (file && file.size > 0) {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    let url = `tours/thumbnails/${fileName}`;

    let uploadedToR2 = false;
    try {
      const { env } = await getCloudflareContext({ async: true }) as any;
      if (env && env.R2) {
        const arrayBuffer = await file.arrayBuffer();
        await env.R2.put(url, arrayBuffer, {
          httpMetadata: { contentType: file.type }
        });
        uploadedToR2 = true;

        const isDev = process.env.NODE_ENV === 'development';
        const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        
        if (isDev) {
          thumbnailUrl = `/api/r2/${url}`;
        } else {
          thumbnailUrl = `${r2PublicUrl}/${url}`;
        }
      }
    } catch (e) {
      // getRequestContext error fallback
    }

    if (!uploadedToR2) {
      throw new Error("No se pudo subir la portada a R2. Verifica la configuración.");
    }
  }

  if (!thumbnailUrl) {
    throw new Error("Debe subir una portada o seleccionar una imagen existente.");
  }

  const db = await getDb();

  // Si se selecciona tipo 'unit' y se asigna a una unidad
  let finalUnitId = type === "unit" ? unitId : null;

  if (finalUnitId) {
    // Para garantizar restricción 1-a-1: Si otra tour ya estaba vinculada a esta unidad, la desvinculamos o limpiamos.
    // También limpiamos el tour anterior de la base de datos si lo hubiera.
    await db
      .update(tours)
      .set({ unitId: null })
      .where(eq(tours.unitId, finalUnitId));
  }

  const [newTour] = await db
    .insert(tours)
    .values({
      title,
      subtitle,
      thumbnailUrl,
      type,
      targetUrl,
      unitId: finalUnitId,
      order,
      isActive: true,
    })
    .returning();

  // Sincronizar con la tabla units
  if (finalUnitId) {
    await db
      .update(units)
      .set({ tourUrl: targetUrl })
      .where(eq(units.id, finalUnitId));
  }

  revalidatePath("/dashboard/tours");
  revalidatePath("/recorridos");
  return newTour;
}

export async function updateTour(id: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede editar recorridos.");
  }

  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string;
  const subtitle = formData.get("subtitle") as string || null;
  const type = formData.get("type") as "building" | "unit" || "building";
  const targetUrl = formData.get("targetUrl") as string;
  const unitId = formData.get("unitId") as string || null;
  const existingThumbnailUrl = formData.get("existingThumbnailUrl") as string || null;
  const order = Number(formData.get("order")) || 0;

  if (!title) throw new Error("El título es obligatorio.");
  if (!targetUrl) throw new Error("La URL del recorrido es obligatoria.");

  const db = await getDb();

  // Obtener el recorrido actual
  const [currentTour] = await db
    .select()
    .from(tours)
    .where(eq(tours.id, id));

  if (!currentTour) throw new Error("Recorrido no encontrado.");

  let thumbnailUrl = currentTour.thumbnailUrl;

  // Si hay una nueva imagen
  if (file && file.size > 0) {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    let url = `tours/thumbnails/${fileName}`;

    let uploadedToR2 = false;
    try {
      const { env } = await getCloudflareContext({ async: true }) as any;
      if (env && env.R2) {
        const arrayBuffer = await file.arrayBuffer();
        await env.R2.put(url, arrayBuffer, {
          httpMetadata: { contentType: file.type }
        });
        uploadedToR2 = true;

        const isDev = process.env.NODE_ENV === 'development';
        const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        
        if (isDev) {
          thumbnailUrl = `/api/r2/${url}`;
        } else {
          thumbnailUrl = `${r2PublicUrl}/${url}`;
        }
      }
    } catch (e) {
      // fallback
    }

    if (!uploadedToR2) {
      throw new Error("No se pudo subir la portada a R2. Verifica la configuración.");
    }
  } else if (existingThumbnailUrl) {
    thumbnailUrl = existingThumbnailUrl;
  }

  let finalUnitId = type === "unit" ? unitId : null;

  // Si cambió la unidad asignada:
  // 1. Limpiar la unidad anterior
  if (currentTour.unitId && currentTour.unitId !== finalUnitId) {
    await db
      .update(units)
      .set({ tourUrl: "" })
      .where(eq(units.id, currentTour.unitId));
  }

  // 2. Si otra tour ya estaba vinculada a esta nueva unidad, la desvinculamos
  if (finalUnitId) {
    await db
      .update(tours)
      .set({ unitId: null })
      .where(and(eq(tours.unitId, finalUnitId), ne(tours.id, id)));
  }

  // Actualizar el recorrido
  const [updatedTour] = await db
    .update(tours)
    .set({
      title,
      subtitle,
      thumbnailUrl,
      type,
      targetUrl,
      unitId: finalUnitId,
      order,
      updatedAt: new Date(),
    })
    .where(eq(tours.id, id))
    .returning();

  // 3. Establecer la nueva unidad
  if (finalUnitId) {
    await db
      .update(units)
      .set({ tourUrl: targetUrl })
      .where(eq(units.id, finalUnitId));
  }

  revalidatePath("/dashboard/tours");
  revalidatePath("/recorridos");
  return updatedTour;
}

export async function toggleTourActive(id: string, active: boolean) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede alternar el estado.");
  }

  const db = await getDb();

  const [updated] = await db
    .update(tours)
    .set({ isActive: active, updatedAt: new Date() })
    .where(eq(tours.id, id))
    .returning();

  revalidatePath("/dashboard/tours");
  revalidatePath("/recorridos");
  return updated;
}

export async function deleteTour(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede eliminar recorridos.");
  }

  const db = await getDb();

  // Obtener el recorrido actual
  const [tour] = await db
    .select()
    .from(tours)
    .where(eq(tours.id, id));

  if (!tour) throw new Error("Recorrido no encontrado.");

  // Soft delete en tours
  await db
    .update(tours)
    .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
    .where(eq(tours.id, id));

  // Limpiar tourUrl en la unidad asociada si la tenía
  if (tour.unitId) {
    await db
      .update(units)
      .set({ tourUrl: "" })
      .where(eq(units.id, tour.unitId));
  }

  revalidatePath("/dashboard/tours");
  revalidatePath("/recorridos");
  return { success: true };
}
