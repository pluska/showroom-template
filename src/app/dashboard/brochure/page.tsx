import { getBrochures } from "@/app/actions/brochure";
import BrochureDashboard from "@/components/dashboard/brochure/BrochureDashboard";
import { getFloorsData } from "@/app/actions/units";
import { type Floor } from "@/data/floors";

export default async function BookOpenPage() {
  const brochures = await getBrochures();
  const floorsData = (await getFloorsData()) as Floor[];

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

  return <BrochureDashboard initialBrochures={serializedBrochures} floorsData={floorsData} />;
}
