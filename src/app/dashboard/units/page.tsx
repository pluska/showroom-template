import { auth } from "@/auth";
import { getUrbanizationUnitsData } from "@/app/actions/units";
import UnitsDashboard from "@/components/dashboard/units/UnitsDashboard";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gestión de Unidades y Manzanas - Dashboard",
};

export default async function UnitsPage() {
  const session = await auth();
  if (!session || !session.user) {
    redirect("/login");
  }
  const userRole = session.user.role || "SELLER";

  // Fetch complete urbanization units (Lots + Towers)
  const initialUnits = await getUrbanizationUnitsData();

  const currentUser = {
    id: session.user.id || "",
    name: session.user.name || "",
    email: session.user.email || "",
    role: userRole,
  };

  return (
    <UnitsDashboard
      initialUnits={initialUnits}
      currentUser={currentUser}
    />
  );
}
