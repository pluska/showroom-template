"use client";

import { useState, useTransition } from "react";
import { uploadBrochure, setActiveBrochure, deleteBrochure } from "@/app/actions/brochure";
import { BookOpen, CheckCircle, Trash2, Upload, FileText, Loader2, AlertTriangle } from "lucide-react";

type Brochure = {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  createdAt: Date | null;
};

interface BrochureDashboardProps {
  initialBrochures: Brochure[];
}

export default function BrochureDashboard({ initialBrochures }: BrochureDashboardProps) {
  const [brochures, setBrochures] = useState<Brochure[]>(initialBrochures);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    
    if (!file || file.size === 0) {
      setFormError("Por favor selecciona un archivo válido.");
      return;
    }

    try {
      setUploading(true);
      const newBrochure = await uploadBrochure(formData);
      
      // If it's the first one, it becomes active, so we update the local state accordingly
      if (brochures.length === 0) {
        setBrochures([newBrochure as any]);
      } else {
        setBrochures([newBrochure as any, ...brochures]);
      }
      
      // Reset form
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error("Error al subir brochure:", error);
      setFormError(error.message || "Ocurrió un error al subir el brochure.");
    } finally {
      setUploading(false);
    }
  };

  const handleSetActive = (id: string) => {
    startTransition(async () => {
      try {
        await setActiveBrochure(id);
        setBrochures((prev) =>
          prev.map((b) => ({
            ...b,
            isActive: b.id === id,
          }))
        );
      } catch (error) {
        console.error("Error al activar brochure:", error);
        alert("Ocurrió un error al cambiar el brochure activo.");
      }
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este brochure?")) return;
    
    startTransition(async () => {
      try {
        await deleteBrochure(id);
        setBrochures((prev) => prev.filter((b) => b.id !== id));
      } catch (error) {
        console.error("Error al eliminar brochure:", error);
        alert("Ocurrió un error al eliminar el brochure.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5 border-base-300 dark:border-base-200">
        <div>
          <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-orange animate-pulse" />
            Brochure
          </h1>
          <p className="text-gray-500 text-sm font-secondary mt-1">
            Configura y actualiza el folleto digital del proyecto.
          </p>
        </div>
      </div>

      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 dark:border-base-300 p-6 md:p-8">
        <h2 className="text-xl font-bold font-primary mb-6 flex items-center gap-2 text-brand-orange">
          <Upload className="w-5 h-5 text-brand-orange" /> Subir Nuevo Brochure
        </h2>
        <form onSubmit={handleUpload} className="flex flex-col gap-4 max-w-2xl">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300">Título (Opcional)</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder="Ej. Brochure General 2026"
              className="input input-bordered w-full text-sm"
            />
          </div>
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300">Archivo PDF</span>
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf"
              required
              className="file-input file-input-bordered w-full text-sm"
            />
          </div>

          {formError && (
            <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs py-2.5 rounded-lg flex items-start gap-1.5 mt-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="mt-4 border-t border-base-200 dark:border-base-300 pt-4">
            <button 
              type="submit" 
              className="btn btn-warning bg-brand-orange text-white text-sm"
              disabled={uploading || isPending}
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1.5" />}
              {uploading ? "Subiendo..." : "Subir Brochure"}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 dark:border-base-300 p-6 md:p-8">
        <h2 className="text-xl font-bold font-primary mb-6 flex items-center gap-2 text-brand-orange">
          <BookOpen className="w-5 h-5 text-brand-orange" /> Brochures Disponibles
        </h2>

        {brochures.length === 0 ? (
          <div className="bg-base-100 rounded-xl border border-dashed border-base-300 dark:border-base-200 p-16 flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-full bg-base-200 text-gray-400 mb-4">
              <FileText className="w-10 h-10" />
            </div>
            <p className="text-gray-500 font-medium text-sm">No hay brochures subidos todavía.</p>
          </div>
        ) : (
          <div className="bg-base-100 rounded-xl border border-base-200 dark:border-base-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead>
                  <tr className="bg-base-200/50 dark:bg-base-300/50">
                    <th>Título / Archivo</th>
                    <th>Fecha de Subida</th>
                    <th className="text-center">Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {brochures.map((brochure) => (
                    <tr key={brochure.id} className="hover:bg-base-200/30 transition-colors">
                      <td>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{brochure.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[250px] truncate">{brochure.url.split('/').pop()}</div>
                      </td>
                      <td>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {brochure.createdAt ? new Date(brochure.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      <td className="text-center">
                        {brochure.isActive ? (
                          <span className="badge badge-success gap-1 text-white py-3 px-3 text-xs font-bold uppercase tracking-wider">
                            <CheckCircle className="w-3.5 h-3.5" /> Activo
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetActive(brochure.id)}
                            disabled={isPending}
                            className="btn btn-xs btn-outline btn-success"
                          >
                            Marcar como Activo
                          </button>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDelete(brochure.id)}
                          disabled={isPending}
                          className="btn btn-ghost btn-xs text-gray-500 dark:text-gray-400 hover:text-error"
                          title="Eliminar brochure"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
