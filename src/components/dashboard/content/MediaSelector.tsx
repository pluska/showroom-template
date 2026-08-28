"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Upload, FileImage, Check, Loader2, Trash2, HardDrive, Image as ImageIcon } from "lucide-react";
import { getMedia } from "@/app/actions/media";
import { getContentImageSources, getContentStorage, deleteReferenceImage, type ContentStorage } from "@/app/actions/content";
import { getAssetUrl } from "@/utils/assets";

interface MediaSelectorProps {
  template: {
    platformLabel: string;
    typeLabel: string;
    width: number;
    height: number;
    aspectRatio: string;
  };
  modo: "manual" | "ia" | null;
  onBack: () => void;
  onContinue: (selectedMediaUrls: string[]) => void;
}

type MediaItem = {
  id: string;
  title: string;
  url: string;
  type: string | null;
  category: string;
  isActive: boolean;
};

// Componente para cargar imágenes de forma diferida (Lazy Load) con skeleton
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // La capa de imagen va fuera del flujo (absolute) para que la altura de la
  // miniatura dependa solo de aspect-square: si la imagen fuera un hijo en flujo,
  // su altura natural definiría la fila y las tarjetas se agrupan/colapsan.
  return (
    <div ref={imgRef} className="absolute inset-0 bg-gray-100 overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-gray-400" />
        </div>
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          loading="lazy"
        />
      )}
    </div>
  );
}

export default function MediaSelector({ template, modo, onBack, onContinue }: MediaSelectorProps) {
  const [activeTab, setActiveTab] = useState<"gallery" | "references">("gallery");
  const [activeCategory, setActiveCategory] = useState<"ALL" | "RENDERS" | "AMENITIES_GALLERY" | "PAST">("ALL");
  const [galleryImages, setGalleryImages] = useState<MediaItem[]>([]);
  const [referenceImages, setReferenceImages] = useState<{ id: string; url: string; name: string }[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Espacio ocupado por el módulo (referencias, piezas generadas y plantillas)
  const [storage, setStorage] = useState<ContentStorage | null>(null);
  const [deletingRefId, setDeletingRefId] = useState<string | null>(null);

  const refreshStorage = () => {
    getContentStorage()
      .then(setStorage)
      .catch((err) => console.error("Error leyendo el almacenamiento:", err));
  };
  useEffect(refreshStorage, []);

  const handleDeleteReference = async (id: string, url: string) => {
    setDeletingRefId(id);
    setUploadError("");
    try {
      await deleteReferenceImage(id);
      setReferenceImages((prev) => prev.filter((r) => r.id !== id));
      // Si estaba elegida para el lienzo, se quita también de la selección
      setSelectedUrls((prev) => prev.filter((u) => u !== url));
      refreshStorage();
    } catch (err: any) {
      setUploadError(err?.message || "No se pudo eliminar la referencia.");
    } finally {
      setDeletingRefId(null);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fuentes de imágenes: tabla media (amenidades y otras subidas) + renders de
  // fachada del edificio + contenido ya generado. El estado "activo" solo aplica
  // al sitio público, así que aquí se muestra todo lo no eliminado.
  // Las categorías se normalizan a: RENDERS, AMENITIES_GALLERY y PAST (contenido pasado).
  useEffect(() => {
    setIsLoadingGallery(true);
    Promise.all([getMedia(), getContentImageSources().catch(() => ({ renders: [], pastContent: [] }))])
      .then(([items, sources]) => {
        const images = items.filter(item => item.type?.startsWith("image/"));

        // Referencias persistidas de sesiones anteriores → pestaña "Mis Referencias"
        const storedRefs = images
          .filter(item => item.category === "SOCIAL_REFERENCE")
          .map(item => ({ id: item.id, url: item.url, name: item.title }));
        setReferenceImages(prev => {
          const known = new Set(prev.map(r => r.url));
          return [...prev, ...storedRefs.filter(r => !known.has(r.url))];
        });

        // Renders de fachada (building_faces) → "Fachada / Renders"
        const renderItems = (sources.renders || []).map(r => ({
          id: r.id, title: r.title, url: r.url, type: "image/png", category: "RENDERS", isActive: true
        }));

        // Amenidades del proyecto
        const amenityItems = images
          .filter(item => item.category === "AMENITIES_GALLERY")
          .map(item => ({
            id: item.id, title: item.title, url: item.url, type: item.type, category: "AMENITIES_GALLERY", isActive: item.isActive
          }));

        // Contenido pasado: piezas generadas + cualquier otra imagen subida a R2
        // (categorías distintas de amenidades y referencias), todo en un solo lugar
        const otherMedia = images
          .filter(item => item.category !== "AMENITIES_GALLERY" && item.category !== "SOCIAL_REFERENCE")
          .map(item => ({
            id: item.id, title: item.title, url: item.url, type: item.type, category: "PAST", isActive: item.isActive
          }));
        const pastPieces = (sources.pastContent || []).map(p => ({
          id: p.id, title: p.title, url: p.url, type: "image/jpeg", category: "PAST", isActive: true
        }));

        setGalleryImages([...renderItems, ...amenityItems, ...pastPieces, ...otherMedia]);
      })
      .catch((err) => console.error("Error loading project gallery:", err))
      .finally(() => setIsLoadingGallery(false));
  }, []);

  const handleToggleSelect = (url: string) => {
    // Selección múltiple en ambos modos: en manual, la primera imagen es el fondo
    // del canvas y las demás se colocan como capas movibles; en ia son referencias
    if (selectedUrls.includes(url)) {
      setSelectedUrls(prev => prev.filter(u => u !== url));
    } else {
      setSelectedUrls(prev => [...prev, url]);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadFiles(e.target.files);
    }
  };

  const handleUploadFiles = async (files: FileList) => {
    setIsUploading(true);
    setUploadError("");

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) {
          setUploadError("Por favor sube solo archivos de imagen.");
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "social_reference");

        const res = await fetch("/api/r2/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        // 413: se agotó el espacio del módulo. El mensaje del servidor ya
        // explica cuánto se usa y qué hacer, así que se muestra tal cual.
        if (res.status === 413 && data?.storageExceeded) {
          setUploadError(data.error);
          break;
        }

        if (!res.ok) {
          throw new Error(data?.error || "Error al subir imagen");
        }

        if (data.success) {
          const newRef = {
            id: data.mediaId || data.key,
            url: data.url,
            name: file.name
          };
          setReferenceImages(prev => [newRef, ...prev]);
          setSelectedUrls(prev => [...prev, data.url]); // Autoseleccionar referencias subidas
        }
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Error al subir una o más imágenes.");
    } finally {
      setIsUploading(false);
      refreshStorage();
    }
  };

  // Aspect ratio mapping for Workspace visual representation
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case "9:16":
        return "aspect-[9/16] h-[340px]";
      case "1.91:1":
        return "aspect-[1.91/1] w-full max-h-[220px]";
      case "1:1":
      default:
        return "aspect-[1/1] w-[260px]";
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto animate-fade-in font-secondary">
      {/* Cabecera y Navegación */}
      <div className="flex flex-col gap-2">
        <button 
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-brand-orange font-semibold self-start transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a plantillas
        </button>
        <div className="flex justify-between items-center border-b pb-4 border-base-200">
          <h1 className="text-xl font-bold font-primary text-gray-800">
            Crear Contenido / {template.platformLabel} {template.typeLabel}
          </h1>
          <button
            onClick={() => onContinue(selectedUrls)}
            disabled={selectedUrls.length === 0}
            className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0"
          >
            {modo === "manual" ? "Continuar al Editor" : "Continuar a IA"} ({selectedUrls.length} seleccionadas)
          </button>
        </div>
      </div>

      {/* Grid Principal: 60/40 o 70/30 */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Panel Izquierdo: Gestor de Recursos (70%) */}
        <div className="lg:col-span-7 bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 flex flex-col gap-6">
          {/* Sistema de pestañas */}
          <div className="flex border-b border-base-200">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "gallery"
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Galería del Proyecto
            </button>
            <button
              onClick={() => setActiveTab("references")}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "references"
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Mis Referencias
            </button>
          </div>

          {/* Contenido de la pestaña Galería */}
          {activeTab === "gallery" && (
            <div className="flex-1 flex flex-col">
              {/* Tabs secundarios de Categorías */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-thin">
                {[
                  { id: "ALL", label: "Todas" },
                  { id: "RENDERS", label: "Fachada / Renders" },
                  { id: "AMENITIES_GALLERY", label: "Amenidades" },
                  { id: "PAST", label: "Contenido pasado" }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as any)}
                    className={`btn btn-xs rounded-full border px-3 py-1 font-bold transition-all h-auto min-h-0 ${
                      activeCategory === cat.id
                        ? "bg-brand-orange text-white border-brand-orange shadow-xs"
                        : "bg-base-100 text-gray-500 border-base-200 hover:border-gray-400 hover:text-gray-700"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {isLoadingGallery ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-orange" />
                  <span className="text-xs">Cargando galería...</span>
                </div>
              ) : galleryImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
                  <FileImage className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold">No hay imágenes en el proyecto.</p>
                  <p className="text-xs text-gray-400 mt-1">Sube renders en la sección de Multimedia o añade Referencias.</p>
                </div>
              ) : galleryImages.filter(img => {
                  if (activeCategory === "ALL") return true;
                  return img.category === activeCategory;
                }).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center">
                  <FileImage className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-sm font-semibold">No hay imágenes en esta categoría.</p>
                </div>
              ) : (
                /* El scroll va en un contenedor externo: si el max-h se aplica al
                   propio grid, este adquiere altura definida y align-content estira
                   las filas automaticas para rellenarla (quedaban en 41px), con lo
                   que las tarjetas cuadradas desbordaban y se amontonaban. */
                <div className="max-h-[440px] overflow-y-auto pr-2 scrollbar-thin">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryImages
                    .filter(img => {
                      if (activeCategory === "ALL") return true;
                      return img.category === activeCategory;
                    })
                    .map((img) => {
                      const isSelected = selectedUrls.includes(img.url);
                      return (
                        <div 
                          key={img.id}
                          onClick={() => handleToggleSelect(img.url)}
                          className={`relative rounded-lg overflow-hidden border cursor-pointer group bg-neutral-900 aspect-square transition-all ${
                            isSelected
                              ? "border-brand-orange ring-2 ring-orange-100"
                              : "border-base-200 hover:border-gray-400"
                          }`}
                        >
                          <LazyImage src={getAssetUrl(img.url)} alt={img.title} />
                          
                          {/* Checkbox overlay */}
                          <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected 
                              ? "bg-brand-orange border-brand-orange text-white" 
                              : "bg-white/80 border-gray-300 group-hover:bg-white"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>

                          {/* Title text overlay */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-2 text-white">
                            <p className="text-[10px] font-semibold truncate">{img.title}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
                </div>
              )}
            </div>
          )}

          {/* Contenido de la pestaña Referencias */}
          {activeTab === "references" && (
            <div className="flex-1 flex flex-col gap-6">
              {/* Drag and Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  dragActive 
                    ? "border-brand-orange bg-orange-50/10" 
                    : "border-base-300 hover:border-gray-400 bg-gray-50/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />

                {storage && (
                  <div className="w-full max-w-sm mb-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="flex items-center gap-1.5 text-gray-500 font-semibold">
                        <HardDrive className="w-3.5 h-3.5" />
                        Almacenamiento
                      </span>
                      <span className={storage.percent >= 90 ? "text-error font-bold" : "text-gray-400"}>
                        {storage.usedLabel} / {storage.limitLabel}
                      </span>
                    </div>
                    <progress
                      className={`progress w-full h-1.5 ${storage.percent >= 90 ? "progress-error" : "progress-warning"}`}
                      value={storage.percent}
                      max={100}
                    />
                  </div>
                )}
                
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
                    <span className="text-xs font-semibold text-gray-500">Subiendo referencias directamente a R2...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="text-sm font-bold text-gray-700">Arrastra tus referencias aquí o haz clic para subir</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Soporta JPG y PNG (las imágenes se almacenarán en tu espacio
                        {storage ? `: ${storage.usedLabel} de ${storage.limitLabel} usados` : ""})
                      </p>
                    </div>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-md">
                  {uploadError}
                </div>
              )}

              {/* Referencias subidas (persistidas entre sesiones) */}
              {referenceImages.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Mis Referencias ({referenceImages.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {referenceImages.map((img) => {
                      const isSelected = selectedUrls.includes(img.url);
                      return (
                        <div
                          key={img.id}
                          onClick={() => handleToggleSelect(img.url)}
                          className={`relative rounded-lg overflow-hidden border cursor-pointer aspect-square bg-gray-50 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-brand-orange ring-2 ring-orange-100"
                              : "border-base-200 hover:border-gray-400"
                          }`}
                        >
                          <img src={getAssetUrl(img.url)} alt={img.name} className="absolute inset-0 w-full h-full object-cover" />
                          <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            isSelected ? "bg-brand-orange border-brand-orange text-white" : "bg-white/80 border-gray-300"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>

                          {/* Borrar la referencia libera espacio en R2 */}
                          <button
                            type="button"
                            title="Eliminar referencia"
                            disabled={deletingRefId === img.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteReference(img.id, img.url);
                            }}
                            className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/90 hover:bg-error hover:text-white text-error shadow flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            {deletingRefId === img.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel Derecho: El Lienzo / Workspace (30%) */}
        <div className="lg:col-span-3 bg-base-100 rounded-xl shadow-sm border border-base-200 p-6 flex flex-col justify-between min-h-[460px]">
          <div>
            <h2 className="text-base font-bold font-primary mb-1 text-gray-800">Mesa de Trabajo</h2>
            <p className="text-xs text-gray-400 mb-6">Muestra una previsualización de tu lienzo con la proporción seleccionada.</p>
            
            {/* Contenedor del lienzo */}
            <div className="w-full bg-gray-50 rounded-xl border border-base-200 p-6 flex items-center justify-center min-h-[360px]">
              <div className={`bg-white shadow-sm border border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-all duration-300 ${getAspectRatioClass(template.aspectRatio)}`}>
                {selectedUrls.length === 0 ? (
                  <div className="text-center p-4 text-gray-300 flex flex-col items-center gap-1.5">
                    <FileImage className="w-6 h-6" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Lienzo Vacío</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1 w-full h-full p-1.5 bg-gray-50">
                    {selectedUrls.slice(0, 4).map((url, i) => (
                      <div key={i} className="relative rounded overflow-hidden aspect-square border border-gray-200 bg-white">
                        <img src={getAssetUrl(url)} alt="Reference" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {selectedUrls.length > 4 && (
                      <div className="rounded border bg-gray-900/80 text-white flex items-center justify-center font-bold text-xs">
                        +{selectedUrls.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-base-200 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-medium">Resolución:</span>
              <span className="font-bold text-gray-700">{template.width} x {template.height} px</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-medium">Aspect Ratio:</span>
              <span className="badge badge-xs bg-orange-50 text-brand-orange border-brand-orange/20 font-bold px-1.5 py-1.5">{template.aspectRatio}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
