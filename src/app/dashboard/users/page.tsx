import { getUsers } from "@/app/actions/user";
import { auth } from "@/auth";
import UserList from "@/components/dashboard/users/UserList";
import UserFormModal from "@/components/dashboard/users/UserFormModal";
import { Users } from "lucide-react";

export const runtime = "edge";

export const metadata = {
  title: "Gestión de Usuarios - Dashboard",
};

import { redirect } from "next/navigation";

export default async function UsersPage() {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const users = await getUsers();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-orange animate-pulse" />
            Módulo de Autenticación
          </h1>
          <p className="text-gray-500 text-sm">Gestiona los usuarios y roles de la plataforma.</p>
        </div>
        <UserFormModal isSuperAdmin={isSuperAdmin} />
      </div>

      <div className="bg-base-100 rounded-lg shadow">
        <UserList users={users} isSuperAdmin={isSuperAdmin} />
      </div>
    </div>
  );
}
