"use client";

import { signOut } from "next-auth/react";
import { User } from "lucide-react";
import { usePathname } from "next/navigation";

interface TopbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();

  const getModuleTitle = (path: string) => {
    if (path === "/dashboard") return "Métricas";
    if (path.startsWith("/dashboard/calendar")) return "Calendario";
    if (path.startsWith("/dashboard/users")) return "Usuarios";
    if (path.startsWith("/dashboard/units")) return "Unidades";
    if (path.startsWith("/dashboard/media")) return "Multimedia";
    if (path.startsWith("/dashboard/galleries")) return "Galerías";
    if (path.startsWith("/dashboard/brochure")) return "Brochure";
    if (path.startsWith("/dashboard/progress")) return "Avances de Obra";
    if (path.startsWith("/dashboard/identity")) return "Identidad";
    if (path.startsWith("/dashboard/features")) return "Features";
    if (path.startsWith("/dashboard/map")) return "Mapa";
    if (path.startsWith("/dashboard/building")) return "El Edificio";
    if (path.startsWith("/dashboard/tours")) return "Recorridos";
    if (path.startsWith("/dashboard/video-amenities")) return "Video y Amenidades";
    if (path.startsWith("/dashboard/maqueta")) return "Maqueta";
    if (path.startsWith("/dashboard/logs")) return "Logs (Restaurar)";
    return "Dashboard";
  };

  const moduleTitle = getModuleTitle(pathname);

  return (
    <header className="bg-base-100 shadow-sm border-b px-6 h-[72px] flex justify-between items-center shrink-0">
      <div>
        <h1 className="text-xl font-bold text-brand-orange">{moduleTitle}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-xs uppercase leading-none">{user.name?.charAt(0) || "U"}</span>
            </div>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold text-sm leading-none">{user.name}</span>
            <span className="text-[10px] opacity-65 mt-0.5 leading-none font-medium capitalize">
              {user.role === "SUPER_ADMIN" ? "Super Admin" : user.role === "ADMIN" ? "Administrador" : "Vendedor"}
            </span>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="btn btn-sm btn-outline btn-error"
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
}
