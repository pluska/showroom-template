"use server";

import { getDb } from "@/lib/db";
import { constructionProgress } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getProgressUpdates() {
  const db = await getDb();
  
  // Fetch active progress updates ordered by date descending
  let updates = await db
    .select()
    .from(constructionProgress)
    .where(isNull(constructionProgress.deletedAt))
    .orderBy(desc(constructionProgress.date));

  // Auto-seed if the table is completely empty (no rows, even soft-deleted ones)
  const allUpdates = await db.select().from(constructionProgress);
  if (allUpdates.length === 0) {
    try {
      await db.insert(constructionProgress).values([
        {
          id: "mock-1",
          title: "Avance de Obra - Marzo",
          date: new Date(2026, 2, 1), // March 2026
          mediaUrl: "progress/march_2026.mp4",
          description: "Registro visual de los avances logrados durante el mes de marzo en Thompson Pueblo Libre.",
        },
        {
          id: "mock-2",
          title: "Avance de Obra - Abril",
          date: new Date(2026, 3, 1), // April 2026
          mediaUrl: "progress/april_2026.mp4",
          description: "Continuamos con el progreso de la edificación, mostrando los hitos alcanzados en el mes de abril.",
        }
      ]);

      // Query again
      updates = await db
        .select()
        .from(constructionProgress)
        .where(isNull(constructionProgress.deletedAt))
        .orderBy(desc(constructionProgress.date));
    } catch (e) {
      console.error("Error seeding initial construction progress updates:", e);
      // Fail-safe mock return for local development
      return [
        {
          id: "mock-2",
          title: "Avance de Obra - Abril",
          date: new Date(2026, 3, 1),
          mediaUrl: "progress/april_2026.mp4",
          description: "Continuamos con el progreso de la edificación, mostrando los hitos alcanzados en el mes de abril.",
          createdAt: new Date(),
          deletedAt: null,
        },
        {
          id: "mock-1",
          title: "Avance de Obra - Marzo",
          date: new Date(2026, 2, 1),
          mediaUrl: "progress/march_2026.mp4",
          description: "Registro visual de los avances logrados durante el mes de marzo en Thompson Pueblo Libre.",
          createdAt: new Date(),
          deletedAt: null,
        }
      ];
    }
  }

  return updates;
}

export async function createProgressUpdate(data: {
  title: string;
  year: number;
  month: number;
  mediaUrl: string;
  description?: string;
}) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden crear avances de obra.");
  }

  const db = await getDb();
  const dateVal = new Date(data.year, data.month - 1, 1);

  const [newUpdate] = await db
    .insert(constructionProgress)
    .values({
      title: data.title,
      date: dateVal,
      mediaUrl: data.mediaUrl,
      description: data.description || "",
    })
    .returning();

  revalidatePath("/dashboard/progress");
  revalidatePath("/avance-de-obra");
  return newUpdate;
}

export async function updateProgressUpdate(
  id: string,
  data: {
    title: string;
    year: number;
    month: number;
    mediaUrl: string;
    description?: string;
  }
) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden editar avances de obra.");
  }

  const db = await getDb();
  const dateVal = new Date(data.year, data.month - 1, 1);

  const [updatedUpdate] = await db
    .update(constructionProgress)
    .set({
      title: data.title,
      date: dateVal,
      mediaUrl: data.mediaUrl,
      description: data.description || "",
    })
    .where(eq(constructionProgress.id, id))
    .returning();

  revalidatePath("/dashboard/progress");
  revalidatePath("/avance-de-obra");
  return updatedUpdate;
}

export async function deleteProgressUpdate(id: string) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden eliminar avances de obra.");
  }

  const db = await getDb();
  await db
    .update(constructionProgress)
    .set({ deletedAt: new Date() })
    .where(eq(constructionProgress.id, id));

  revalidatePath("/dashboard/progress");
  revalidatePath("/avance-de-obra");
  return { success: true };
}

export async function uploadMedia(formData: FormData) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden subir archivos.");
  }

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  // MOCK R2 UPLOAD
  // In a real scenario, you would use aws-sdk to upload `file` to Cloudflare R2
  // and return the public URL.
  // const arrayBuffer = await file.arrayBuffer();
  // ... upload to R2 ...
  
  // For now, return a mock URL
  return `progress/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
}
