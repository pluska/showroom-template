import { getMedia } from "@/app/actions/media";
import { getToursAdmin } from "@/app/actions/tours";
import { getProgressUpdates } from "@/app/actions/progress";
import { getFeatures } from "@/app/actions/features";
import { getUnits } from "@/app/actions/units";
import MediaDashboard from "@/components/dashboard/media/MediaDashboard";
import { getAssetUrl } from "@/utils/assets";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function MediaPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }
  const mediaList = await getMedia();
  const toursList = await getToursAdmin();
  const progressList = await getProgressUpdates();
  const unitsList = await getUnits();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  // Los espacios que no se venden se modelan con el estado COMMON_AREA, no con
  // un id de piso concreto: así la regla vale para cualquier edificio.
  const filteredUnitsList = isSuperAdmin
    ? unitsList
    : unitsList.filter((u) => u.state !== "COMMON_AREA");

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

  const getTypology = (id: string) => {
    if (id === "101") return "101";
    if (id === "802") return "802";
    if (id.endsWith("01")) {
      const num = parseInt(id, 10);
      if (!isNaN(num) && num >= 201 && num <= 801) return "201-801";
    }
    if (id.endsWith("02")) {
      const num = parseInt(id, 10);
      if (!isNaN(num) && num >= 202 && num <= 702) return "202-702";
    }
    return "OTROS";
  };

  const unitMedia: any[] = [];
  filteredUnitsList.forEach((unit) => {
    const typology = getTypology(unit.identifier);
    const furnished = (unit.photosFurnished as string[]) || [];
    const unfurnished = (unit.photosUnfurnished as string[]) || [];
    const plans = (unit.photosPlans as string[]) || [];

    furnished.forEach((url, idx) => {
      if (url) {
        unitMedia.push({
          id: `unit-${unit.id}-furnished-${idx}`,
          title: `Departamento ${unit.identifier} - Amoblado`,
          url: getAssetUrl(url),
          type: "image",
          category: "EL_EDIFICIO",
          isActive: true,
          createdAt: unit.createdAt,
          typology,
          subTypology: "furnished",
        });
      }
    });

    unfurnished.forEach((url, idx) => {
      if (url) {
        unitMedia.push({
          id: `unit-${unit.id}-unfurnished-${idx}`,
          title: `Departamento ${unit.identifier} - Sin Amoblar`,
          url: getAssetUrl(url),
          type: "image",
          category: "EL_EDIFICIO",
          isActive: true,
          createdAt: unit.createdAt,
          typology,
          subTypology: "unfurnished",
        });
      }
    });

    plans.forEach((url, idx) => {
      if (url) {
        unitMedia.push({
          id: `unit-${unit.id}-plans-${idx}`,
          title: `Departamento ${unit.identifier} - Medidas`,
          url: getAssetUrl(url),
          type: "image",
          category: "EL_EDIFICIO",
          isActive: true,
          createdAt: unit.createdAt,
          typology,
          subTypology: "plans",
        });
      }
    });
  });

  const allMedia = [...serializedMedia, ...tourMedia, ...progressMedia, ...unitMedia];
  const features = await getFeatures();
  const isIdentityEnabled = features.some(f => f.id === "identity" && f.active);

  return (
    <MediaDashboard 
      initialMedia={allMedia} 
      currentUserRole={(session.user.role as string) || "SELLER"} 
      isIdentityEnabled={isIdentityEnabled}
    />
  );
}
