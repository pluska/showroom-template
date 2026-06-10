import { getLocations, seedLocations } from "@/app/actions/locations";
import MapDashboard from "@/components/dashboard/map/MapDashboard";

export const runtime = "edge";

export default async function MapPage() {
  // Ensure default locations are seeded
  await seedLocations();
  
  const locations = await getLocations(true); // include inactive ones

  const serializedLocations = locations.map((loc) => ({
    id: loc.id,
    name: loc.name,
    category: loc.category,
    imagePath: loc.imagePath || "",
    longitude: loc.longitude,
    latitude: loc.latitude,
    isActive: loc.isActive ?? true,
    createdAt: loc.createdAt,
  }));

  return <MapDashboard initialLocations={serializedLocations} />;
}
