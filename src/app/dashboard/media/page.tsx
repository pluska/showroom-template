import { getMedia } from "@/app/actions/media";
import { getToursAdmin } from "@/app/actions/tours";
import { getProgressUpdates } from "@/app/actions/progress";
import MediaDashboard from "@/components/dashboard/media/MediaDashboard";
import { getAssetUrl } from "@/utils/assets";

export default async function MediaPage() {
  const mediaList = await getMedia();
  const toursList = await getToursAdmin();
  const progressList = await getProgressUpdates();

  const serializedMedia = mediaList.map((m) => ({
    id: m.id,
    title: m.title,
    url: m.url ? getAssetUrl(m.url) : "",
    type: m.type,
    category: m.category,
    isActive: m.isActive ?? false,
    createdAt: m.createdAt,
  }));

  const tourMedia = toursList.filter(t => t.thumbnailUrl).map(t => ({
    id: `tour-${t.id}`,
    title: t.title,
    url: getAssetUrl(t.thumbnailUrl),
    type: "image",
    category: "RECORRIDOS",
    isActive: t.isActive,
    createdAt: t.createdAt,
  }));

  const progressMedia = progressList.filter(p => p.mediaUrl).map(p => ({
    id: `progress-${p.id}`,
    title: p.title,
    url: getAssetUrl(p.mediaUrl),
    type: "video",
    category: "AVANCES_DE_OBRA",
    isActive: true, // Assuming active by default for progress updates
    createdAt: p.date,
  }));

  const allMedia = [...serializedMedia, ...tourMedia, ...progressMedia];

  return <MediaDashboard initialMedia={allMedia} />;
}
