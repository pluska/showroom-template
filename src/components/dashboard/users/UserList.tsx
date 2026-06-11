"use client";

import { deleteUser, updateUser } from "@/app/actions/user";
import { Trash2, X, AlertTriangle, Edit } from "lucide-react";
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

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "SELLER",
    adminLimit: 0,
    password: "",
  });
  const [editError, setEditError] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      role: user.role || "SELLER",
      adminLimit: user.adminLimit || 0,
      password: "",
    });
    setEditError("");
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setUpdating(true);
    setEditError("");

    try {
      await updateUser(editingUser.id, editForm);
      setEditingUser(null);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setUpdating(false);
    }
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
            {isSuperAdmin && <th>Rol</th>}
            {isSuperAdmin && <th>Límite Admin</th>}
            <th>Fecha Creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              {isSuperAdmin && (
                <td>
                  <div className={`badge ${user.role === 'SUPER_ADMIN' ? 'badge-primary' : user.role === 'ADMIN' ? 'badge-secondary' : 'badge-accent'}`}>
                    {user.role}
                  </div>
                </td>
              )}
              {isSuperAdmin && <td>{user.role === 'ADMIN' ? user.adminLimit : '-'}</td>}
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEditModal(user)}
                    className="btn btn-ghost btn-xs text-brand-orange hover:bg-brand-orange/10"
                    title="Editar"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {isSuperAdmin && (
                    <button 
                      onClick={() => handleOpenDeleteModal(user)}
                      disabled={deletingId === user.id}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </td>
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
                  <span className="label-text text-xs font-bold text-gray-600 uppercase">Traspasar citas futuras a:</span>
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

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal modal-open">
          <div className="modal-box bg-white border border-base-200 shadow-2xl rounded-2xl p-6 relative max-w-md text-gray-800">
            <button
              onClick={() => setEditingUser(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              disabled={updating}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-lg mb-4 text-gray-900 border-b pb-2">Editar Usuario</h3>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div className="form-control">
                <label className="label"><span className="label-text font-bold text-xs text-gray-700">Nombre</span></label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="input input-bordered w-full text-gray-900 bg-base-100"
                  disabled={updating}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text font-bold text-xs text-gray-700">Email</span></label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="input input-bordered w-full text-gray-900 bg-base-100"
                  disabled={updating}
                />
              </div>

              {isSuperAdmin && (
                <>
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold text-xs text-gray-700">Rol</span></label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="select select-bordered w-full text-gray-900 bg-base-100"
                      disabled={updating}
                    >
                      <option value="SELLER">Vendedor</option>
                      <option value="ADMIN">Administrador</option>
                      <option value="SUPER_ADMIN">Super Administrador</option>
                    </select>
                  </div>

                  {editForm.role === "ADMIN" && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold text-xs text-gray-700">
                          Límite de Vendedores (Solo para ADMIN)
                        </span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.adminLimit}
                        onChange={(e) => setEditForm({ ...editForm, adminLimit: Number(e.target.value) })}
                        className="input input-bordered w-full text-gray-900 bg-base-100"
                        disabled={updating}
                      />
                    </div>
                  )}
                </>
              )}

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-700">
                    Nueva Contraseña
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Dejar en blanco para no cambiar"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="input input-bordered w-full text-gray-900 bg-base-100 text-sm"
                  minLength={6}
                  disabled={updating}
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Completa este campo solo si deseas restablecer la contraseña del usuario.
                </span>
              </div>

              {editError && (
                <div className="alert alert-error text-sm py-2 text-white">
                  <span>{editError}</span>
                </div>
              )}

              <div className="modal-action border-t pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-ghost"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-warning bg-brand-orange text-white"
                  disabled={updating}
                >
                  {updating ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => !updating && setEditingUser(null)} />
        </div>
      )}
    </div>
  );
}
