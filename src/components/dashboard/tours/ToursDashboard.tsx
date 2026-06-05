"use client";

import { useState, useTransition, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Route, 
  X, 
  AlertTriangle, 
  ExternalLink, 
  Image as ImageIcon, 
  Upload, 
  Search, 
  Check, 
  Loader2 
} from "lucide-react";
import { 
  uploadTour, 
  updateTour, 
  toggleTourActive, 
  deleteTour 
} from "@/app/actions/tours";
import { getAssetUrl } from "@/utils/assets";

interface TourItem {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  type: "building" | "unit";
  targetUrl: string;
  unitId: string;
  isActive: boolean;
  order: number;
  createdAt: string | null;
  unitIdentifier: string | null;
  floorName: string | null;
}

interface UnitItem {
  id: string;
  identifier: string;
  floorId: string;
  tourUrl: string;
}

interface MediaItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

interface ToursDashboardProps {
  initialTours: TourItem[];
  units: UnitItem[];
  media: MediaItem[];
  currentUser: {
    role: string;
  };
}

export default function ToursDashboard({ initialTours, units, media, currentUser }: ToursDashboardProps) {
  const [toursList, setToursList] = useState<TourItem[]>(initialTours);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<TourItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<TourItem | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [type, setType] = useState<"building" | "unit">("building");
  const [targetUrl, setTargetUrl] = useState("");
  const [unitId, setUnitId] = useState("");
  
  // Thumbnail source selection
  const [thumbnailSource, setThumbnailSource] = useState<"upload" | "gallery">("upload");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [selectedGalleryUrl, setSelectedGalleryUrl] = useState("");
  const [order, setOrder] = useState(0);
  const [formError, setFormError] = useState("");

  // Unit Search Select States
  const [unitSearch, setUnitSearch] = useState("");
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  const isEditor = currentUser.role === "SUPER_ADMIN" || currentUser.role === "ADMIN";

  // Filter existing media and existing tour thumbnails to show images robustly
  const galleryImages = useMemo(() => {
    const images = new Map<string, { id: string; title: string; url: string }>();

    const isImage = (urlStr: string) => {
      try {
        const path = urlStr.split('?')[0].toLowerCase();
        return path.endsWith(".png") || 
               path.endsWith(".jpg") || 
               path.endsWith(".jpeg") || 
               path.endsWith(".webp") || 
               path.endsWith(".svg") || 
               path.endsWith(".gif");
      } catch (e) {
        return false;
      }
    };

    // 1. Add images from media table
    media.forEach(m => {
      if (m.category === "AMENITIES_GALLERY" || isImage(m.url)) {
        images.set(m.url, { id: m.id, title: m.title, url: m.url });
      }
    });

    // 2. Add thumbnails from existing tours
    toursList.forEach(t => {
      if (t.thumbnailUrl && isImage(t.thumbnailUrl)) {
        images.set(t.thumbnailUrl, { id: t.id, title: t.title, url: t.thumbnailUrl });
      }
    });

    return Array.from(images.values());
  }, [media, toursList]);

  // Check if a unit is currently free (not assigned to another tour)
  const isUnitFree = (uid: string) => {
    // A unit is free if no active tour (excluding the one we are currently editing) references its unitId
    const associated = toursList.find(t => t.unitId === uid && t.id !== editingTour?.id);
    return !associated;
  };

  // Filter units for the search dropdown
  const filteredUnits = useMemo(() => {
    if (!unitSearch.trim()) return units;
    return units.filter(u => 
      u.identifier.toLowerCase().includes(unitSearch.toLowerCase())
    );
  }, [units, unitSearch]);

  // Find currently selected unit object
  const selectedUnitObject = useMemo(() => {
    return units.find(u => u.id === unitId);
  }, [units, unitId]);

  const openAddModal = () => {
    setEditingTour(null);
    setTitle("");
    setSubtitle("");
    setType("building");
    setTargetUrl("");
    setUnitId("");
    setUnitSearch("");
    setThumbnailSource("upload");
    setThumbnailFile(null);
    setSelectedGalleryUrl("");
    setOrder(0);
    setFormError("");
    setIsFormOpen(true);
  };

  const openEditModal = (tour: TourItem) => {
    setEditingTour(tour);
    setTitle(tour.title);
    setSubtitle(tour.subtitle || "");
    setType(tour.type);
    setTargetUrl(tour.targetUrl);
    setUnitId(tour.unitId || "");
    
    // Set search text if unit exists
    const matchingUnit = units.find(u => u.id === tour.unitId);
    setUnitSearch(matchingUnit ? matchingUnit.identifier : "");
    
    setThumbnailSource("upload");
    setThumbnailFile(null);
    setSelectedGalleryUrl(tour.thumbnailUrl); // Prefill in gallery/thumbnail selection
    setOrder(tour.order);
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
    if (!targetUrl.trim()) {
      setFormError("La URL del recorrido virtual es obligatoria.");
      return;
    }
    if (type === "unit" && !unitId) {
      setFormError("Debes seleccionar una unidad.");
      return;
    }

    if (thumbnailSource === "upload" && !thumbnailFile && !editingTour) {
      setFormError("Debes subir una imagen de portada.");
      return;
    }
    if (thumbnailSource === "gallery" && !selectedGalleryUrl) {
      setFormError("Debes seleccionar una imagen de la galería.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("subtitle", subtitle);
        formData.append("type", type);
        formData.append("targetUrl", targetUrl);
        formData.append("order", String(order));
        if (type === "unit") {
          formData.append("unitId", unitId);
        }

        if (thumbnailSource === "upload" && thumbnailFile) {
          formData.append("file", thumbnailFile);
        } else if (thumbnailSource === "gallery" || (editingTour && !thumbnailFile)) {
          formData.append("existingThumbnailUrl", selectedGalleryUrl);
        }

        if (editingTour) {
          const updated = await updateTour(editingTour.id, formData);
          
          // Refetch/Update local state
          setToursList(prev => prev.map(t => {
            if (t.id === editingTour.id) {
              const matchedUnit = units.find(u => u.id === updated.unitId);
              return {
                ...t,
                title: updated.title,
                subtitle: updated.subtitle || "",
                thumbnailUrl: updated.thumbnailUrl,
                type: updated.type as "building" | "unit",
                targetUrl: updated.targetUrl,
                unitId: updated.unitId || "",
                order: updated.order,
                unitIdentifier: matchedUnit ? matchedUnit.identifier : null,
              };
            }
            // Also, clean any other tour that was connected to this unit since it's 1-a-1
            if (type === "unit" && t.unitId === unitId && t.id !== editingTour.id) {
              return { ...t, unitId: "", unitIdentifier: null };
            }
            return t;
          }).sort((a, b) => {
            if (a.order !== b.order) return a.order - b.order;
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          }));
        } else {
          const created = await uploadTour(formData);
          
          const matchedUnit = units.find(u => u.id === created.unitId);
          const newTourObj: TourItem = {
            id: created.id,
            title: created.title,
            subtitle: created.subtitle || "",
            thumbnailUrl: created.thumbnailUrl,
            type: created.type as "building" | "unit",
            targetUrl: created.targetUrl,
            unitId: created.unitId || "",
            isActive: created.isActive,
            order: created.order,
            createdAt: created.createdAt ? created.createdAt.toISOString() : null,
            unitIdentifier: matchedUnit ? matchedUnit.identifier : null,
            floorName: null, // populated by reload or action, but locally it will show the unit identifier
          };

          setToursList(prev => {
            // Clean other tours linked to this unit
            let cleaned = prev;
            if (type === "unit") {
              cleaned = prev.map(t => t.unitId === unitId ? { ...t, unitId: "", unitIdentifier: null } : t);
            }
            return [newTourObj, ...cleaned].sort((a, b) => {
              if (a.order !== b.order) return a.order - b.order;
              return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
          });
        }
        setIsFormOpen(false);
      } catch (err: any) {
        setFormError(err.message || "Ocurrió un error al guardar el recorrido.");
      }
    });
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleTourActive(id, !currentStatus);
      setToursList(prev => prev.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t));
    } catch (err: any) {
      alert("Error al cambiar estado: " + err.message);
    }
  };

  const confirmDelete = (tour: TourItem) => {
    setTourToDelete(tour);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!tourToDelete) return;

    startTransition(async () => {
      try {
        await deleteTour(tourToDelete.id);
        setToursList(prev => prev.filter(t => t.id !== tourToDelete.id));
        setIsDeleteOpen(false);
        setTourToDelete(null);
      } catch (err: any) {
        alert("Error al eliminar recorrido: " + err.message);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5 border-base-300">
        <div>
          <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
            <Route className="w-6 h-6 text-brand-orange animate-pulse" />
            Recorridos 3D
          </h1>
          <p className="text-gray-500 text-sm font-secondary mt-1">
            Sube, conecta y administra los recorridos virtuales de las unidades y del edificio.
          </p>
        </div>

        {isEditor && (
          <button onClick={openAddModal} className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-1.5" /> Agregar Recorrido
          </button>
        )}
      </div>

      {/* Tours Grid */}
      {toursList.length === 0 ? (
        <div className="bg-base-100 rounded-xl border border-base-200 p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="p-4 rounded-full bg-base-200 text-brand-orange/60 mb-4">
            <Route className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-bold font-primary text-gray-800">No hay recorridos registrados</h3>
          <p className="text-gray-500 text-sm max-w-sm mt-2">
            Comienza agregando un recorrido general del showroom o vinculando un recorrido 360° a una unidad del plano.
          </p>
          {isEditor && (
            <button onClick={openAddModal} className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 mt-4 btn-sm">
              <Plus className="w-4 h-4 mr-1.5" /> Agregar Primer Recorrido
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toursList.map(tour => {
            const resolvedThumbnail = getAssetUrl(tour.thumbnailUrl);
            
            return (
              <div 
                key={tour.id} 
                className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-neutral-900 overflow-hidden">
                  <img 
                    src={resolvedThumbnail} 
                    alt={tour.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = "/plants/details/face_0_daylight.png";
                    }}
                  />

                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
                    {/* Active/Inactive Switch badge */}
                    {isEditor ? (
                      <button
                        onClick={() => handleToggleActive(tour.id, tour.isActive)}
                        className={`badge cursor-pointer border-0 font-bold py-2.5 px-2 text-[10px] uppercase shadow-sm ${
                          tour.isActive 
                            ? "bg-green-500 text-white hover:bg-green-600" 
                            : "bg-gray-500 text-white hover:bg-gray-600"
                        }`}
                      >
                        {tour.isActive ? "Activo" : "Inactivo"}
                      </button>
                    ) : (
                      <span className={`badge border-0 font-bold py-2.5 px-2 text-[10px] uppercase ${
                        tour.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                      }`}>
                        {tour.isActive ? "Activo" : "Inactivo"}
                      </span>
                    )}

                    {/* Type Badge */}
                    <span className={`badge border-0 font-bold py-2.5 px-2 text-[10px] uppercase ${
                      tour.type === "building" ? "bg-amber-600 text-white" : "bg-blue-600 text-white"
                    }`}>
                      {tour.type === "building" ? "Edificio (Gral)" : `Unidad ${tour.unitIdentifier || tour.unitId}`}
                    </span>

                    {/* Order Badge */}
                    <span className="badge bg-neutral-800 text-white border-0 font-bold py-2.5 px-2 text-[10px] uppercase">
                      Orden: {tour.order}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="card-body p-5 flex flex-col flex-1">
                  <h3 className="card-title font-bold text-base text-gray-900 line-clamp-1">
                    {tour.title}
                  </h3>
                  <p className="text-gray-500 text-xs font-secondary mt-1 flex-1 line-clamp-2">
                    {tour.subtitle || "Recorrido virtual 3D interactivo."}
                  </p>

                  <div className="text-[11px] font-mono text-gray-400 truncate w-full mt-2 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <a href={tour.targetUrl} target="_blank" rel="noreferrer" className="hover:text-brand-orange underline truncate">
                      {tour.targetUrl}
                    </a>
                  </div>

                  {/* Actions */}
                  {isEditor && (
                    <div className="flex gap-2 mt-4 pt-3 border-t border-base-200">
                      <button 
                        onClick={() => openEditModal(tour)}
                        className="btn btn-outline btn-sm border-base-300 text-gray-700 hover:bg-base-200 hover:text-gray-900 flex-1"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" /> Editar
                      </button>
                      <button 
                        onClick={() => confirmDelete(tour)}
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
      )}

      {/* FORM MODAL (ADD / EDIT) */}
      {isFormOpen && (
        <div className="modal modal-open z-50">
          <div className="modal-box bg-white max-w-lg border border-base-200 overflow-x-hidden relative">
            <button
              onClick={() => setIsFormOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg font-primary text-gray-900 border-b pb-3 mb-4">
              {editingTour ? "Editar Recorrido 3D" : "Nuevo Recorrido 3D"}
            </h3>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Título del Recorrido</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Recorrido Edificio / Departamento 101"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered w-full text-sm"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Subtítulo (Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Showroom / Modelo Premium"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="input input-bordered w-full text-sm"
                />
              </div>

              {/* Display Order input */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Orden de Visualización</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="Ej: 1 (valores menores se muestran primero)"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="input input-bordered w-full text-sm"
                />
              </div>

              {/* Type Selection */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Tipo de Recorrido</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "building" | "unit")}
                  className="select select-bordered w-full text-sm"
                >
                  <option value="building">Edificio (General / Showroom)</option>
                  <option value="unit">Unidad (Específico / Departamento)</option>
                </select>
              </div>

              {/* Unit Dropdown Search Select (Conditional) */}
              {type === "unit" && (
                <div className="form-control relative">
                  <label className="label">
                    <span className="label-text font-bold text-xs">Unidad Vinculada</span>
                  </label>
                  
                  {/* Selector Input Trigger */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar Unidad (Ej: 101, 204)..."
                      value={unitSearch}
                      onChange={(e) => {
                        setUnitSearch(e.target.value);
                        setIsUnitDropdownOpen(true);
                      }}
                      onFocus={() => setIsUnitDropdownOpen(true)}
                      className="input input-bordered w-full text-sm pr-10"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Dropdown Options */}
                  {isUnitDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-base-300 rounded-lg shadow-lg max-h-56 overflow-y-auto z-50">
                      {filteredUnits.length === 0 ? (
                        <div className="p-3 text-xs text-gray-500 text-center">No se encontraron unidades</div>
                      ) : (
                        filteredUnits.map(unit => {
                          const isFree = isUnitFree(unit.id);
                          const isSelected = unitId === unit.id;

                          return (
                            <button
                              key={unit.id}
                              type="button"
                              onClick={() => {
                                setUnitId(unit.id);
                                setUnitSearch(unit.identifier);
                                setIsUnitDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-base-200 flex items-center gap-2 ${
                                isSelected ? "bg-base-200 font-bold" : ""
                              }`}
                            >
                              <span>Unidad {unit.identifier}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-brand-orange" />}
                              
                              {/* FREE Badge: White text, blue bg */}
                              {isFree ? (
                                <span className="badge badge-sm bg-blue-600 text-white border-0 font-bold ml-auto text-[10px] py-1 px-1.5 rounded">
                                  Free
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 ml-auto font-medium">
                                  Ocupada
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {selectedUnitObject && (
                    <div className="text-xs text-brand-orange font-bold mt-1.5 px-1">
                      Seleccionado: Unidad {selectedUnitObject.identifier}
                    </div>
                  )}
                </div>
              )}

              {/* Target URL */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">URL del Recorrido Virtual</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://kuula.co/share/..."
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="input input-bordered w-full text-sm font-mono"
                />
                <span className="label-text-alt text-gray-500 text-[10px] leading-tight mt-1">
                  Pega el enlace directo de Kuula, Matterport u otra plataforma.
                </span>
              </div>

              {/* Thumbnail Portada Selector */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold text-xs">Imagen de Portada</span>
                </label>

                {/* Tabs */}
                <div className="tabs tabs-boxed mb-3 font-secondary text-xs p-0.5 bg-base-200">
                  <button 
                    type="button"
                    className={`tab tab-xs flex-1 ${thumbnailSource === "upload" ? "tab-active bg-white font-bold shadow-xs text-brand-orange" : "text-gray-500"}`}
                    onClick={() => setThumbnailSource("upload")}
                  >
                    Subir Nueva Portada
                  </button>
                  <button 
                    type="button"
                    className={`tab tab-xs flex-1 ${thumbnailSource === "gallery" ? "tab-active bg-white font-bold shadow-xs text-brand-orange" : "text-gray-500"}`}
                    onClick={() => setThumbnailSource("gallery")}
                  >
                    Seleccionar de Galería
                  </button>
                </div>

                {/* Tab content 1: File Upload */}
                {thumbnailSource === "upload" && (
                  <div className="space-y-2">
                    {editingTour && selectedGalleryUrl && !thumbnailFile && (
                      <div className="text-xs text-gray-500 p-2 bg-base-100 border rounded font-mono truncate">
                        Portada actual: {selectedGalleryUrl}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setThumbnailFile(file);
                      }}
                      className="file-input file-input-bordered w-full text-sm"
                      required={!editingTour && !selectedGalleryUrl}
                    />
                  </div>
                )}

                {/* Tab content 2: Reuse image */}
                {thumbnailSource === "gallery" && (
                  <div className="border border-base-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-base-50">
                    {galleryImages.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">No hay imágenes disponibles en multimedia.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {galleryImages.map(img => {
                          const isSelected = selectedGalleryUrl === img.url;
                          const assetUrl = getAssetUrl(img.url);

                          return (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => setSelectedGalleryUrl(img.url)}
                              className={`relative aspect-video rounded overflow-hidden border-2 bg-neutral-900 group shadow-xs hover:border-brand-orange/50 transition-colors ${
                                isSelected ? "border-brand-orange shadow-md scale-[0.98]" : "border-transparent"
                              }`}
                              title={img.title}
                            >
                              <img src={assetUrl} alt={img.title} className="w-full h-full object-cover" />
                              <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white p-0.5 truncate text-center group-hover:block hidden">
                                {img.title}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
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
                  className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 text-sm"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  {editingTour ? "Guardar Cambios" : "Crear Recorrido"}
                </button>
              </div>
            </form>
          </div>
          {/* Backdrop closes dropdown if open, otherwise closes modal */}
          <div 
            className="modal-backdrop bg-black/40 backdrop-blur-xs" 
            onClick={() => {
              if (isUnitDropdownOpen) {
                setIsUnitDropdownOpen(false);
              } else {
                setIsFormOpen(false);
              }
            }}
          ></div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && tourToDelete && (
        <div className="modal modal-open z-50">
          <div className="modal-box bg-white border border-base-200 overflow-x-hidden">
            <h3 className="font-bold text-lg text-error flex items-center gap-2 border-b pb-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-error" />
              ¿Confirmar eliminación?
            </h3>
            <p className="text-gray-600 text-sm py-2">
              ¿Estás seguro de que deseas eliminar el recorrido <strong>{tourToDelete.title}</strong> del sistema? 
              Se realizará un borrado lógico y se desvinculará de cualquier unidad asignada.
            </p>

            <div className="modal-action border-t pt-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setTourToDelete(null);
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
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                Confirmar Eliminación
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40 backdrop-blur-xs" onClick={() => setIsDeleteOpen(false)}></div>
        </div>
      )}
    </div>
  );
}
