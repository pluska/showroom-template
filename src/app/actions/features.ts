"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getSetting, updateSetting } from "@/app/actions/settings";
import defaultFeaturesJson from "@/data/features.json";
import { getDb } from "@/lib/db";
import { constructionProgress } from "@/lib/db/schema";
import { count, isNull } from "drizzle-orm";

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

/** ¿Hay al menos un avance de obra publicado (no eliminado)? */
async function hasConstructionProgress(): Promise<boolean> {
  try {
    const db = await getDb();
    const [row] = await db
      .select({ total: count() })
      .from(constructionProgress)
      .where(isNull(constructionProgress.deletedAt));
    return Number(row?.total || 0) > 0;
  } catch (error) {
    console.error("Error comprobando los avances de obra:", error);
    return false;
  }
}

/**
 * Returns the sidebar features list.
 * @param includeHidden - When true (e.g. for the dashboard), the video feature is
 *   always included even if no VIDEO_SIDEBAR media is currently active.
 *   When false (default, e.g. for the public sidebar), the video entry is
 *   hidden whenever there is no active video to show.
 */
export async function getFeatures(includeHidden = false): Promise<SidebarFeature[]> {
  await connection();
  try {
    let dbFeatures = await getSetting("sidebar_features_list");
    
    // Seed database if not existing
    if (!dbFeatures || !Array.isArray(dbFeatures) || dbFeatures.length === 0) {
      const session = await auth();
      if (session && session.user.role === "SUPER_ADMIN") {
        await updateSetting("sidebar_features_list", defaultSidebarFeatures);
      }
      dbFeatures = defaultSidebarFeatures;
    } else {
      // Ensure all default features exist in dbFeatures, and align specific defaults like video and avance
      let changed = false;
      defaultSidebarFeatures.forEach((defaultFeat, defaultIdx) => {
        const idx = dbFeatures.findIndex((f: SidebarFeature) => f.id === defaultFeat.id);
        if (idx === -1) {
          // Insertar en la posición que ocupa en el default, no al final: de lo
          // contrario una entrada nueva (p. ej. "video") aparece suelta después
          // de Contacto en vez de en su lugar dentro del menú.
          const anchor = defaultSidebarFeatures
            .slice(0, defaultIdx)
            .reduce((pos, prev) => {
              const prevIdx = dbFeatures.findIndex((f: SidebarFeature) => f.id === prev.id);
              return prevIdx === -1 ? pos : Math.max(pos, prevIdx + 1);
            }, 0);
          dbFeatures.splice(anchor, 0, defaultFeat);
          changed = true;
        } else {
          if ((defaultFeat.id === "video" || defaultFeat.id === "avance") && dbFeatures[idx].active !== defaultFeat.active) {
            dbFeatures[idx].active = defaultFeat.active;
            changed = true;
          }
        }
      });
      if (changed) {
        const session = await auth();
        if (session && session.user.role === "SUPER_ADMIN") {
          await updateSetting("sidebar_features_list", dbFeatures);
        }
      }
    }
    
    // "Avance de obra" se muestra solo si hay algo que enseñar: aparece en el
    // menú en cuanto se publica el primer avance y se oculta si se borran
    // todos. Así nadie llega a una página vacía.
    const hasProgress = await hasConstructionProgress();

    // El estado se fuerza en memoria (no en base) para que el cambio se vea de
    // inmediato sin depender de permisos de escritura en visitas públicas.
    dbFeatures = dbFeatures.map((f: SidebarFeature) => {
      if (f.id === "video") return { ...f, active: true };
      if (f.id === "avance") return { ...f, active: includeHidden ? true : hasProgress };
      return f;
    });

    return dbFeatures;
  } catch (error) {
    console.error("Error reading features from DB:", error);
    // Si no se puede leer la base, se oculta "avance de obra": es preferible no
    // ofrecer la entrada a mandar al visitante a una página posiblemente vacía.
    const fallbackFeatures = defaultSidebarFeatures.map((f: SidebarFeature) => {
      if (f.id === "video") return { ...f, active: true };
      if (f.id === "avance") return { ...f, active: false };
      return f;
    });
    return fallbackFeatures;
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
