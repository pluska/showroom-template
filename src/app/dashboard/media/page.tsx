import { getMedia } from "@/app/actions/media";
import MediaDashboard from "@/components/dashboard/media/MediaDashboard";

export default async function MediaPage() {
  const mediaList = await getMedia();

  const serializedMedia = mediaList.map((m) => ({
    id: m.id,
    title: m.title,
    url: m.url,
    type: m.type,
    category: m.category,
    isActive: m.isActive ?? false,
    createdAt: m.createdAt,
  }));

  return <MediaDashboard initialMedia={serializedMedia} />;
}
