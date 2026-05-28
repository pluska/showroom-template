import { getSetting } from "@/app/actions/settings";
import { auth } from "@/auth";
import IdentityForm from "@/components/dashboard/identity/IdentityForm";

export const runtime = "edge";

export const metadata = {
  title: "Identidad - Dashboard",
};

export default async function IdentityPage() {
  // Mock session for local development
  const session = {
    user: {
      id: "mock-id",
      name: "andresadmin",
      email: "andresadmin@example.com",
      role: "SUPER_ADMIN",
    }
  };

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
