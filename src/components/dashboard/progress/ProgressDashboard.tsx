"use client";

import { useState, useTransition } from "react";
import { 
  Plus, 
  LayoutGrid, 
  List, 
  Trash2, 
  Edit, 
  Hammer, 
  Calendar, 
  Video, 
  Image as ImageIcon, 
  X, 
  AlertTriangle, 
  ExternalLink 
} from "lucide-react";
import { 
  createProgressUpdate, 
  updateProgressUpdate, 
  deleteProgressUpdate,
  uploadMedia
} from "@/app/actions/progress";
import { getAssetUrl } from "@/utils/assets";

interface ProgressUpdate {
  id: string;
  title: string;
  date: Date;
  mediaUrl: string;
  description: string | null;
  createdAt: Date | null;
  deletedAt: Date | null;
}

interface ProgressDashboardProps {
  initialUpdates: ProgressUpdate[];
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const MONTHS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" }
];

const YEARS = Array.from({ length: 16 }, (_, i) => 2020 + i);

const getMediaType = (url: string): "image" | "video" => {
  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  const lowercaseUrl = url.toLowerCase();
  if (videoExtensions.some(ext => lowercaseUrl.endsWith(ext))) {
    return "video";
  }
  return "image";
};

const formatSpanishDate = (dateVal: Date): string => {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "";
  return `${MONTHS[d.getMonth()].label} ${d.getFullYear()}`;
};

export default function ProgressDashboard({ initialUpdates, currentUser }: ProgressDashboardProps) {
  const [updates, setUpdates] = useState<ProgressUpdate[]>(initialUpdates);
  const [activeView, setActiveView] = useState<"grid" | "list">("grid");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<ProgressUpdate | null>(null);
  
  // Delete State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [updateToDelete, setUpdateToDelete] = useState<ProgressUpdate | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formError, setFormError] = useState("");

  const isEditor = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";

  const openAddModal = () => {
    setEditingUpdate(null);
    setTitle("");
    setDescription("");
    setMediaUrl("");
    setMediaFile(null);
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditModal = (update: ProgressUpdate) => {
    const d = new Date(update.date);
    setEditingUpdate(update);
    setTitle(update.title);
    setDescription(update.description || "");
    setMediaUrl(update.mediaUrl);
    setMediaFile(null);
    setSelectedMonth(d.getMonth() + 1);
    setSelectedYear(d.getFullYear());
    setFormError("");
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) {
      setFormError("El título es obligatorio.");
      return;
    }
    if (!mediaUrl.trim() && !mediaFile) {
      setFormError("El material multimedia es obligatorio.");
      return;
    }

    startTransition(async () => {
      try {
        let finalMediaUrl = mediaUrl;

        // Si hay un archivo nuevo, lo subimos
        if (mediaFile) {
          const formData = new FormData();
          formData.append("file", mediaFile);
          finalMediaUrl = await uploadMedia(formData);
        }

        const payload = {
          title,
          description,
          mediaUrl: finalMediaUrl,
          month: selectedMonth,
          year: selectedYear
        };

        if (editingUpdate) {
          const updated = await updateProgressUpdate(editingUpdate.id, payload);
          // Update local state
          setUpdates(prev => prev.map(u => u.id === editingUpdate.id ? { ...u, ...payload, date: new Date(selectedYear, selectedMonth - 1, 1) } : u).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } else {
          const created = await createProgressUpdate(payload);
          // Add to local state
          setUpdates(prev => [{
            id: created.id,
            title: created.title,
            date: new Date(created.date),
            mediaUrl: created.mediaUrl,
            description: created.description,
            createdAt: created.createdAt,
            deletedAt: null
          }, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        setIsFormOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Ocurrió un error al guardar el avance.");
      }
    });
  };

  const confirmDelete = (update: ProgressUpdate) => {
    setUpdateToDelete(update);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!updateToDelete) return;

    startTransition(async () => {
      try {
        await deleteProgressUpdate(updateToDelete.id);
        setUpdates(prev => prev.filter(u => u.id !== updateToDelete.id));
        setIsDeleteConfirmOpen(false);
        setUpdateToDelete(null);
      } catch (err: any) {
        alert("Error al eliminar: " + err.message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5 border-base-300 dark:border-base-200">
        <div>
          <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
            <Hammer className="w-6 h-6 text-brand-orange animate-pulse" />
            Avances de Obra
          </h1>
          <p className="text-gray-500 text-sm font-secondary mt-1">
            Gestiona el registro mensual de avances de la construcción para el showroom interactivo.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* List/Grid View Toggle */}
          <div className="join bg-base-100 border border-base-300 dark:border-base-200 p-0.5 rounded-lg">
            <button 
              onClick={() => setActiveView("grid")}
              className={`btn btn-ghost btn-sm join-item px-3 ${activeView === "grid" ? "bg-base-200 text-brand-orange" : "text-gray-400"}`}
              title="Vista Cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setActiveView("list")}
              className={`btn btn-ghost btn-sm join-item px-3 ${activeView === "list" ? "bg-base-200 text-brand-orange" : "text-gray-400"}`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {isEditor && (
            <button onClick={openAddModal} className="btn btn-primary text-white ml-2 flex-1 sm:flex-none">
              <Plus className="w-4 h-4 mr-1.5" /> Agregar Avance
            </button>
          )}
        </div>
      </div>

      {updates.length === 0 ? (
        <div className="bg-base-100 rounded-xl border border-base-200 dark:border-base-300 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="p-4 rounded-full bg-base-200 text-brand-orange/60 mb-4">
            <Hammer className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold font-primary text-gray-800 dark:text-gray-200">No hay avances registrados</h3>
          <p className="text-gray-500 text-sm max-w-sm mt-2">
            Comienza agregando un reporte de avance de obra con fotos o videos para que tus compradores puedan seguir la construcción.
          </p>
          {isEditor && (
            <button onClick={openAddModal} className="btn btn-primary text-white mt-4 btn-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Agregar Primer Avance
            </button>
          )}
        </div>
      ) : activeView === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {updates.map(update => {
            const mediaType = getMediaType(update.mediaUrl);
            const resolvedUrl = getAssetUrl(update.mediaUrl);

            return (
              <div 
                key={update.id} 
                className="card bg-base-100 shadow-sm border border-base-200 dark:border-base-300 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full group"
              >
                {/* Media Container */}
                <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                  {mediaType === "video" ? (
                    <video 
                      src={resolvedUrl} 
                      className="w-full h-full object-cover" 
                      controls
                      muted
                      preload="metadata"
                    />
                  ) : (
                    <img 
                      src={resolvedUrl} 
                      alt={update.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  {/* Media Type Badge */}
                  <div className="absolute top-2 right-2 badge badge-neutral/80 backdrop-blur-md text-[10px] uppercase font-bold py-2.5 px-2">
                    {mediaType === "video" ? <Video className="w-3.5 h-3.5 mr-1" /> : <ImageIcon className="w-3.5 h-3.5 mr-1" />}
                    {mediaType === "video" ? "Video" : "Imagen"}
                  </div>
                  {/* Month Year Overlay Badge */}
                  <div className="absolute top-2 left-2 badge badge-warning bg-brand-orange text-white text-[11px] font-bold py-2.5 px-2 border-none">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {formatSpanishDate(update.date)}
                  </div>
                </div>

                {/* Content */}
                <div className="card-body p-5 flex flex-col flex-1">
                  <h3 className="card-title font-bold text-base text-gray-900 dark:text-white line-clamp-1">
                    {update.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-secondary mt-1 flex-1 line-clamp-3">
                    {update.description || "Sin descripción proporcionada."}
                  </p>
                  
                  {/* Action buttons */}
                  {isEditor && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-base-200 dark:border-base-300">
                      <button 
                        onClick={() => openEditModal(update)}
                        className="btn btn-outline btn-sm border-base-300 dark:border-base-200 text-gray-700 dark:text-gray-200 hover:bg-base-200 hover:text-gray-900 flex-1"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </button>
                      <button 
                        onClick={() => confirmDelete(update)}
                        className="btn btn-outline btn-error btn-sm flex-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 dark:border-base-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-left">
              <thead>
                <tr className="bg-base-200/50 dark:bg-base-300/50">
                  <th className="w-24">Multimedia</th>
                  <th>Título</th>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Ruta / URL</th>
                  {isEditor && <th className="text-right">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {updates.map(update => {
                  const mediaType = getMediaType(update.mediaUrl);
                  const resolvedUrl = getAssetUrl(update.mediaUrl);

                  return (
                    <tr key={update.id} className="hover:bg-base-200/30 transition-colors">
                      <td>
                        <div className="relative w-16 aspect-video rounded-md overflow-hidden bg-neutral-900 border border-base-300 dark:border-base-200 shadow-sm">
                          {mediaType === "video" ? (
                            <div className="w-full h-full flex items-center justify-center text-white bg-black/70">
                              <Video className="w-5 h-5 opacity-60" />
                            </div>
                          ) : (
                            <img src={resolvedUrl} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </td>
                      <td className="font-bold text-gray-900 dark:text-white text-sm">
                        {update.title}
                      </td>
                      <td>
                        <span className="badge badge-sm badge-outline border-brand-orange text-brand-orange font-bold uppercase py-2">
                          {formatSpanishDate(update.date)}
                        </span>
                      </td>
                      <td className="text-xs text-gray-500 max-w-xs truncate">
                        {update.description || "-"}
                      </td>
                      <td className="text-xs font-mono max-w-[200px] truncate text-gray-400" title={update.mediaUrl}>
                        {update.mediaUrl}
                      </td>
                      {isEditor && (
                        <td className="text-right">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => openEditModal(update)}
                              className="btn btn-ghost btn-xs text-gray-500 dark:text-gray-400 hover:text-brand-orange"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete(update)}
                              className="btn btn-ghost btn-xs text-gray-500 dark:text-gray-400 hover:text-error"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM MODAL (ADD / EDIT) */}
      {isFormOpen && (
        <div className="modal modal-open z-50">
          <div className="modal-box bg-white dark:bg-base-100 max-w-lg border border-base-200 overflow-x-hidden">
            <button
              onClick={() => setIsFormOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg font-primary text-gray-900 dark:text-white border-b pb-3 mb-4">
              {editingUpdate ? "Editar Avance de Obra" : "Nuevo Avance de Obra"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Título del Reporte</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Avance de Obra - Mayo"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered w-full text-sm"
                />
              </div>

              {/* Month and Year dropdown selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-xs">Mes</span>
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="select select-bordered w-full text-sm"
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-xs">Año</span>
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="select select-bordered w-full text-sm"
                  >
                    {YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Material Multimedia</span>
                </label>
                {editingUpdate && mediaUrl && !mediaFile && (
                  <div className="text-xs text-gray-500 mb-2 p-2 bg-base-200 rounded-lg font-mono truncate">
                    Actual: {mediaUrl}
                  </div>
                )}
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setMediaFile(file);
                  }}
                  className="file-input file-input-bordered w-full text-sm"
                  required={!editingUpdate && !mediaUrl}
                />
                <label className="label flex-col items-start gap-1">
                  <span className="label-text-alt text-gray-500 text-[10px] leading-tight">
                    Sube una imagen o video para el avance de obra.
                  </span>
                  <span className="label-text-alt text-gray-500 text-[10px] leading-tight">
                    El archivo se guardará de forma segura en la nube (R2).
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Descripción</span>
                </label>
                <textarea
                  placeholder="Describe los progresos alcanzados en este periodo..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="textarea textarea-bordered text-sm w-full"
                />
              </div>

              {formError && (
                <div className="alert alert-error bg-error/10 border-error/20 text-error text-xs py-2.5 rounded-lg flex items-start gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="modal-action border-t pt-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-ghost text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn-warning bg-brand-orange text-white text-sm"
                >
                  {isPending && <span className="loading loading-spinner loading-xs mr-1" />}
                  {editingUpdate ? "Guardar Cambios" : "Crear Avance"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/40 backdrop-blur-xs" onClick={() => setIsFormOpen(false)}></div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && updateToDelete && (
        <div className="modal modal-open z-50">
          <div className="modal-box bg-white dark:bg-base-100 border border-base-200 overflow-x-hidden">
            <h3 className="font-bold text-lg text-error flex items-center gap-2 border-b pb-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-error" />
              ¿Confirmar eliminación de avance?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm py-2">
              ¿Estás seguro de que deseas eliminar el avance <strong>{updateToDelete.title}</strong> del sistema? 
              Se realizará un borrado lógico (soft delete) en la base de datos.
            </p>

            <div className="modal-action border-t pt-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setUpdateToDelete(null);
                }}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="btn btn-error text-white"
              >
                {isPending && <span className="loading loading-spinner loading-xs mr-1" />}
                Confirmar Eliminación
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40 backdrop-blur-xs" onClick={() => setIsDeleteConfirmOpen(false)}></div>
        </div>
      )}
    </div>
  );
}
