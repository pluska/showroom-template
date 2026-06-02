export const runtime = 'edge';

import { getFeatures } from "@/app/actions/features";
import FeaturesClient from "@/components/dashboard/features/FeaturesClient";

export default async function SettingsPage() {
  const initialFeatures = await getFeatures();

  return (
    <div className="flex flex-col gap-6 animate-fade-in justify-center items-center w-full">
      <div className="w-full align-start">
        <h1 className="text-2xl font-bold font-primary text-brand-orange">Features</h1>
        <p className="text-gray-500 text-sm font-secondary">Configuración global de características y módulos en el sidebar del showroom.</p>
      </div>

      <FeaturesClient initialFeatures={initialFeatures} />
    </div>
  );
}
