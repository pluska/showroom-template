"use server";

import { getDb } from "@/lib/db";
import { globalSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

const SETTING_ID = "booking_enabled";

/**
 * ¿Está habilitado el agendamiento de citas en la web pública?
 *
 * Lectura sin autenticación: la página de contacto la consulta para decidir si
 * muestra "Fija una cita con nosotros". Por defecto viene DESACTIVADO, de modo
 * que un proyecto recién montado no ofrece citas hasta que alguien configure
 * la disponibilidad de los asesores.
 */
export async function getBookingEnabled(): Promise<boolean> {
  try {
    const db = await getDb();
    const [row] = await db.select().from(globalSettings).where(eq(globalSettings.id, SETTING_ID));
    if (!row) return false;
    return JSON.parse(row.config) === true;
  } catch (error) {
    console.error("Error leyendo booking_enabled:", error);
    return false;
  }
}

/**
 * Activa o desactiva las citas. A diferencia de updateSetting (que exige
 * SUPER_ADMIN), un ADMIN también puede cambiarlo: es una decisión comercial
 * del día a día, no un ajuste estructural del sitio.
 */
export async function setBookingEnabled(enabled: boolean) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "SUPER_ADMIN" && role !== "ADMIN")) {
    throw new Error("Unauthorized: solo un administrador puede cambiar esta opción.");
  }

  const db = await getDb();
  const config = JSON.stringify(enabled);
  const [existing] = await db.select().from(globalSettings).where(eq(globalSettings.id, SETTING_ID));

  if (existing) {
    await db.update(globalSettings).set({ config, updatedAt: new Date() }).where(eq(globalSettings.id, SETTING_ID));
  } else {
    await db.insert(globalSettings).values({ id: SETTING_ID, config });
  }

  revalidatePath("/contact");
  revalidatePath("/dashboard/calendar");
  return { success: true, enabled };
}
