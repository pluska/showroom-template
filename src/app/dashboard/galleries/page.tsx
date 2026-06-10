import { getGalleryCollections, seedGalleryCollections } from "@/app/actions/galleries";
import GalleriesDashboard from "@/components/dashboard/galleries/GalleriesDashboard";
import { getAssetUrl } from "@/utils/assets";

export const runtime = "edge";

export default async function GalleriesPage() {
  // Ensure default collections exist
  await seedGalleryCollections();
  
  const collections = await getGalleryCollections();

  const serializedCollections = collections.map((col) => ({
    id: col.id,
    title: col.title,
    description: col.description || "",
    coverImage: col.coverImage ? getAssetUrl(col.coverImage) : "",
    isActive: col.isActive ?? true,
    createdAt: col.createdAt,
  }));

  return <GalleriesDashboard initialCollections={serializedCollections} />;
}
