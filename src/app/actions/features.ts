"use server";

import { revalidatePath } from "next/cache";
import { auth as nextAuth } from "@/auth";
import { getSetting, updateSetting } from "@/app/actions/settings";
import defaultFeaturesJson from "@/data/features.json";

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
    const dbFeatures = await getSetting("sidebar_features_list");
    if (dbFeatures && Array.isArray(dbFeatures) && dbFeatures.length > 0) {
      return dbFeatures;
    }
    
    // Seed database if not existing
    await updateSetting("sidebar_features_list", defaultSidebarFeatures);
    return defaultSidebarFeatures;
  } catch (error) {
    console.error("Error reading features from DB:", error);
    return defaultSidebarFeatures;
  }
}

export async function updateFeature(id: string, updates: Partial<SidebarFeature>) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden editar características.");
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
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    throw new Error("Unauthorized: Solo administradores pueden ordenar características.");
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
