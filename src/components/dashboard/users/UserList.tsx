"use client";

import { deleteUser } from "@/app/actions/user";
import { Trash2, X, AlertTriangle } from "lucide-react";
import { useState, useTransition } from "react";

interface UserListProps {
  users: any[];
  isSuperAdmin: boolean;
}

export default function UserList({ users, isSuperAdmin }: UserListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [transferToId, setTransferToId] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const handleOpenDeleteModal = (user: any) => {
    setUserToDelete(user);
    // Pre-select first other user
    const other = users.find((u) => u.id !== user.id);
    setTransferToId(other ? other.id : "");
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete.id);
    startTransition(async () => {
      try {
        await deleteUser(userToDelete.id, transferToId || undefined);
        setUserToDelete(null);
      } catch (error: any) {
        alert("Error al eliminar usuario: " + error.message);
      } finally {
        setDeletingId(null);
      }
    });
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
                    onClick={() => handleOpenDeleteModal(user)}
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

      {/* Deletion & Reassignment Modal */}
      {userToDelete && (
        <div className="modal modal-open">
          <div className="modal-box bg-white border border-base-200 shadow-2xl rounded-2xl p-6 relative max-w-md">
            <button
              onClick={() => setUserToDelete(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              disabled={isPending}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 text-error border-b border-base-200 pb-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-error" />
              <div>
                <h3 className="font-black text-lg text-base-content leading-tight">Eliminar Usuario</h3>
                <span className="text-xs text-gray-500 font-medium mt-1 block">
                  Confirmación de baja y traspaso de agenda
                </span>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-sm text-gray-600">
                Estás a punto de eliminar a <strong className="text-base-content">{userToDelete.name}</strong> ({userToDelete.email}).
              </p>

              <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg text-xs text-warning-content font-medium">
                Si este usuario tiene citas agendadas, debes seleccionar a otro vendedor/administrador para traspasarle sus citas futuras de forma permanente.
              </div>

              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-xs font-bold text-gray-400 uppercase">Traspasar citas futuras a:</span>
                </label>
                <select
                  value={transferToId}
                  onChange={(e) => setTransferToId(e.target.value)}
                  className="select select-bordered select-sm w-full font-bold text-sm"
                  disabled={isPending}
                >
                  <option value="">-- No traspasar / Dejar sin asignar --</option>
                  {users
                    .filter((u) => u.id !== userToDelete.id)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="border-t border-base-200 pt-4 flex gap-2 justify-end">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="btn btn-sm btn-ghost"
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="btn btn-sm btn-error text-white font-bold"
                  disabled={isPending}
                >
                  {isPending ? "Eliminando..." : "Confirmar Eliminación"}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !isPending && setUserToDelete(null)} />
        </div>
      )}
    </div>
  );
}
