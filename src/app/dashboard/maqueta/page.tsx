import { Box } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";


export default async function BoxPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
          <Box className="w-6 h-6 text-brand-orange animate-pulse" />
          Maqueta
        </h1>
        <p className="text-gray-500 text-sm font-secondary">Administra la integración de la maqueta interactiva 3D.</p>
      </div>

      <div className="bg-base-100 rounded-lg shadow-sm border border-base-200 p-8 flex flex-col items-center justify-center min-h-[350px] text-center">
        <div className="p-4 rounded-full bg-base-200 text-brand-orange mb-4">
          <Box className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-bold font-primary">Módulo en Desarrollo</h3>
        <p className="text-gray-500 text-sm max-w-md mt-2">
          Este módulo está siendo preparado para su próxima implementación. Pronto podrás gestionar aquí toda la información relacionada con maqueta.
        </p>
      </div>
    </div>
  );
}
