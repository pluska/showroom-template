"use server";

import { getDb } from "@/lib/db";
import { galleryCollections, media } from "@/lib/db/schema";
import { eq, isNull, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getGalleryCollections() {
  const db = await getDb();
  
  // Clean up soft-deleted collections
  const collections = await db
    .select()
    .from(galleryCollections)
    .where(isNull(galleryCollections.deletedAt));
    
  return collections;
}

export async function getGalleryImages(collectionId: string) {
  const db = await getDb();
  
  const categories = collectionId === 'amenities' 
    ? ['amenities', 'AMENITIES_GALLERY'] 
    : [collectionId];
  
  const images = await db
    .select()
    .from(media)
    .where(
      and(
        isNull(media.deletedAt),
        inArray(media.category, categories),
        eq(media.isActive, true)
      )
    );
    
  return images;
}

export async function createGalleryCollection(title: string, description: string, coverImage: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede crear colecciones.");
  }
  
  const db = await getDb();
  
  const id = crypto.randomUUID();
  const [newCollection] = await db
    .insert(galleryCollections)
    .values({
      id,
      title,
      description,
      coverImage,
      isActive: true,
    })
    .returning();
    
  revalidatePath("/galeria");
  revalidatePath("/dashboard/galleries");
  return newCollection;
}

export async function updateGalleryCollection(
  id: string,
  title: string,
  description: string,
  coverImage: string,
  isActive: boolean
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede actualizar colecciones.");
  }
  
  const db = await getDb();
  
  const [updatedCollection] = await db
    .update(galleryCollections)
    .set({
      title,
      description,
      coverImage,
      isActive,
      updatedAt: new Date(),
    })
    .where(eq(galleryCollections.id, id))
    .returning();
    
  revalidatePath("/galeria");
  revalidatePath("/dashboard/galleries");
  return updatedCollection;
}

export async function deleteGalleryCollection(id: string) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized: Solo el Super Administrador puede eliminar colecciones.");
  }
  
  const db = await getDb();
  
  // Soft-delete the collection
  await db
    .update(galleryCollections)
    .set({ deletedAt: new Date() })
    .where(eq(galleryCollections.id, id));
    
  // Soft-delete associated media
  await db
    .update(media)
    .set({ deletedAt: new Date(), isActive: false })
    .where(eq(media.category, id));
    
  revalidatePath("/galeria");
  revalidatePath("/dashboard/galleries");
  return { success: true };
}

export async function seedGalleryCollections() {
  const db = await getDb();
  
  // Check if collections already exist
  const existing = await db
    .select()
    .from(galleryCollections)
    .where(isNull(galleryCollections.deletedAt));
    
  if (existing.length > 0) {
    return existing;
  }
  
  const defaults = [
    {
      id: "general",
      title: "General",
      description: "A glimpse into the Showroom Virtual experience.",
      coverImage: "https://placehold.co/600x400/1a1a1a/ffffff?text=General+Cover",
    },
    {
      id: "amenities",
      title: "Amenities",
      description: "Explore our world-class facilities.",
      coverImage: "https://placehold.co/600x400/1a1a1a/ffffff?text=Amenities+Cover",
    },
    {
      id: "floor-1",
      title: "Floor 1",
      description: "Detailed view of the first floor layout.",
      coverImage: "https://placehold.co/600x400/1a1a1a/ffffff?text=Floor+1+Cover",
    }
  ];
  
  const seeded: any[] = [];
  for (const item of defaults) {
    const [row] = await db
      .insert(galleryCollections)
      .values({
        id: item.id,
        title: item.title,
        description: item.description,
        coverImage: item.coverImage,
        isActive: true,
      })
      .returning();
    seeded.push(row);
  }
  
  return seeded;
}
