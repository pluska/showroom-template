"use server";

import { getDb } from "@/lib/db";
import { canvasTemplates } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { auth } from "@/auth";

// Verificar si el rol es SUPER_ADMIN o ADMIN
async function verifyAdminAccess() {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  const role = session.user.role as string;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    throw new Error("Unauthorized: Solo administradores tienen acceso a este módulo.");
  }
  return session.user;
}

export type CanvasTemplateLayout = {
  version: number;
  texts: Array<{ text: string; color: string; fontSize: number; x: number; y: number }>;
};

export async function getCanvasTemplates() {
  await verifyAdminAccess();
  const db = await getDb();

  return await db
    .select()
    .from(canvasTemplates)
    .where(isNull(canvasTemplates.deletedAt))
    .orderBy(desc(canvasTemplates.createdAt));
}

export async function createCanvasTemplate(
  name: string,
  width: number,
  height: number,
  aspectRatio: string,
  layout: CanvasTemplateLayout
) {
  const user = await verifyAdminAccess();
  const db = await getDb();

  const [created] = await db
    .insert(canvasTemplates)
    .values({
      name: name.trim(),
      width,
      height,
      aspectRatio,
      layout,
      createdBy: user.id as string,
    })
    .returning();

  return created;
}

export async function deleteCanvasTemplate(id: string) {
  await verifyAdminAccess();
  const db = await getDb();

  await db
    .update(canvasTemplates)
    .set({ deletedAt: new Date() })
    .where(eq(canvasTemplates.id, id));

  return { success: true };
}
