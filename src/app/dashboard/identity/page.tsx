import { getSetting } from "@/app/actions/settings";
import { auth } from "@/auth";
import IdentityForm from "@/components/dashboard/identity/IdentityForm";

export const metadata = {
  title: "Identidad - Dashboard",
};

export default async function IdentityPage() {
  const session = await auth();
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return <div className="p-4 text-error">No tienes permisos para ver esta página. Solo Super Admin.</div>;
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
        <h1 className="text-2xl font-bold">Identidad del Proyecto</h1>
        <p className="text-gray-500 text-sm">Configura los colores, tipografía, logos e información de contacto del proyecto.</p>
      </div>

      <div className="bg-base-100 rounded-lg shadow p-6">
        <IdentityForm initialData={identityConfig} />
      </div>
    </div>
  );
}
