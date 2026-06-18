"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { brochures } from "@/lib/db/schema";
import { eq, isNull, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getBrochures() {
  const db = await getDb();

  const allBrochures = await db
    .select()
    .from(brochures)
    .where(isNull(brochures.deletedAt))
    .orderBy(desc(brochures.createdAt));

  return allBrochures;
}

export async function getActiveBrochure(unitId?: string) {
  const db = await getDb();

  if (unitId) {
    const [unitBrochure] = await db
      .select()
      .from(brochures)
      .where(and(
        eq(brochures.type, 'UNIT'),
        eq(brochures.unitId, unitId),
        eq(brochures.isActive, true),
        isNull(brochures.deletedAt)
      ))
      .limit(1);

    if (unitBrochure) {
      return unitBrochure;
    }
  }

  const [generalBrochure] = await db
    .select()
    .from(brochures)
    .where(and(
      eq(brochures.type, 'GENERAL'),
      eq(brochures.isActive, true),
      isNull(brochures.deletedAt)
    ))
    .limit(1);

  if (generalBrochure) {
    return generalBrochure;
  }
  return null;
}

export async function uploadBrochure(formData: FormData) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden subir brochures.");
  }

  const file = formData.get("file") as File;
  const title = formData.get("title") as string || "Brochure";
  const type = (formData.get("type") as string) || "GENERAL";
  const unitId = formData.get("unitId") as string | null;

  if (!file) throw new Error("No file provided");
  if (type === "UNIT" && !unitId) throw new Error("Debes proporcionar un ID de unidad para un brochure por unidad.");

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Formato no válido. Solo se permiten archivos PDF.");
  }

  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  let url = `brochure/${fileName}`;

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
        url = `/api/r2/${url}`;
      } else {
        url = `${r2PublicUrl}/${url}`;
      }
    }
  } catch (e) {
    // getRequestContext might throw if not running in edge / next-on-pages context
  }

  // Fallback eliminados por compatibilidad con Edge Runtime. Todo uso debe ser mediante R2.
  if (!uploadedToR2) {
    throw new Error("No se pudo subir a R2. Verifica tu configuración de Cloudflare Pages.");
  }

  const db = await getDb();

  // Check if there are any existing brochures for this type
  const existingBrochures = await getBrochures();
  let isFirst = false;

  if (type === 'GENERAL') {
    isFirst = existingBrochures.filter(b => b.type === 'GENERAL').length === 0;
  } else if (type === 'UNIT' && unitId) {
    // Si es por unidad, revisamos si ya hay uno para esa unidad (incluso eliminado).
    const conflicting = await db.select().from(brochures).where(
      and(
        eq(brochures.type, 'UNIT'),
        eq(brochures.unitId, unitId)
      )
    );
    for (const b of conflicting) {
      await db.update(brochures).set({ deletedAt: new Date(), isActive: false, unitId: null }).where(eq(brochures.id, b.id));
    }
    isFirst = true; // El nuevo brochure por unidad siempre será activo por defecto
  }

  const [newBrochure] = await db
    .insert(brochures)
    .values({
      title: title,
      url: url,
      type: type,
      unitId: type === 'UNIT' ? unitId : null,
      isActive: isFirst,
    })
    .returning();

  revalidatePath("/dashboard/brochure");
  revalidatePath("/brochure"); // if there is a public brochure page
  return newBrochure;
}

export async function setActiveBrochure(id: string) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden cambiar el brochure activo.");
  }

  const db = await getDb();

  const [targetBrochure] = await db.select().from(brochures).where(eq(brochures.id, id)).limit(1);
  if (!targetBrochure) throw new Error("Brochure no encontrado");

  // 1. Set all of same type (and unitId if UNIT) to inactive
  if (targetBrochure.type === 'GENERAL') {
    await db
      .update(brochures)
      .set({ isActive: false })
      .where(eq(brochures.type, 'GENERAL'));
  } else if (targetBrochure.type === 'UNIT') {
    await db
      .update(brochures)
      .set({ isActive: false })
      .where(and(eq(brochures.type, 'UNIT'), eq(brochures.unitId, targetBrochure.unitId!)));
  }

  // 2. Set the target to active
  const [updated] = await db
    .update(brochures)
    .set({ isActive: true })
    .where(eq(brochures.id, id))
    .returning();

  revalidatePath("/dashboard/brochure");
  revalidatePath("/brochure");
  return updated;
}

export async function deleteBrochure(id: string) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden eliminar brochures.");
  }

  const db = await getDb();
  await db
    .update(brochures)
    .set({ deletedAt: new Date(), isActive: false, unitId: null })
    .where(eq(brochures.id, id));

  revalidatePath("/dashboard/brochure");
  revalidatePath("/brochure");
  return { success: true };
}

export async function updateBrochure(id: string, formData: FormData) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden actualizar brochures.");
  }

  const db = await getDb();
  const [existingBrochure] = await db.select().from(brochures).where(eq(brochures.id, id)).limit(1);
  if (!existingBrochure) throw new Error("Brochure no encontrado.");

  const title = formData.get("title") as string || existingBrochure.title;
  const type = (formData.get("type") as string) || existingBrochure.type;
  const unitId = formData.get("unitId") as string | null;

  if (type === "UNIT" && !unitId) throw new Error("Debes proporcionar un ID de unidad para un brochure por unidad.");

  const file = formData.get("file") as File | null;
  let url = existingBrochure.url;

  if (file && file.size > 0) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      throw new Error("Formato no válido. Solo se permiten archivos PDF.");
    }

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    let newUrl = `brochure/${fileName}`;

    let uploadedToR2 = false;
    try {
      const { env } = await getCloudflareContext({ async: true }) as any;
      if (env && env.R2) {
        const arrayBuffer = await file.arrayBuffer();
        await env.R2.put(newUrl, arrayBuffer, {
          httpMetadata: { contentType: file.type }
        });
        uploadedToR2 = true;

        const isDev = process.env.NODE_ENV === 'development';
        const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        
        if (isDev) {
          newUrl = `/api/r2/${newUrl}`;
        } else {
          newUrl = `${r2PublicUrl}/${newUrl}`;
        }
      }
    } catch (e) {
      // ignore
    }

    if (!uploadedToR2) {
      throw new Error("No se pudo subir a R2.");
    }
    url = newUrl;
  }

  // Handle unique constraints
  if (type === 'UNIT' && unitId) {
    // Si la unidad ya tiene un brochure (activo o eliminado), lo desactivamos y liberamos el unitId
    // para evitar fallos del unique constraint.
    const conflicting = await db.select().from(brochures).where(
      and(
        eq(brochures.type, 'UNIT'),
        eq(brochures.unitId, unitId)
      )
    );
    for (const b of conflicting) {
      if (b.id !== id) {
        await db.update(brochures)
          .set({ deletedAt: new Date(), isActive: false, unitId: null })
          .where(eq(brochures.id, b.id));
      }
    }
  }

  const [updatedBrochure] = await db
    .update(brochures)
    .set({
      title,
      url,
      type,
      unitId: type === 'UNIT' ? unitId : null,
    })
    .where(eq(brochures.id, id))
    .returning();

  revalidatePath("/dashboard/brochure");
  revalidatePath("/brochure");
  return updatedBrochure;
}
