"use client";

import { deleteUser } from "@/app/actions/user";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface UserListProps {
  users: any[];
  isSuperAdmin: boolean;
}

export default function UserList({ users, isSuperAdmin }: UserListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    
    setDeletingId(id);
    try {
      await deleteUser(id);
    } catch (error: any) {
      alert("Error al eliminar usuario: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Rol</th>
            {isSuperAdmin && <th>Límite Admin</th>}
            <th>Fecha Creación</th>
            {isSuperAdmin && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                <div className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-primary' : user.role === 'ADMIN' ? 'badge-secondary' : 'badge-accent'}`}>
                  {user.role}
                </div>
              </td>
              {isSuperAdmin && <td>{user.role === 'ADMIN' ? user.adminLimit : '-'}</td>}
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              {isSuperAdmin && (
                <td>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    disabled={deletingId === user.id}
                    className="btn btn-ghost btn-sm text-error"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={isSuperAdmin ? 6 : 4} className="text-center py-4 text-gray-500">
                No hay usuarios registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
