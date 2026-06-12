import { auth } from "@/auth";
import { getFloors, getUnits, getLogs } from "@/app/actions/units";
import UnitsDashboard from "@/components/dashboard/units/UnitsDashboard";
import { redirect } from "next/navigation";

export const runtime = "edge";

export const metadata = {
  title: "Gestión de Unidades - Dashboard",
};

export default async function UnitsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }
  const userRole = session.user.role || "SELLER";
  const isSuperAdmin = userRole === "SUPER_ADMIN";

  // Fetch initial data on the server
  const [initialFloors, initialUnits, initialLogs] = await Promise.all([
    getFloors(),
    getUnits(),
    getLogs(),
  ]);

  // Convert schema object shapes to clean JS/JSON shapes (e.g. converting Dates/JSON strings)
  const serializedFloors = initialFloors.map((f) => ({
    id: f.id,
    name: f.name,
    level: f.level,
    type: f.type,
    imagePath: f.imagePath,
  }));

  const serializedUnits = initialUnits.map((u) => ({
    id: u.id,
    floorId: u.floorId,
    identifier: u.identifier,
    type: u.type,
    bedrooms: u.bedrooms,
    bathrooms: u.bathrooms,
    areaSqm: u.areaSqm,
    state: u.state,
    buyerName: u.buyerName,
    tourUrl: u.tourUrl,
    photosFurnished: (u.photosFurnished as string[]) || [],
    photosUnfurnished: (u.photosUnfurnished as string[]) || [],
    photosPlans: (u.photosPlans as string[]) || [],
    photosBalcony: (u.photosBalcony as string[]) || [],
    gallery: (u.gallery as string[]) || [],
  }));

  const filteredUnits = serializedUnits.filter((u) => {
    if (u.state === "COMMON_AREA") {
      return isSuperAdmin;
    }
    return true;
  });

  const currentUser = {
    id: session.user.id || "",
    name: session.user.name || "",
    email: session.user.email || "",
    role: userRole,
  };

  return (
    <UnitsDashboard
      initialFloors={serializedFloors}
      initialUnits={filteredUnits}
      currentUser={currentUser}
    />
  );
}
