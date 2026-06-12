"use client";

import { useState, useTransition } from "react";
import { uploadBrochure, setActiveBrochure, deleteBrochure, updateBrochure } from "@/app/actions/brochure";
import { BookOpen, CheckCircle, Trash2, Upload, FileText, Loader2, AlertTriangle, Building, LayoutGrid, Edit2, X } from "lucide-react";
import { type Floor } from "@/data/floors";

type Brochure = {
  id: string;
  title: string;
  url: string;
  type: string;
  unitId?: string | null;
  isActive: boolean;
  createdAt: Date | null;
};

interface BrochureDashboardProps {
  initialBrochures: Brochure[];
  floorsData: Floor[];
  currentUserRole?: string;
}

export default function BrochureDashboard({ initialBrochures, floorsData, currentUserRole = "SELLER" }: BrochureDashboardProps) {
  const isSeller = currentUserRole === "SELLER";
  const [brochures, setBrochures] = useState<Brochure[]>(initialBrochures);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [type, setType] = useState<"GENERAL" | "UNIT">("GENERAL");
  const [selectedFloorId, setSelectedFloorId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  const [editingBrochure, setEditingBrochure] = useState<Brochure | null>(null);
  const [editType, setEditType] = useState<"GENERAL" | "UNIT">("GENERAL");
  const [editFloorId, setEditFloorId] = useState<string>("");
  const [editUnitId, setEditUnitId] = useState<string>("");
  const [editFormError, setEditFormError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const selectedFloor = floorsData.find((f) => f.id === selectedFloorId);
  const editSelectedFloor = floorsData.find((f) => f.id === editFloorId);

  const findUnitIdentifier = (unitId: string | null | undefined) => {
    if (!unitId) return "";
    for (const floor of floorsData) {
      const unit = floor.units.find((u) => u.id === unitId);
      if (unit) return unit.identifier || unit.id;
    }
    return unitId;
  };

  const handleEditClick = (brochure: Brochure) => {
    setEditingBrochure(brochure);
    setEditType(brochure.type as "GENERAL" | "UNIT");
    if (brochure.type === "UNIT" && brochure.unitId) {
      const floor = floorsData.find((f) => f.units.some((u) => u.id === brochure.unitId));
      setEditFloorId(floor?.id || "");
      setEditUnitId(brochure.unitId);
    } else {
      setEditFloorId("");
      setEditUnitId("");
    }
    setEditFormError("");
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditFormError("");
    if (!editingBrochure) return;

    const formData = new FormData(e.currentTarget);
    formData.append("type", editType);
    if (editType === "UNIT") {
      if (!editUnitId) {
        setEditFormError("Debes seleccionar una unidad.");
        return;
      }
      formData.append("unitId", editUnitId);
    }

    try {
      setIsEditing(true);
      const updatedBrochure = await updateBrochure(editingBrochure.id, formData);
      
      let newBrochuresList = [...brochures];
      if (editType === "UNIT") {
         newBrochuresList = newBrochuresList.filter(b => !(b.type === 'UNIT' && b.unitId === editUnitId && b.id !== editingBrochure.id));
      }
      
      setBrochures(newBrochuresList.map(b => b.id === updatedBrochure.id ? updatedBrochure as any : b));
      setEditingBrochure(null);
    } catch (error: any) {
      console.error("Error al actualizar brochure:", error);
      setEditFormError(error.message || "Ocurrió un error al actualizar el brochure.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    
    if (!file || file.size === 0) {
      setFormError("Por favor selecciona un archivo válido.");
      return;
    }

    formData.append("type", type);
    if (type === "UNIT") {
      if (!selectedUnitId) {
        setFormError("Debes seleccionar una unidad.");
        return;
      }
      formData.append("unitId", selectedUnitId);
    }

    try {
      setUploading(true);
      const newBrochure = await uploadBrochure(formData);
      
      // Si el brochure que acabamos de agregar reemplazó a uno activo de la misma unidad, 
      // necesitamos recargar/actualizar. Para simplificar actualizamos la lista con el nuevo.
      // Ocultamos los anteriores de la misma unidad lógicamente del estado.
      let newBrochuresList = [...brochures];
      
      if (type === "UNIT") {
         newBrochuresList = newBrochuresList.filter(b => !(b.type === 'UNIT' && b.unitId === selectedUnitId));
      }

      setBrochures([newBrochure as any, ...newBrochuresList]);
      
      // Reset form
      (e.target as HTMLFormElement).reset();
      setType("GENERAL");
      setSelectedFloorId("");
      setSelectedUnitId("");
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
        const targetBrochure = brochures.find(b => b.id === id);
        
        setBrochures((prev) =>
          prev.map((b) => {
            // Si son del mismo tipo y (si es UNIT) de la misma unidad, se desactivan
            let isActive = b.isActive;
            if (b.id === id) {
              isActive = true;
            } else if (targetBrochure) {
               if (targetBrochure.type === 'GENERAL' && b.type === 'GENERAL') isActive = false;
               if (targetBrochure.type === 'UNIT' && b.type === 'UNIT' && b.unitId === targetBrochure.unitId) isActive = false;
            }
            return { ...b, isActive };
          })
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

      {!isSeller && (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 dark:border-base-300 p-6 md:p-8">
          <h2 className="text-xl font-bold font-primary mb-6 flex items-center gap-2 text-brand-orange">
            <Upload className="w-5 h-5 text-brand-orange" /> Subir Nuevo Brochure
          </h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4 max-w-2xl">
          
          {/* Tipo de Brochure */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300">Tipo de Brochure</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer justify-start gap-2">
                <input type="radio" name="radio-type" className="radio radio-primary radio-sm" checked={type === "GENERAL"} onChange={() => setType("GENERAL")} />
                <span className="label-text">General</span>
              </label>
              <label className="label cursor-pointer justify-start gap-2">
                <input type="radio" name="radio-type" className="radio radio-primary radio-sm" checked={type === "UNIT"} onChange={() => setType("UNIT")} />
                <span className="label-text">Por Unidad</span>
              </label>
            </div>
          </div>

          {/* Selectores de Piso y Unidad si es UNIT */}
          {type === "UNIT" && (
            <div className="flex gap-4 w-full">
              <div className="form-control w-1/2">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"><Building className="w-3 h-3"/> Piso</span>
                </label>
                <select 
                  className="select select-bordered w-full text-sm" 
                  value={selectedFloorId}
                  onChange={(e) => {
                    setSelectedFloorId(e.target.value);
                    setSelectedUnitId(""); // reset unit when floor changes
                  }}
                >
                  <option value="" disabled>Selecciona un piso</option>
                  {floorsData.map((floor) => (
                    <option key={floor.id} value={floor.id}>{floor.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-control w-1/2">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"><LayoutGrid className="w-3 h-3"/> Unidad</span>
                </label>
                <select 
                  className="select select-bordered w-full text-sm" 
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  disabled={!selectedFloorId}
                >
                  <option value="" disabled>Selecciona una unidad</option>
                  {selectedFloor?.units.map((u) => (
                    <option key={u.id} value={u.id}>Unidad {u.identifier || u.id} {u.subtitle ? `(${u.subtitle})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300">Título (Opcional)</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder={type === "GENERAL" ? "Ej. Brochure General 2026" : "Ej. Brochure Unidad 101"}
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
      )}

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
                    <th>Tipo</th>
                    <th>Fecha de Subida</th>
                    <th className="text-center">Estado</th>
                    {!isSeller && <th className="text-right">Acciones</th>}
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
                        {brochure.type === 'GENERAL' ? (
                          <span className="badge badge-ghost text-xs">General</span>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="badge badge-info text-xs">Por Unidad</span>
                            {brochure.unitId && <span className="text-[10px] text-gray-500 font-bold bg-base-200 px-1.5 py-0.5 rounded">Unidad {findUnitIdentifier(brochure.unitId)}</span>}
                          </div>
                        )}
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
                        ) : isSeller ? (
                          <span className="badge badge-ghost text-xs">Inactivo</span>
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
                      {!isSeller && (
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditClick(brochure)}
                              disabled={isPending}
                              className="btn btn-ghost btn-xs text-blue-500 hover:text-blue-700"
                              title="Editar brochure"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(brochure.id)}
                              disabled={isPending}
                              className="btn btn-ghost btn-xs text-gray-500 dark:text-gray-400 hover:text-error"
                              title="Eliminar brochure"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {editingBrochure && (
        <div className="modal modal-open">
          <div className="modal-box max-w-xl">
            <button 
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              onClick={() => setEditingBrochure(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-brand-orange">
              <Edit2 className="w-5 h-5" /> Editar Brochure
            </h3>
            
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300">Tipo de Brochure</span>
                </label>
                <div className="flex gap-4">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="radio" name="edit-type" className="radio radio-primary radio-sm" checked={editType === "GENERAL"} onChange={() => setEditType("GENERAL")} />
                    <span className="label-text">General</span>
                  </label>
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="radio" name="edit-type" className="radio radio-primary radio-sm" checked={editType === "UNIT"} onChange={() => setEditType("UNIT")} />
                    <span className="label-text">Por Unidad</span>
                  </label>
                </div>
              </div>

              {editType === "UNIT" && (
                <div className="flex gap-4 w-full">
                  <div className="form-control w-1/2">
                    <label className="label">
                      <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"><Building className="w-3 h-3"/> Piso</span>
                    </label>
                    <select 
                      className="select select-bordered w-full text-sm" 
                      value={editFloorId}
                      onChange={(e) => {
                        setEditFloorId(e.target.value);
                        setEditUnitId(""); 
                      }}
                    >
                      <option value="" disabled>Selecciona un piso</option>
                      {floorsData.map((floor) => (
                        <option key={floor.id} value={floor.id}>{floor.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-control w-1/2">
                    <label className="label">
                      <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1"><LayoutGrid className="w-3 h-3"/> Unidad</span>
                    </label>
                    <select 
                      className="select select-bordered w-full text-sm" 
                      value={editUnitId}
                      onChange={(e) => setEditUnitId(e.target.value)}
                      disabled={!editFloorId}
                    >
                      <option value="" disabled>Selecciona una unidad</option>
                      {editSelectedFloor?.units.map((u) => (
                        <option key={u.id} value={u.id}>Unidad {u.identifier || u.id} {u.subtitle ? `(${u.subtitle})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300">Título</span>
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingBrochure.title}
                  className="input input-bordered w-full text-sm"
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-700 dark:text-gray-300">Nuevo Archivo PDF (Opcional)</span>
                </label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf"
                  className="file-input file-input-bordered w-full text-sm"
                />
                <label className="label">
                  <span className="label-text-alt text-gray-500">Si no seleccionas un archivo, se mantendrá el actual.</span>
                </label>
              </div>

              {editFormError && (
                <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs py-2.5 rounded-lg flex items-start gap-1.5 mt-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{editFormError}</span>
                </div>
              )}

              <div className="modal-action mt-6">
                <button type="button" className="btn" onClick={() => setEditingBrochure(null)}>Cancelar</button>
                <button type="submit" className="btn btn-warning bg-brand-orange text-white" disabled={isEditing}>
                  {isEditing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
