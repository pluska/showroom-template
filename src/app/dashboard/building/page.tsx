import { auth } from "@/auth";
import { getRawBuildingFaces } from "@/app/actions/building";
import BuildingDashboard from "@/components/dashboard/building/BuildingDashboard";
import { redirect } from "next/navigation";


export const metadata = {
  title: "Gestión del Edificio - Dashboard",
};

export default async function BuildingPage() {
  const session = await auth();
  const userRole = session?.user?.role || "SUPER_ADMIN";

  if (userRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  // Fetch initial building faces from the database
  const initialFaces = await getRawBuildingFaces();

  // Serialize and sanitize faces data to pass to client component safely
  const serializedFaces = initialFaces.map((f) => ({
    id: f.id,
    name: f.name,
    dayBackground: f.dayBackground,
    dayBackgroundVideo: f.dayBackgroundVideo,
    dayHighlight: f.dayHighlight,
    dayIntroVideo: f.dayIntroVideo,
    dayToLeftTransition: f.dayToLeftTransition,
    dayToRightTransition: f.dayToRightTransition,
    nightBackground: f.nightBackground,
    nightBackgroundVideo: f.nightBackgroundVideo,
    nightHighlight: f.nightHighlight,
    nightIntroVideo: f.nightIntroVideo,
    nightToLeftTransition: f.nightToLeftTransition,
    nightToRightTransition: f.nightToRightTransition,
    dayToNightTransition: f.dayToNightTransition,
    nightToDayTransition: f.nightToDayTransition,
    order: f.order,
  }));

  return <BuildingDashboard initialFaces={serializedFaces} />;
}
