
import { getFeatures } from "@/app/actions/features";
import FeaturesClient from "@/components/dashboard/features/FeaturesClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  // Pass `true` so the dashboard always sees all features (including "video")
  // even when there is no active VIDEO_SIDEBAR media yet.
  const initialFeatures = await getFeatures(true);

  return (
    <div className="flex flex-col gap-6 animate-fade-in justify-center items-center w-full">
      <div className="w-full align-start">
        <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-orange animate-pulse" />
          Features
        </h1>
        <p className="text-gray-500 text-sm font-secondary">Configuración global de características y módulos en el sidebar del showroom.</p>
      </div>

      <FeaturesClient initialFeatures={initialFeatures} />
    </div>
  );
}
