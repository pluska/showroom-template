import { getSetting } from "@/app/actions/settings";
import { auth } from "@/auth";
import IdentityForm from "@/components/dashboard/identity/IdentityForm";
import { Palette } from "lucide-react";


export const metadata = {
  title: "Identidad - Dashboard",
};

import { redirect } from "next/navigation";

export default async function IdentityPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const identityConfig = await getSetting("identity") || {
    primaryColor: "#F59C1D",
    secondaryColor: "#1F3D64",
    typography: "Inter",
    contactEmail: "",
    contactPhone: "",
    socialFacebook: "",
    socialInstagram: "",
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
          <Palette className="w-6 h-6 text-brand-orange animate-pulse" />
          Identidad del Proyecto
        </h1>
        <p className="text-gray-500 text-sm">Configura los colores, tipografía, logos e información de contacto del proyecto.</p>
      </div>

      <div className="bg-base-100 rounded-lg shadow p-6">
        <IdentityForm initialData={identityConfig} />
      </div>
    </div>
  );
}
