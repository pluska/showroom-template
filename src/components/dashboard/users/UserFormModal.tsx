"use client";

import { createUser } from "@/app/actions/user";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function UserFormModal({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      adminLimit: formData.get("adminLimit") ? Number(formData.get("adminLimit")) : 0,
    };

    try {
      await createUser(data);
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary text-white">
        <Plus className="w-4 h-4 mr-2" /> Agregar Usuario
      </button>

      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Crear Nuevo Usuario</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Nombre</span></label>
                <input name="name" type="text" required className="input input-bordered" />
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Email</span></label>
                <input name="email" type="email" required className="input input-bordered" />
              </div>
              
              <div className="form-control">
                <label className="label"><span className="label-text">Contraseña</span></label>
                <input name="password" type="password" required className="input input-bordered" minLength={6} />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Rol</span></label>
                <select name="role" required className="select select-bordered" defaultValue="SELLER">
                  <option value="SELLER">Vendedor</option>
                  {isSuperAdmin && <option value="ADMIN">Administrador</option>}
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Administrador</option>}
                </select>
              </div>

              {isSuperAdmin && (
                <div className="form-control">
                  <label className="label"><span className="label-text">Límite de Vendedores (Solo para ADMIN)</span></label>
                  <input name="adminLimit" type="number" min="0" className="input input-bordered" placeholder="0 para sin límite" />
                </div>
              )}

              {error && (
                <div className="alert alert-error text-sm py-2">
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-action">
                <button type="button" onClick={() => setIsOpen(false)} className="btn">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar Usuario"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setIsOpen(false)}></div>
        </div>
      )}
    </>
  );
}
