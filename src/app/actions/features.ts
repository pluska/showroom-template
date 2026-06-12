"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSetting, updateSetting } from "@/app/actions/settings";
import defaultFeaturesJson from "@/data/features.json";

export type SidebarFeature = {
  id: string;
  icon: string;
  label: string;
  path: string;
  preloadKey?: string;
  action?: string;
  active: boolean;
};

const defaultSidebarFeatures = defaultFeaturesJson as SidebarFeature[];

import { connection } from "next/server";

export async function getFeatures(): Promise<SidebarFeature[]> {
  await connection();
  try {
    let dbFeatures = await getSetting("sidebar_features_list");
    
    // Seed database if not existing
    if (!dbFeatures || !Array.isArray(dbFeatures) || dbFeatures.length === 0) {
      await updateSetting("sidebar_features_list", defaultSidebarFeatures);
      dbFeatures = defaultSidebarFeatures;
    } else {
      // Ensure all default features exist in dbFeatures (such as new features added later)
      let changed = false;
      defaultSidebarFeatures.forEach(defaultFeat => {
        const exists = dbFeatures.some((f: SidebarFeature) => f.id === defaultFeat.id);
        if (!exists) {
          dbFeatures.push(defaultFeat);
          changed = true;
        }
      });
      if (changed) {
        await updateSetting("sidebar_features_list", dbFeatures);
      }
    }
    
    // Si no hay video, esconde la opción en el sidebar
    const { getActiveMedia } = await import("@/app/actions/media");
    const activeVideo = await getActiveMedia("VIDEO_SIDEBAR");
    if (!activeVideo || activeVideo.length === 0) {
       dbFeatures = dbFeatures.filter((f: SidebarFeature) => f.path !== "/video");
    }

    return dbFeatures;
  } catch (error) {
    console.error("Error reading features from DB:", error);
    return defaultSidebarFeatures.filter(f => f.path !== "/video"); // default to hiding if error just in case, or maybe not
  }
}

export async function updateFeature(id: string, updates: Partial<SidebarFeature>) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede editar características.");
  }

  try {
    const currentFeatures = await getFeatures();
    
    const newFeatures = currentFeatures.map(feat => 
      feat.id === id ? { ...feat, ...updates } : feat
    );

    await updateSetting("sidebar_features_list", newFeatures);
    
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Error updating features in DB:", error);
    throw new Error("Failed to update feature");
  }
}

export async function reorderFeatures(newOrderedFeatures: SidebarFeature[]) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede ordenar características.");
  }

  try {
    await updateSetting("sidebar_features_list", newOrderedFeatures);
    
    revalidatePath("/", "layout");
    
    return { success: true };
  } catch (error) {
    console.error("Error reordering features in DB:", error);
    throw new Error("Failed to reorder features");
  }
}
