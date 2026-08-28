import { getBrochures } from "@/app/actions/brochure";
import BrochureDashboard from "@/components/dashboard/brochure/BrochureDashboard";
import { getFloorsData } from "@/app/actions/units";
import { type Floor } from "@/data/floors";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function BookOpenPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }
  const brochures = await getBrochures();
  const floorsData = (await getFloorsData()) as Floor[];
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  const filteredFloorsData = isSuperAdmin
    ? floorsData
    : floorsData
        .filter((f) => f.id !== "floor_9" && f.id !== "9")
        .map((f) => ({
          ...f,
          units: f.units.filter((u) => u.identifier !== "Terraza"),
        }));

  // Convert Date objects to serialize properly if passing to Client Components in Next.js
  const serializedBrochures = brochures.map(b => ({
    id: b.id,
    title: b.title,
    url: b.url,
    type: b.type,
    unitId: b.unitId,
    isActive: b.isActive ?? false,
    createdAt: b.createdAt
  }));

  return (
    <BrochureDashboard
      initialBrochures={serializedBrochures}
      floorsData={filteredFloorsData}
      currentUserRole={(session.user.role as string) || "SELLER"}
    />
  );
}
