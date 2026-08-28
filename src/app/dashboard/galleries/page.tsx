import { getGalleryCollections, seedGalleryCollections } from "@/app/actions/galleries";
import GalleriesDashboard from "@/components/dashboard/galleries/GalleriesDashboard";
import { getAssetUrl } from "@/utils/assets";
import { auth } from "@/auth";
import { redirect } from "next/navigation";


export default async function GalleriesPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
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
