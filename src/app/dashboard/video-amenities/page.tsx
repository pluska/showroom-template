import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getMedia } from "@/app/actions/media";
import VideoAmenitiesDashboard from "@/components/dashboard/video-amenities/VideoAmenitiesDashboard";

export default async function VideoAmenitiesPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  const mediaList = await getMedia();

  // Filter only categories related to video and amenities
  const filteredList = mediaList.filter(
    (m) => m.category === "VIDEO_SIDEBAR" || m.category === "AMENITIES_GALLERY"
  );

  const serializedMedia = filteredList.map((m) => ({
    id: m.id,
    title: m.title,
    url: m.url,
    type: m.type,
    category: m.category,
    isActive: m.isActive ?? false,
    createdAt: m.createdAt,
  }));

  return <VideoAmenitiesDashboard initialMedia={serializedMedia} />;
}
