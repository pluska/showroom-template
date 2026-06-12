import { getToursAdmin } from "@/app/actions/tours";
import { getUnits } from "@/app/actions/units";
import { getMedia } from "@/app/actions/media";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ToursDashboard from "@/components/dashboard/tours/ToursDashboard";

export default async function ToursPage() {
  const session = await auth();

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  const role = session.user.role as string;

  const [toursList, unitsList, mediaList] = await Promise.all([
    getToursAdmin(),
    getUnits(),
    getMedia()
  ]);

  // Serialize models for client consumption (Date objects stringified/handled by Next.js if needed)
  const serializedTours = toursList.map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: t.subtitle || "",
    thumbnailUrl: t.thumbnailUrl,
    type: t.type as "building" | "unit",
    targetUrl: t.targetUrl,
    unitId: t.unitId || "",
    isActive: t.isActive,
    order: t.order,
    createdAt: t.createdAt ? t.createdAt.toISOString() : null,
    unitIdentifier: t.unitIdentifier || null,
    floorName: t.floorName || null,
  }));

  const isSuperAdmin = role === "SUPER_ADMIN";

  const serializedUnits = unitsList
    .filter((u) => {
      if (u.state === "COMMON_AREA") {
        return isSuperAdmin;
      }
      return true;
    })
    .map((u) => ({
      id: u.id,
      identifier: u.identifier,
      floorId: u.floorId,
      tourUrl: u.tourUrl || "",
    }));

  const serializedMedia = mediaList.map((m) => ({
    id: m.id,
    title: m.title,
    url: m.url,
    category: m.category,
  }));

  return (
    <ToursDashboard 
      initialTours={serializedTours} 
      units={serializedUnits} 
      media={serializedMedia}
      currentUser={{
        role: role
      }}
    />
  );
}
