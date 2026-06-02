import { getBrochures } from "@/app/actions/brochure";
import BrochureDashboard from "@/components/dashboard/brochure/BrochureDashboard";

export default async function BookOpenPage() {
  const brochures = await getBrochures();

  // Convert Date objects to serialize properly if passing to Client Components in Next.js
  const serializedBrochures = brochures.map(b => ({
    id: b.id,
    title: b.title,
    url: b.url,
    isActive: b.isActive ?? false,
    createdAt: b.createdAt
  }));

  return <BrochureDashboard initialBrochures={serializedBrochures} />;
}
