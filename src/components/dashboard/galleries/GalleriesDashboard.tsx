"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Upload, Image as ImageIcon, Loader2, ArrowLeft, ToggleLeft, ToggleRight, X } from "lucide-react";
import { uploadMedia, toggleMediaActive, deleteMedia } from "@/app/actions/media";
import { 
  createGalleryCollection, 
  updateGalleryCollection, 
  deleteGalleryCollection, 
  getGalleryImages 
} from "@/app/actions/galleries";

type CollectionItem = {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  isActive: boolean;
  createdAt: Date | null;
};

type ImageItem = {
  id: string;
  title: string;
  url: string;
  type: string | null;
  category: string;
  isActive: boolean;
  createdAt: Date | null;
};

interface GalleriesDashboardProps {
  initialCollections: CollectionItem[];
}

export default function GalleriesDashboard({ initialCollections }: GalleriesDashboardProps) {
  const [collections, setCollections] = useState<CollectionItem[]>(initialCollections);
  const [selectedCollection, setSelectedCollection] = useState<CollectionItem | null>(null);
  const [collectionImages, setCollectionImages] = useState<ImageItem[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Collection modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalTitle, setModalTitle] = useState("");
  const [modalDesc, setModalDesc] = useState("");
  const [modalCoverUrl, setModalCoverUrl] = useState("");
  const [modalCoverFile, setModalCoverFile] = useState<File | null>(null);
  const [modalIsActive, setModalIsActive] = useState(true);
  const [editingId, setEditingId] = useState("");
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [modalError, setModalError] = useState("");

  // Gallery image upload state
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageTitle, setNewImageTitle] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Load images when a collection is selected
  useEffect(() => {
    if (!selectedCollection) return;
    
    setIsLoadingImages(true);
    getGalleryImages(selectedCollection.id)
      .then((mediaItems) => {
        setCollectionImages(
          mediaItems.map(m => ({
            id: m.id,
            title: m.title,
            url: m.url,
            type: m.type,
            category: m.category,
            isActive: m.isActive,
            createdAt: m.createdAt,
          }))
        );
      })
      .catch((e) => console.error("Error loading gallery images:", e))
      .finally(() => setIsLoadingImages(false));
  }, [selectedCollection]);

  // Open modal for creating a collection
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setModalTitle("");
    setModalDesc("");
    setModalCoverUrl("");
    setModalCoverFile(null);
    setModalIsActive(true);
    setEditingId("");
    setModalError("");
    setIsModalOpen(true);
  };

  // Open modal for editing a collection
  const handleOpenEditModal = (col: CollectionItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode("edit");
    setModalTitle(col.title);
    setModalDesc(col.description);
    setModalCoverUrl(col.coverImage);
    setModalCoverFile(null);
    setModalIsActive(col.isActive);
    setEditingId(col.id);
    setModalError("");
    setIsModalOpen(true);
  };

  // Handle saving collection (create or edit)
  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalTitle.trim()) {
      setModalError("El título es requerido.");
      return;
    }

    setIsSavingCollection(true);
    setModalError("");

    try {
      let finalCoverUrl = modalCoverUrl;

      // If a new cover image file is chosen, upload it first to R2
      if (modalCoverFile) {
        const formData = new FormData();
        formData.append("file", modalCoverFile);
        formData.append("title", `Cover for ${modalTitle}`);
        formData.append("category", "EXTRA");
        
        const uploadedMedia = await uploadMedia(formData);
        finalCoverUrl = uploadedMedia.url;
      }

      if (!finalCoverUrl) {
        throw new Error("Por favor selecciona un archivo de imagen de portada o ingresa una URL.");
      }

      if (modalMode === "create") {
        const newCol = await createGalleryCollection(modalTitle, modalDesc, finalCoverUrl);
        setCollections((prev) => [
          ...prev,
          {
            id: newCol.id,
            title: newCol.title,
            description: newCol.description || "",
            coverImage: newCol.coverImage,
            isActive: newCol.isActive,
            createdAt: newCol.createdAt,
          },
        ]);
      } else {
        const updatedCol = await updateGalleryCollection(
          editingId,
          modalTitle,
          modalDesc,
          finalCoverUrl,
          modalIsActive
        );
        setCollections((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? {
                  ...c,
                  title: updatedCol.title,
                  description: updatedCol.description || "",
                  coverImage: updatedCol.coverImage,
                  isActive: updatedCol.isActive,
                }
              : c
          )
        );
      }

      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || "Error al guardar la colección.");
    } finally {
      setIsSavingCollection(false);
    }
  };

  // Handle deleting a collection
  const handleDeleteCollection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de que deseas eliminar esta colección? Se eliminarán todas las imágenes asociadas.")) return;

    try {
      await deleteGalleryCollection(id);
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    } catch (err: any) {
      alert(err.message || "Error al eliminar la colección.");
    }
  };

  // Handle image upload to selected collection
  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollection) return;
    if (!newImageFile) {
      setUploadError("Por favor selecciona una imagen.");
      return;
    }

    setIsUploadingImage(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", newImageFile);
      formData.append("title", newImageTitle || newImageFile.name);
      formData.append("category", selectedCollection.id); // Uses collection ID as media category

      const newMedia = await uploadMedia(formData);

      setCollectionImages((prev) => [
        {
          id: newMedia.id,
          title: newMedia.title,
          url: newMedia.url,
          type: newMedia.type,
          category: newMedia.category,
          isActive: newMedia.isActive,
          createdAt: newMedia.createdAt,
        },
        ...prev,
      ]);

      setNewImageFile(null);
      setNewImageTitle("");

      const fileInput = document.getElementById("gallery-image-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Error al subir la imagen.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle toggle image active
  const handleToggleImageActive = async (id: string, currentStatus: boolean) => {
    if (!selectedCollection) return;
    try {
      await toggleMediaActive(id, !currentStatus, selectedCollection.id);
      setCollectionImages((prev) =>
        prev.map((img) => (img.id === id ? { ...img, isActive: !currentStatus } : img))
      );
    } catch (err: any) {
      alert(err.message || "Error al cambiar estado");
    }
  };

  // Handle delete image
  const handleDeleteImage = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta imagen de la galería?")) return;
    try {
      await deleteMedia(id);
      setCollectionImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err: any) {
      alert(err.message || "Error al eliminar");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-fade-in pb-12 font-secondary">
      
      {/* Header */}
      <div className="border-b pb-5 border-base-300 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-brand-orange animate-pulse" />
            Galerías de Fotos
          </h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona las diferentes categorías y fotos dinámicas del showroom.</p>
        </div>
        {!selectedCollection && (
          <button 
            onClick={handleOpenCreateModal}
            className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Colección
          </button>
        )}
      </div>

      {/* Main Content */}
      {!selectedCollection ? (
        /* Grid list of Collections */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((col) => (
            <div 
              key={col.id} 
              onClick={() => setSelectedCollection(col)}
              className="card bg-base-100 shadow-sm border border-base-200 hover:border-brand-orange/40 hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            >
              <figure className="h-48 relative bg-neutral-900 flex items-center justify-center">
                {col.coverImage ? (
                  <img 
                    src={col.coverImage} 
                    alt={col.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-600" />
                )}
                <div className="absolute top-3 right-3">
                  <span className={`badge border-0 font-semibold py-2 px-3 uppercase ${col.isActive ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                    {col.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </figure>
              <div className="card-body p-5 flex flex-col gap-2">
                <h2 className="card-title font-primary font-bold text-gray-800 text-base">{col.title}</h2>
                <p className="text-gray-500 text-xs line-clamp-2 min-h-[32px]">{col.description || 'Sin descripción'}</p>
                <div className="card-actions justify-between items-center mt-3 pt-3 border-t border-base-200">
                  <span className="text-[10px] text-gray-400 font-mono">ID: {col.id}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => handleOpenEditModal(col, e)}
                      className="btn btn-ghost btn-xs text-brand-orange hover:bg-orange-50 p-1.5 rounded"
                      title="Editar colección"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {col.id !== 'general' && col.id !== 'amenities' && col.id !== 'floor-1' && (
                      <button 
                        onClick={(e) => handleDeleteCollection(col.id, e)}
                        className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50 p-1.5 rounded"
                        title="Eliminar colección"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {collections.length === 0 && (
            <div className="col-span-full bg-base-100 rounded-xl border border-dashed border-base-300 p-12 text-center text-gray-400">
              No hay colecciones de galería registradas.
            </div>
          )}
        </div>
      ) : (
        /* Selected Collection Images CRUD View */
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedCollection(null)}
              className="btn btn-sm btn-ghost hover:bg-base-200"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a colecciones
            </button>
            <div className="h-5 w-px bg-base-300" />
            <h2 className="text-lg font-bold text-gray-800 font-primary">
              Imágenes de Colección: <span className="text-brand-orange">{selectedCollection.title}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Upload form to selected collection */}
            <div className="lg:col-span-1">
              <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 sticky top-6">
                <h3 className="text-base font-bold font-primary mb-4 text-gray-800">Subir Nueva Imagen</h3>
                
                <form onSubmit={handleUploadImage} className="flex flex-col gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-bold text-xs text-gray-600">Título</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Vista Frontal"
                      className="input input-bordered w-full text-sm"
                      value={newImageTitle}
                      onChange={(e) => setNewImageTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-bold text-xs text-gray-600">Archivo</span>
                    </label>
                    <input
                      id="gallery-image-upload"
                      type="file"
                      className="file-input file-input-bordered w-full text-sm"
                      onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                      required
                      accept="image/*"
                    />
                  </div>

                  {uploadError && <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-md">{uploadError}</div>}

                  <button
                    type="submit"
                    disabled={isUploadingImage}
                    className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 w-full mt-2"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Subir Imagen
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* List of images inside collection */}
            <div className="lg:col-span-2">
              <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 min-h-[400px] flex flex-col">
                <h3 className="text-base font-bold font-primary mb-4 text-gray-800">Fotos en esta Colección</h3>
                
                {isLoadingImages ? (
                  <div className="flex flex-col items-center justify-center flex-1 py-12 text-gray-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                    <span className="text-xs">Cargando fotos...</span>
                  </div>
                ) : collectionImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-12 text-center">
                    <p className="text-sm">No hay imágenes en esta colección.</p>
                    <p className="text-xs text-gray-400 mt-1">Usa el formulario de la izquierda para agregar la primera.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {collectionImages.map((img) => (
                      <div key={img.id} className="relative rounded-lg overflow-hidden border border-base-200 group bg-neutral-900 flex flex-col justify-between min-h-[160px]">
                        <img 
                          src={img.url} 
                          alt={img.title} 
                          className="w-full h-28 object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                        <div className="p-2 bg-base-100 flex flex-col gap-1 z-10">
                          <p className="font-bold text-xs truncate text-gray-800" title={img.title}>{img.title}</p>
                          <div className="flex justify-between items-center mt-1">
                            <button
                              onClick={() => handleToggleImageActive(img.id, img.isActive)}
                              className="focus:outline-none"
                              title={img.isActive ? "Desactivar" : "Activar"}
                            >
                              {img.isActive ? (
                                <span className="text-xs text-green-600 font-bold flex items-center gap-0.5">
                                  <ToggleRight className="w-4 h-4 fill-green-200 text-green-600" /> Activo
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                  <ToggleLeft className="w-4 h-4 text-gray-400" /> Inactivo
                                </span>
                              )}
                            </button>
                            <button 
                              onClick={() => handleDeleteImage(img.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Eliminar foto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Collection Create/Edit Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md bg-base-100 p-6 relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-bold text-lg font-primary text-gray-800">
              {modalMode === "create" ? "Nueva Colección de Galería" : "Editar Colección"}
            </h3>
            
            <form onSubmit={handleSaveCollection} className="mt-4 flex flex-col gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-600">Nombre de la Colección</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Interiores"
                  className="input input-bordered w-full text-sm"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-600">Descripción</span>
                </label>
                <textarea
                  placeholder="Explica qué tipo de fotos contiene..."
                  className="textarea textarea-bordered w-full text-sm min-h-[80px]"
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-gray-600">Imagen de Portada (Subir Archivo)</span>
                </label>
                <input
                  type="file"
                  className="file-input file-input-bordered w-full text-sm"
                  onChange={(e) => setModalCoverFile(e.target.files?.[0] || null)}
                  accept="image/*"
                  required={modalMode === "create" && !modalCoverUrl}
                />
                {modalCoverUrl && (
                  <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                    <span>Portada actual:</span>
                    <img src={modalCoverUrl} alt="Portada actual" className="h-20 w-32 object-cover rounded border" />
                  </div>
                )}
              </div>

              {modalMode === "edit" && (
                <div className="form-control w-full flex-row items-center gap-2 mt-1">
                  <input
                    type="checkbox"
                    id="collection-active-check"
                    className="checkbox checkbox-primary checkbox-sm"
                    checked={modalIsActive}
                    onChange={(e) => setModalIsActive(e.target.checked)}
                  />
                  <label htmlFor="collection-active-check" className="label-text text-sm font-semibold text-gray-700 cursor-pointer">
                    Colección Activa (Visible en la web)
                  </label>
                </div>
              )}

              {modalError && <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-md">{modalError}</div>}

              <div className="modal-action gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-ghost text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingCollection}
                  className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 text-sm"
                >
                  {isSavingCollection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
