"use client";

import { useState } from "react";
import { Plus, Trash2, Upload, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadMedia, toggleMediaActive, deleteMedia } from "@/app/actions/media";

type MediaItem = {
  id: string;
  title: string;
  url: string;
  type: string | null;
  category: string;
  isActive: boolean;
  createdAt: Date | null;
};

interface VideoAmenitiesDashboardProps {
  initialMedia: MediaItem[];
}

export default function VideoAmenitiesDashboard({ initialMedia }: VideoAmenitiesDashboardProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const [activeTab, setActiveTab] = useState<"VIDEO_SIDEBAR" | "AMENITIES_GALLERY">("VIDEO_SIDEBAR");

  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");

  const filteredMedia = mediaList.filter(m => m.category === activeTab);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFormError("Por favor selecciona un archivo.");
      return;
    }

    // Basic type validation
    if (activeTab === "VIDEO_SIDEBAR" && !file.type.startsWith("video/")) {
      setFormError("El archivo debe ser un video.");
      return;
    }
    if (activeTab === "AMENITIES_GALLERY" && !file.type.startsWith("image/")) {
      setFormError("El archivo debe ser una imagen.");
      return;
    }

    setIsUploading(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("category", activeTab);

      const newMedia = await uploadMedia(formData);

      setMediaList((prev) => [
        {
          ...newMedia,
          createdAt: newMedia.createdAt || new Date(),
        } as MediaItem,
        ...prev,
      ]);

      setFile(null);
      setTitle("");
      
      // Reset file input
      const fileInput = document.getElementById('media-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // If it is a new video and marked active, deactivate others of the same category
      if (activeTab === "VIDEO_SIDEBAR" && newMedia.isActive) {
        setMediaList(prev => prev.map(m => m.id === newMedia.id ? m : { ...m, isActive: m.category === "VIDEO_SIDEBAR" ? false : m.isActive }));
      }
      
    } catch (e: any) {
      console.error(e);
      setFormError(e.message || "Error al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleMediaActive(id, !currentStatus, activeTab);
      
      setMediaList((prev) =>
        prev.map((m) => {
          if (m.id === id) return { ...m, isActive: !currentStatus };
          if (activeTab === "VIDEO_SIDEBAR" && !currentStatus) {
             // If we just activated a video, all others are deactivated
             return { ...m, isActive: false };
          }
          return m;
        })
      );
    } catch (e: any) {
      alert(e.message || "Error al cambiar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este archivo?")) return;
    
    try {
      await deleteMedia(id);
      setMediaList((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      alert(e.message || "Error al eliminar");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="border-b pb-5 border-base-300">
        <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
          <Video className="w-6 h-6 text-brand-orange animate-pulse" />
          Video y Amenidades
        </h1>
        <p className="text-gray-500 text-sm font-secondary mt-1">Gestiona el video promocional y las vistas de amenidades.</p>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-bordered font-secondary w-full">
        <button 
          className={`tab tab-bordered ${activeTab === "VIDEO_SIDEBAR" ? "tab-active font-bold !border-brand-orange text-brand-orange" : ""}`}
          onClick={() => setActiveTab("VIDEO_SIDEBAR")}
        >
          <Video className="w-4 h-4 mr-2" />
          Video (Sidebar)
        </button>
        <button 
          className={`tab tab-bordered ${activeTab === "AMENITIES_GALLERY" ? "tab-active font-bold !border-brand-orange text-brand-orange" : ""}`}
          onClick={() => setActiveTab("AMENITIES_GALLERY")}
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Amenidades
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6">
            <h2 className="text-lg font-bold font-primary mb-4 text-gray-800">
              Subir a {activeTab === "VIDEO_SIDEBAR" ? "Video" : "Amenidades"}
            </h2>
            
            <form onSubmit={handleUpload} className="flex flex-col gap-4 font-secondary">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-600">Título</span>
                </label>
                <input
                  type="text"
                  placeholder={activeTab === "VIDEO_SIDEBAR" ? "Ej. Video Principal" : "Ej. Vista del Gimnasio"}
                  className="input input-bordered w-full text-sm"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-600">Archivo</span>
                </label>
                <input
                  id="media-upload"
                  type="file"
                  className="file-input file-input-bordered w-full text-sm"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  accept={activeTab === "VIDEO_SIDEBAR" ? "video/*" : "image/*"}
                />
              </div>

              {formError && <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-md">{formError}</div>}

              <button
                type="submit"
                disabled={isUploading}
                className="btn bg-brand-orange hover:bg-brand-dark-orange text-white w-full border-0 mt-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Subir Archivo
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 min-h-[400px] flex flex-col">
            <h2 className="text-lg font-bold font-primary mb-4 text-gray-800">Lista de Archivos</h2>
            
            {filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-12">
                <p className="text-sm">No hay archivos en esta categoría.</p>
              </div>
            ) : (
              <div className="overflow-x-auto w-full flex-1">
                <table className="table w-full text-sm">
                  <thead>
                    <tr className="text-gray-600">
                      <th>Detalles</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedia.map((mediaItem) => (
                      <tr key={mediaItem.id} className="hover:bg-base-200/50 transition-colors">
                        <td className="max-w-[240px]">
                          <div className="font-bold text-gray-900 truncate" title={mediaItem.title}>
                            {mediaItem.title}
                          </div>
                          <div className="text-xs font-mono text-gray-400 truncate max-w-[200px]" title={mediaItem.url}>
                            {mediaItem.url}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(mediaItem.id, mediaItem.isActive)}
                            className={`badge badge-sm font-semibold cursor-pointer border-0 py-2.5 px-3 uppercase ${
                              mediaItem.isActive 
                                ? 'bg-green-500 text-white hover:bg-green-600' 
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                            title="Clic para alternar estado"
                          >
                            {mediaItem.isActive ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="text-xs text-gray-500">
                          {mediaItem.createdAt ? new Date(mediaItem.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleDelete(mediaItem.id)}
                            className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50 p-1 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
