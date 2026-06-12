"use client";

import { deleteUser, updateUser } from "@/app/actions/user";
import { Trash2, X, AlertTriangle, Edit, User, Mail, Lock, Eye, EyeOff, Shield, Users, Loader2, AlertCircle } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
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
    setShowPassword(false);
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
              <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</td>
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
        <div className="modal modal-open flex items-center justify-center">
          <div className="modal-box bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative max-w-md w-full shadow-2xl text-white font-secondary">
            <button
              onClick={() => setUserToDelete(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-white"
              disabled={isPending}
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-red-500 border-b border-white/10 pb-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-bold font-primary text-xl text-white leading-tight">Eliminar Usuario</h3>
                <span className="text-xs text-gray-400 font-medium mt-1 block">
                  Confirmación de baja y traspaso de agenda
                </span>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-sm text-gray-300">
                Estás a punto de eliminar a <strong className="text-white font-semibold">{userToDelete.name}</strong> ({userToDelete.email}).
              </p>

              <div className="bg-amber-950/40 border border-amber-500/20 p-3.5 rounded-xl text-xs text-amber-300 font-medium flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Si este usuario tiene citas agendadas, debes seleccionar a otro vendedor/administrador para traspasarle sus citas futuras de forma permanente.
                </span>
              </div>

              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Traspasar citas futuras a:</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <select
                    value={transferToId}
                    onChange={(e) => setTransferToId(e.target.value)}
                    className="select select-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11"
                    disabled={isPending}
                  >
                    <option value="" className="bg-slate-900 text-white">-- No traspasar / Dejar sin asignar --</option>
                    {users
                      .filter((u) => u.id !== userToDelete.id)
                      .map((u) => (
                        <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                          {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 flex gap-2 justify-end mt-6">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="btn btn-ghost hover:bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-wider h-11 rounded-xl px-5"
                  disabled={isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="btn bg-red-600 hover:bg-red-700 text-white border-none font-bold tracking-wider uppercase text-xs rounded-xl h-11 px-5 shadow-[0_4px_20px_rgba(220,38,38,0.2)] hover:scale-[1.01] active:scale-[0.99]"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Eliminando...
                    </>
                  ) : (
                    "Confirmar Eliminación"
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => !isPending && setUserToDelete(null)} />
        </div>
      )}        {/* Edit User Modal */}
      {editingUser && (
        <div className="modal modal-open flex items-center justify-center">
          <div className="modal-box bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative max-w-md w-full shadow-2xl text-white font-secondary">
            <button
              onClick={() => setEditingUser(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-white"
              disabled={updating}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="font-bold font-primary text-xl text-white">Editar Usuario</h3>
              <p className="text-gray-400 text-xs mt-1">Actualiza los datos del miembro del equipo.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Nombre</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="input input-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white placeholder-gray-500 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11"
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Email</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="input input-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white placeholder-gray-500 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11"
                    disabled={updating}
                  />
                </div>
              </div>

              {isSuperAdmin && (
                <>
                  <div className="form-control w-full">
                    <label className="label py-1">
                      <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Rol</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                        <Shield className="w-4 h-4" />
                      </span>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        className="select select-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11"
                        disabled={updating}
                      >
                        <option value="SELLER" className="bg-slate-900 text-white">Vendedor</option>
                        <option value="ADMIN" className="bg-slate-900 text-white">Administrador</option>
                        <option value="SUPER_ADMIN" className="bg-slate-900 text-white">Super Administrador</option>
                      </select>
                    </div>
                  </div>

                  {editForm.role === "ADMIN" && (
                    <div className="form-control w-full">
                      <label className="label py-1">
                        <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">
                          Límite de Vendedores (Solo para ADMIN)
                        </span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                          <Users className="w-4 h-4" />
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={editForm.adminLimit}
                          onChange={(e) => setEditForm({ ...editForm, adminLimit: Number(e.target.value) })}
                          className="input input-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white placeholder-gray-500 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11"
                          disabled={updating}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">
                    Nueva Contraseña
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Dejar en blanco para no cambiar"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="input input-bordered w-full pl-10 pr-10 bg-slate-800/30 border-white/10 text-white placeholder-gray-500 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11"
                    minLength={6}
                    disabled={updating}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Completa este campo solo si deseas restablecer la contraseña del usuario.
                </span>
              </div>

              {editError && (
                <div className="alert alert-error bg-red-950/40 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="modal-action pt-4 border-t border-white/10 mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn btn-ghost hover:bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-wider h-11 rounded-xl px-5"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-none font-bold tracking-wider uppercase text-xs rounded-xl h-11 px-5 shadow-[0_4px_20px_rgba(245,156,29,0.2)] hover:scale-[1.01] active:scale-[0.99]"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={() => !updating && setEditingUser(null)} />
        </div>
      )}      
    </div>
  );
}
