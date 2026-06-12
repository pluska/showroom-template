"use client";

import { createUser } from "@/app/actions/user";
import { Plus, User, Mail, Lock, Eye, EyeOff, Shield, Users, Loader2, AlertCircle, X } from "lucide-react";
import { useState } from "react";

export default function UserFormModal({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState("SELLER");

  const handleClose = () => {
    setIsOpen(false);
    setShowPassword(false);
    setError("");
    setSelectedRole("SELLER");
  };

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
      handleClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-none font-bold tracking-wider uppercase text-xs sm:text-sm shadow-[0_4px_20px_rgba(245,156,29,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl h-11"
      >
        <Plus className="w-4 h-4 mr-1.5" /> Agregar Usuario
      </button>

      {isOpen && (
        <div className="modal modal-open flex items-center justify-center">
          <div className="modal-box bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 relative max-w-md w-full shadow-2xl text-white font-secondary">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={handleClose} 
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="font-bold font-primary text-xl text-white">Crear Nuevo Usuario</h3>
              <p className="text-gray-400 text-xs mt-1">Registra un nuevo miembro del equipo en el panel.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nombre */}
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Nombre</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <User className="w-4 h-4" />
                  </span>
                  <input 
                    name="name" 
                    type="text" 
                    required 
                    placeholder="Ej. Andres Pluska"
                    className="input input-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white placeholder-gray-500 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11" 
                  />
                </div>
              </div>
              
              {/* Email */}
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Email</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input 
                    name="email" 
                    type="email" 
                    required 
                    placeholder="correo@ejemplo.com"
                    className="input input-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white placeholder-gray-500 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11" 
                  />
                </div>
              </div>
              
              {/* Contraseña */}
              <div className="form-control w-full">
                <label className="label py-1">
                  <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Contraseña</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    required 
                    placeholder="••••••••"
                    minLength={6} 
                    className="input input-bordered w-full pl-10 pr-10 bg-slate-800/30 border-white/10 text-white placeholder-gray-500 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11" 
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Rol */}
              {isSuperAdmin ? (
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Rol</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                      <Shield className="w-4 h-4" />
                    </span>
                    <select 
                      name="role" 
                      required 
                      className="select select-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="SELLER" className="bg-slate-900 text-white">Vendedor</option>
                      <option value="ADMIN" className="bg-slate-900 text-white">Administrador</option>
                      <option value="SUPER_ADMIN" className="bg-slate-900 text-white">Super Administrador</option>
                    </select>
                  </div>
                </div>
              ) : (
                <input name="role" type="hidden" value="SELLER" />
              )}

              {/* Límite de Vendedores */}
              {isSuperAdmin && selectedRole === "ADMIN" && (
                <div className="form-control w-full">
                  <label className="label py-1">
                    <span className="label-text text-gray-300 font-bold text-xs uppercase tracking-wider">Límite de Vendedores (Para ADMIN)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                      <Users className="w-4 h-4" />
                    </span>
                    <input 
                      name="adminLimit" 
                      type="number" 
                      min="0" 
                      defaultValue={5} 
                      placeholder="0 para sin límite"
                      className="input input-bordered w-full pl-10 bg-slate-800/30 border-white/10 text-white placeholder-gray-500 focus:border-brand-orange focus:ring-1 focus:ring-brand-orange text-sm transition-all rounded-xl h-11" 
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="alert alert-error bg-red-950/40 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="modal-action pt-4 border-t border-white/10 mt-6 flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  className="btn btn-ghost hover:bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-wider h-11 rounded-xl px-5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-none font-bold tracking-wider uppercase text-xs rounded-xl h-11 px-5 shadow-[0_4px_20px_rgba(245,156,29,0.2)] hover:scale-[1.01] active:scale-[0.99]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Usuario"
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/60 backdrop-blur-sm" onClick={handleClose}></div>
        </div>
      )}
    </>
  );
}
