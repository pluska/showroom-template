"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { eq, isNull, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getMedia(category?: string) {
  const db = await getDb();

  const query = db.select().from(media).where(
    category 
      ? and(isNull(media.deletedAt), eq(media.category, category))
      : isNull(media.deletedAt)
  ).orderBy(desc(media.createdAt));

  const allMedia = await query;
  return allMedia;
}

export async function getActiveMedia(category: string) {
  const db = await getDb();

  const activeMediaList = await db
    .select()
    .from(media)
    .where(and(eq(media.isActive, true), eq(media.category, category), isNull(media.deletedAt)));

  return activeMediaList;
}

export async function uploadMedia(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede subir multimedia.");
  }

  const file = formData.get("file") as File;
  const title = formData.get("title") as string || "Multimedia";
  const category = formData.get("category") as string || "EXTRA";

  if (!file) throw new Error("No file provided");

  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  let url = `media/${category.toLowerCase()}/${fileName}`;

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

  // Eliminamos el fallback a fs/promises ya que Next.js Edge Runtime no permite compilar módulos de Node.js, 
  // incluso si están dentro de un try/catch o import() dinámico.
  // En Cloudflare Pages / Wrangler local, se debe usar R2 (que tiene un binding local automático).
  if (!uploadedToR2) {
    throw new Error("No se pudo subir a R2. Verifica tu configuración de Cloudflare Pages / bindings de R2.");
  }

  const db = await getDb();
  
  // For VIDEO_SIDEBAR and VIDEO_PORTADA we only want one active. For amenities we can have multiple.
  let shouldBeActive = false;
  if (category === "VIDEO_SIDEBAR" || category === "VIDEO_PORTADA") {
      const existing = await getMedia(category);
      shouldBeActive = existing.length === 0;
  } else if (category === "AMENITIES_GALLERY") {
      shouldBeActive = true; // default to active for amenities
  }

  const [newMedia] = await db
    .insert(media)
    .values({
      title: title,
      url: url,
      type: file.type,
      category: category,
      isActive: shouldBeActive, 
    })
    .returning();

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/video-amenities");
  revalidatePath("/video");
  revalidatePath("/galeria");
  return newMedia;
}

export async function toggleMediaActive(id: string, active: boolean, category: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede cambiar el estado.");
  }

  const db = await getDb();

  // If we are activating a VIDEO_SIDEBAR or VIDEO_PORTADA, deactivate others
  if ((category === "VIDEO_SIDEBAR" || category === "VIDEO_PORTADA") && active) {
    await db
      .update(media)
      .set({ isActive: false })
      .where(eq(media.category, category));
  }

  const [updated] = await db
    .update(media)
    .set({ isActive: active })
    .where(eq(media.id, id))
    .returning();

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/video-amenities");
  revalidatePath("/video");
  revalidatePath("/galeria");
  return updated;
}

export async function deleteMedia(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede eliminar multimedia.");
  }

  // En un mundo real, para EXTRA content, tal vez validar si es SUPER_ADMIN, 
  // pero mantendremos la lógica simple de que cualquier admin puede borrar (o ajustar según requieras).

  const db = await getDb();
  await db
    .update(media)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(media.id, id));

  revalidatePath("/dashboard/media");
  revalidatePath("/dashboard/video-amenities");
  revalidatePath("/video");
  revalidatePath("/galeria");
  return { success: true };
}
