"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Download, Share2, Upload, Loader2, FileText, Image as ImageIcon, FileVideo, File, Search, Check, AlertTriangle } from "lucide-react";
import { uploadMedia, toggleMediaActive, deleteMedia } from "@/app/actions/media";
import { getAssetUrl } from "@/utils/assets";

type MediaItem = {
  id: string;
  title: string;
  url: string;
  type: string | null;
  category: string;
  isActive: boolean;
  createdAt: Date | null;
  typology?: string;
  subTypology?: string;
};

interface MediaDashboardProps {
  initialMedia: MediaItem[];
  currentUserRole?: string;
  isIdentityEnabled?: boolean;
}

const CATEGORY_MAP: Record<string, string> = {
  "VIDEO_PORTADA": "Vídeo Portada",
  "VIDEO_SIDEBAR": "Vídeo Principal",
  "AMENITIES_GALLERY": "Amenidades",
  "RECORRIDOS": "Recorridos",
  "EL_EDIFICIO": "El edificio",
  "IDENTIDAD": "Identidad",
  "AVANCES_DE_OBRA": "Avances de Obra",
  "BROCHURE": "Brochure",
  "PISOS": "Pisos",
  "UNIDADES": "Unidades",
  "EXTRA": "Extras"
};

export default function MediaDashboard({ initialMedia, currentUserRole = "SELLER", isIdentityEnabled = false }: MediaDashboardProps) {
  const isSuperAdmin = currentUserRole === "SUPER_ADMIN";
  const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
  const modalRef = useRef<HTMLDialogElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [formError, setFormError] = useState("");
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  
  const activeCategories: Record<string, string> = {
    "VIDEO_PORTADA": "Vídeo Portada",
    "VIDEO_SIDEBAR": "Vídeo Principal",
    "AMENITIES_GALLERY": "Amenidades",
    "EL_EDIFICIO": "El edificio",
    ...(isIdentityEnabled ? { "IDENTIDAD": "Identidad" } : {})
  };

  const [uploadCategory, setUploadCategory] = useState("VIDEO_PORTADA");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("TODOS");
  const [selectedTypologyFilter, setSelectedTypologyFilter] = useState("TODOS");
  const [selectedSubTypologyFilter, setSelectedSubTypologyFilter] = useState("TODOS");

  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCategoryFilterChange = (val: string) => {
    setSelectedCategoryFilter(val);
    setSelectedTypologyFilter("TODOS");
    setSelectedSubTypologyFilter("TODOS");
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, category: string) => {
    try {
      await toggleMediaActive(id, !currentStatus, category);
      setMediaList((prev) =>
        prev.map((m) => {
          if (m.id === id) return { ...m, isActive: !currentStatus };
          if ((category === "VIDEO_PORTADA" || category === "VIDEO_SIDEBAR") && !currentStatus) {
            return m.category === category ? { ...m, isActive: false } : m;
          }
          return m;
        })
      );
    } catch (e: any) {
      showNotification("error", e.message || "Error al cambiar estado");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este archivo?")) return;
    try {
      await deleteMedia(id);
      setMediaList((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      showNotification("error", e.message || "Error al eliminar");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setFormError("Por favor selecciona un archivo.");
      return;
    }

    setIsUploading(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title || file.name);
      formData.append("category", uploadCategory);

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
      
      // Close modal on success
      if (modalRef.current) {
        modalRef.current.close();
      }
      
    } catch (e: any) {
      console.error(e);
      setFormError(e.message || "Error al subir el archivo.");
    } finally {
      setIsUploading(false);
    }
  };

  const openModal = () => {
    setFormError("");
    setFile(null);
    setTitle("");
    if (modalRef.current) modalRef.current.showModal();
  };

  const closeModal = () => {
    if (modalRef.current) modalRef.current.close();
  };

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      window.open(url, "_blank");
    }
  };

  // Compartir enlace del medio. Se usa el diálogo nativo del sistema cuando
  // existe (móvil) y, si no, se copia la URL absoluta al portapapeles.
  const handleShare = async (url: string, title: string) => {
    const resolved = getAssetUrl(url);
    const absoluteUrl = resolved.startsWith("http")
      ? resolved
      : `${window.location.origin}${resolved.startsWith("/") ? "" : "/"}${resolved}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: absoluteUrl });
        return;
      } catch (e: any) {
        // El usuario canceló el diálogo: no es un error que deba avisarse.
        if (e?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
      showNotification("success", "Enlace copiado al portapapeles.");
    } catch (e) {
      console.error(e);
      showNotification("error", "No se pudo copiar el enlace.");
    }
  };

  const getFileIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) {
      return <ImageIcon className="w-12 h-12 text-gray-400" />;
    }
    if (lowerUrl.match(/\.(mp4|webm|ogg|mov)$/)) {
      return <FileVideo className="w-12 h-12 text-gray-400" />;
    }
    return <File className="w-12 h-12 text-gray-400" />;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-fade-in pb-12">
      {notification && (
        <div className="toast toast-top toast-end z-[100]">
          <div className={`alert shadow-lg ${notification.type === "success" ? "alert-success text-white" : "alert-error text-white"}`}>
            <div>
              {notification.type === "success" ? <Check className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{notification.message}</span>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="border-b pb-5 border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-brand-orange animate-pulse" />
            Multimedia General
          </h1>
          <p className="text-gray-500 text-sm font-secondary mt-1">
            Gestiona los archivos multimedia y recursos del proyecto.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openModal}
            className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Recurso
          </button>
        )}
      </div>

      {/* Album Grid by Category */}
      <div className="w-full mt-4">
        {mediaList.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-base-100 rounded-xl shadow-sm border border-base-200 min-h-[400px] text-gray-400 py-12">
            <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm">No hay archivos registrados.</p>
            {isSuperAdmin && (
              <button onClick={openModal} className="btn btn-outline btn-sm mt-4">
                Subir tu primer archivo
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {/* Filters and Search */}
            <div className="flex flex-col gap-4 bg-white p-4 rounded-xl shadow-sm border border-base-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título..."
                    className="input input-bordered w-full pl-10 text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select
                  className="select select-bordered w-full sm:w-64 text-sm"
                  value={selectedCategoryFilter}
                  onChange={(e) => handleCategoryFilterChange(e.target.value)}
                >
                  <option value="TODOS">Todas las Categorías</option>
                  {Object.entries(activeCategories).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Additional filters for EL_EDIFICIO */}
              {selectedCategoryFilter === "EL_EDIFICIO" && (
                <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-gray-100">
                  <div className="flex-1 flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-1/2">
                      <label className="label py-1">
                        <span className="label-text font-bold text-xs text-gray-600">Tipología</span>
                      </label>
                      <select
                        className="select select-bordered w-full text-sm"
                        value={selectedTypologyFilter}
                        onChange={(e) => setSelectedTypologyFilter(e.target.value)}
                      >
                        <option value="TODOS">Todas las Tipologías</option>
                        <option value="101">Tipología 101</option>
                        <option value="201-801">Tipología 201-801</option>
                        <option value="202-702">Tipología 202-702</option>
                        <option value="802">Tipología 802</option>
                        <option value="OTROS">Otras</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-1/2">
                      <label className="label py-1">
                        <span className="label-text font-bold text-xs text-gray-600">Subtipología</span>
                      </label>
                      <select
                        className="select select-bordered w-full text-sm"
                        value={selectedSubTypologyFilter}
                        onChange={(e) => setSelectedSubTypologyFilter(e.target.value)}
                      >
                        <option value="TODOS">Todas las Subtipologías</option>
                        <option value="furnished">Amoblado</option>
                        <option value="unfurnished">Sin Amoblar</option>
                        <option value="plans">Medidas</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {Object.entries(activeCategories).map(([catKey, catLabel]) => {
              if (selectedCategoryFilter !== "TODOS" && selectedCategoryFilter !== catKey) return null;

              // Group items that match the key (or mapped label for items that already have it)
              const categoryMedia = mediaList.filter((m) => {
                const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
                const isInCategory = m.category === catKey || m.category === catLabel;
                if (!matchesSearch || !isInCategory) return false;

                if (catKey === "EL_EDIFICIO") {
                  if (selectedTypologyFilter !== "TODOS" && m.typology !== selectedTypologyFilter) {
                    return false;
                  }
                  if (selectedSubTypologyFilter !== "TODOS" && m.subTypology !== selectedSubTypologyFilter) {
                    return false;
                  }
                }
                return true;
              });
              
              if (categoryMedia.length === 0) return null;

              return (
                <div key={catKey} className="flex flex-col gap-4">
                  <h2 className="text-xl font-bold font-primary text-gray-800 border-b border-base-200 pb-2 flex flex-col gap-1">
                    <span>{catLabel.toUpperCase()}</span>
                    {catKey === "EL_EDIFICIO" && (
                      <span className="text-xs font-normal text-gray-400 font-secondary lowercase first-letter:uppercase">
                        Corresponde a las imágenes de los pisos y departamentos (amoblados, sin amoblar, medidas, galería, balcón).
                      </span>
                    )}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryMedia.map((mediaItem) => {
                      const lowerUrl = mediaItem.url.toLowerCase();
                      const isImage = lowerUrl.match(/\.(jpeg|jpg|gif|png|webp)$/);
                      const isVideo = lowerUrl.match(/\.(mp4|webm|ogg|mov)$/);
                      const displayCategory = CATEGORY_MAP[mediaItem.category] || mediaItem.category;
                      
                      return (
                        <div key={mediaItem.id} className="group relative bg-white rounded-2xl shadow-sm border border-base-200 overflow-hidden hover:shadow-md transition-all">
                          {/* Aspect Ratio Box */}
                          <div className="aspect-[4/3] bg-base-200 flex items-center justify-center relative overflow-hidden">
                            {isVideo ? (
                              <video 
                                src={mediaItem.url} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                muted
                                loop
                                playsInline
                                onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                                onMouseLeave={(e) => {
                                  e.currentTarget.pause();
                                  e.currentTarget.currentTime = 0;
                                }}
                              />
                            ) : isImage ? (
                              <img 
                                src={mediaItem.url} 
                                alt={mediaItem.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                                {getFileIcon(mediaItem.url)}
                              </div>
                            )}
                            
                            {/* Category Pill/Badge */}
                            <div className="absolute top-4 left-4">
                              <span className="bg-black/70 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
                                {displayCategory}
                              </span>
                            </div>

                            {/* Hover Overlay - Descargar y compartir enlace */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleDownload(mediaItem.url, mediaItem.title)}
                                className="btn btn-circle bg-white hover:bg-gray-100 text-brand-orange shadow-lg border-0"
                                title="Descargar"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleShare(mediaItem.url, mediaItem.title)}
                                className="btn btn-circle bg-white hover:bg-gray-100 text-brand-orange shadow-lg border-0"
                                title="Compartir enlace"
                              >
                                {copiedUrl === mediaItem.url ? (
                                  <Check className="w-5 h-5 text-success" />
                                ) : (
                                  <Share2 className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Info Box */}
                          <div className="p-5 bg-white flex justify-between items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif text-lg text-gray-800 truncate" title={mediaItem.title}>
                                {mediaItem.title}
                              </h3>
                              {mediaItem.category === "EL_EDIFICIO" && mediaItem.typology && (
                                <p className="text-xs text-gray-400 font-secondary mt-1">
                                  Tipología: {mediaItem.typology} | {
                                    mediaItem.subTypology === "furnished" ? "Amoblado" : 
                                    mediaItem.subTypology === "unfurnished" ? "Sin Amoblar" : "Medidas"
                                  }
                                </p>
                              )}
                            </div>

                            {/* Actions / Status badges for database media items */}
                            {!mediaItem.id.startsWith("tour-") && 
                             !mediaItem.id.startsWith("progress-") && 
                             !mediaItem.id.startsWith("unit-") && (
                              <div className="flex items-center gap-2 shrink-0">
                                {isSuperAdmin ? (
                                  <button
                                    onClick={() => handleToggleActive(mediaItem.id, mediaItem.isActive, mediaItem.category)}
                                    className={`badge badge-sm font-semibold border-0 py-2.5 px-3 uppercase text-[10px] cursor-pointer transition-colors ${
                                      mediaItem.isActive 
                                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                                        : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                    }`}
                                  >
                                    {mediaItem.isActive ? 'Activo' : 'Inactivo'}
                                  </button>
                                ) : (
                                  <span className={`badge badge-sm font-semibold border-0 py-2.5 px-3 uppercase text-[10px] ${
                                    mediaItem.isActive ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                                  }`}>
                                    {mediaItem.isActive ? 'Activo' : 'Inactivo'}
                                  </span>
                                )}

                                {isSuperAdmin && (
                                  <button
                                    onClick={() => handleDelete(mediaItem.id)}
                                    className="btn btn-ghost btn-circle btn-xs text-red-500 hover:bg-red-50"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <dialog ref={modalRef} className="modal">
        <div className="modal-box p-6 bg-white rounded-2xl max-w-md w-full">
          <button 
            onClick={closeModal} 
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
          >
            ✕
          </button>
          
          <h3 className="font-bold text-xl font-primary text-gray-800 mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-brand-orange" />
            Subir Nuevo Recurso
          </h3>
          
          <form onSubmit={handleUpload} className="flex flex-col gap-4 font-secondary">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-gray-600">Categoría</span>
              </label>
              <select
                className="select select-bordered w-full text-sm bg-base-50"
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
              >
                {Object.entries(activeCategories)
                  .filter(([key]) => key !== "EL_EDIFICIO")
                  .map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
              {uploadCategory === "EL_EDIFICIO" && (
                <p className="text-xs text-gray-500 mt-1.5 font-medium leading-relaxed">
                  Las imágenes de esta categoría corresponden a los pisos y departamentos (vistas amoblada, sin amoblar, medidas, galería, balcón).
                </p>
              )}
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-gray-600">Título</span>
              </label>
              <input
                type="text"
                placeholder="Ej. Render Fachada / Video Drone"
                className="input input-bordered w-full text-sm bg-base-50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-bold text-xs text-gray-600">Archivo</span>
              </label>
              <input
                id="media-upload"
                type="file"
                className="file-input file-input-bordered w-full text-sm bg-base-50"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                accept="*"
              />
            </div>

            {formError && (
              <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                {formError}
              </div>
            )}

            <div className="modal-action mt-6">
              <button 
                type="button" 
                onClick={closeModal} 
                className="btn btn-ghost"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0"
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
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
