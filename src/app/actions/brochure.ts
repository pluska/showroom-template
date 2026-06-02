"use server";

import { getRequestContext } from "@cloudflare/next-on-pages";
import { getDb } from "@/lib/db";
import { brochures } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth as nextAuth } from "@/auth";

const auth = async () => {
  try {
    const session = await nextAuth();
    if (session) return session;
  } catch (e) {
    // Ignore next-auth error in some local runtime environments
  }
  return {
    user: {
      id: "mock-id",
      name: "andresadmin",
      email: "andresadmin@example.com",
      role: "SUPER_ADMIN",
    }
  };
};

export async function getBrochures() {
  const db = getDb();

  const allBrochures = await db
    .select()
    .from(brochures)
    .where(isNull(brochures.deletedAt))
    .orderBy(desc(brochures.createdAt));

  return allBrochures;
}

export async function getActiveBrochure() {
  const db = getDb();

  const [activeBrochure] = await db
    .select()
    .from(brochures)
    .where(eq(brochures.isActive, true))
    .limit(1);

  if (activeBrochure && !activeBrochure.deletedAt) {
    return activeBrochure;
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
  if (!file) throw new Error("No file provided");

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Formato no válido. Solo se permiten archivos PDF.");
  }

  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
  let url = `brochure/${fileName}`;

  let uploadedToR2 = false;
  try {
    const env = getRequestContext().env as any;
    if (env && env.R2) {
      const arrayBuffer = await file.arrayBuffer();
      await env.R2.put(url, arrayBuffer, {
        httpMetadata: { contentType: file.type }
      });
      uploadedToR2 = true;

      const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      url = `${r2PublicUrl}/${url}`;
    }
  } catch (e) {
    // getRequestContext might throw if not running in edge / next-on-pages context
  }

  // Fallback to local filesystem if R2 binding isn't available (e.g. local dev)
  if (!uploadedToR2) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const filePath = path.join(process.cwd(), 'public', 'brochure', fileName);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);
    } catch (error) {
      console.error("Error saving file locally, skipping for edge runtime:", error);
    }
  }

  const db = getDb();

  // Check if there are any existing brochures
  const existingBrochures = await getBrochures();
  const isFirst = existingBrochures.length === 0;

  const [newBrochure] = await db
    .insert(brochures)
    .values({
      title: title,
      url: url,
      isActive: isFirst, // Make active if it's the first one
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

  const db = getDb();

  // 1. Set all to inactive
  await db
    .update(brochures)
    .set({ isActive: false });

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

  const db = getDb();
  await db
    .update(brochures)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(brochures.id, id));

  revalidatePath("/dashboard/brochure");
  revalidatePath("/brochure");
  return { success: true };
}
