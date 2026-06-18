"use server";

import { getDb } from "@/lib/db";
import { globalSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getSetting(id: string) {
  const db = await getDb();
  const settingArr = await db.select().from(globalSettings).where(eq(globalSettings.id, id));
  
  if (settingArr.length === 0) {
    return null;
  }
  
  try {
    return JSON.parse(settingArr[0].config);
  } catch (e) {
    return settingArr[0].config;
  }
}

export async function updateSetting(id: string, config: any) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Only Super Admin can modify global settings");
  }

  const db = await getDb();
  const configString = typeof config === 'string' ? config : JSON.stringify(config);

  const existing = await db.select().from(globalSettings).where(eq(globalSettings.id, id));
  
  if (existing.length > 0) {
    await db.update(globalSettings)
      .set({ config: configString, updatedAt: new Date() })
      .where(eq(globalSettings.id, id));
  } else {
    await db.insert(globalSettings).values({
      id,
      config: configString,
    });
  }

  revalidatePath(`/dashboard/${id}`);
}
