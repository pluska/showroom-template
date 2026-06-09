import { getUsers } from "@/app/actions/user";
import { auth } from "@/auth";
import UserList from "@/components/dashboard/users/UserList";
import UserFormModal from "@/components/dashboard/users/UserFormModal";

export const runtime = "edge";

export const metadata = {
  title: "Gestión de Usuarios - Dashboard",
};

export default async function UsersPage() {
  // Mock session for local development
  const session = {
    user: {
      id: "mock-id",
      name: "andresadmin",
      email: "andresadmin@example.com",
      role: "ADMIN",
    }
  };

  const users = await getUsers();
  const isSuperAdmin = session.user.role === "SUPER_ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Módulo de Autenticación</h1>
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
