"use client";

import { useState, useRef, useEffect } from "react";
import {
  Building,
  Plus,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Upload,
  Loader2,
  Sun,
  Moon,
  Eye,
  ArrowRightLeft,
  FileVideo,
  Image as ImageIcon,
  Save,
  X
} from "lucide-react";
import {
  createBuildingFace,
  updateBuildingFace,
  deleteBuildingFace,
  reorderBuildingFaces,
  uploadBuildingAsset
} from "@/app/actions/building";

interface BuildingDashboardProps {
  initialFaces: any[];
}

export default function BuildingDashboard({ initialFaces }: BuildingDashboardProps) {
  const [faces, setFaces] = useState<any[]>(initialFaces);
  const [selectedFaceId, setSelectedFaceId] = useState<number | null>(
    initialFaces.length > 0 ? initialFaces[0].id : null
  );

  // Modals & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFace, setEditingFace] = useState<any | null>(null);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [dayBackground, setDayBackground] = useState("");
  const [dayBackgroundVideo, setDayBackgroundVideo] = useState("");
  const [dayHighlight, setDayHighlight] = useState("");
  const [dayIntroVideo, setDayIntroVideo] = useState("");
  const [dayToLeftTransition, setDayToLeftTransition] = useState("");
  const [dayToRightTransition, setDayToRightTransition] = useState("");
  
  const [nightBackground, setNightBackground] = useState("");
  const [nightBackgroundVideo, setNightBackgroundVideo] = useState("");
  const [nightHighlight, setNightHighlight] = useState("");
  const [nightIntroVideo, setNightIntroVideo] = useState("");
  const [nightToLeftTransition, setNightToLeftTransition] = useState("");
  const [nightToRightTransition, setNightToRightTransition] = useState("");

  const [dayToNightTransition, setDayToNightTransition] = useState("");
  const [nightToDayTransition, setNightToDayTransition] = useState("");

  const selectedFace = faces.find((f) => f.id === selectedFaceId);

  // Reset form when opening create/edit
  const handleOpenForm = (face: any | null = null) => {
    setFormError("");
    if (face) {
      setEditingFace(face);
      setName(face.name);
      setDayBackground(face.dayBackground || "");
      setDayBackgroundVideo(face.dayBackgroundVideo || "");
      setDayHighlight(face.dayHighlight || "");
      setDayIntroVideo(face.dayIntroVideo || "");
      setDayToLeftTransition(face.dayToLeftTransition || "");
      setDayToRightTransition(face.dayToRightTransition || "");
      setNightBackground(face.nightBackground || "");
      setNightBackgroundVideo(face.nightBackgroundVideo || "");
      setNightHighlight(face.nightHighlight || "");
      setNightIntroVideo(face.nightIntroVideo || "");
      setNightToLeftTransition(face.nightToLeftTransition || "");
      setNightToRightTransition(face.nightToRightTransition || "");
      setDayToNightTransition(face.dayToNightTransition || "");
      setNightToDayTransition(face.nightToDayTransition || "");
    } else {
      setEditingFace(null);
      setName("");
      setDayBackground("");
      setDayBackgroundVideo("");
      setDayHighlight("");
      setDayIntroVideo("");
      setDayToLeftTransition("");
      setDayToRightTransition("");
      setNightBackground("");
      setNightBackgroundVideo("");
      setNightHighlight("");
      setNightIntroVideo("");
      setNightToLeftTransition("");
      setNightToRightTransition("");
      setDayToNightTransition("");
      setNightToDayTransition("");
    }
    setIsModalOpen(true);
  };

  const handleSaveFace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }

    setIsSaving(true);
    setFormError("");

    const data = {
      name,
      dayBackground,
      dayBackgroundVideo,
      dayHighlight,
      dayIntroVideo,
      dayToLeftTransition,
      dayToRightTransition,
      nightBackground,
      nightBackgroundVideo,
      nightHighlight,
      nightIntroVideo,
      nightToLeftTransition,
      nightToRightTransition,
      dayToNightTransition,
      nightToDayTransition,
    };

    try {
      if (editingFace) {
        const updated = await updateBuildingFace(editingFace.id, data);
        setFaces((prev) => prev.map((f) => (f.id === editingFace.id ? updated : f)));
      } else {
        const created = await createBuildingFace(data);
        setFaces((prev) => [...prev, created]);
        if (selectedFaceId === null) {
          setSelectedFaceId(created.id);
        }
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Ocurrió un error al guardar la cara del edificio.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cara?")) return;

    try {
      await deleteBuildingFace(id);
      setFaces((prev) => prev.filter((f) => f.id !== id));
      if (selectedFaceId === id) {
        const remaining = faces.filter((f) => f.id !== id);
        setSelectedFaceId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error(err);
      alert("Error al eliminar la cara.");
    }
  };

  // Move Column order left/right
  const handleMove = async (index: number, direction: "left" | "right") => {
    const newFaces = [...faces];
    const targetIndex = direction === "left" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newFaces.length) return;

    // Swap
    const temp = newFaces[index];
    newFaces[index] = newFaces[targetIndex];
    newFaces[targetIndex] = temp;

    setFaces(newFaces);
    
    try {
      await reorderBuildingFaces(newFaces.map((f) => f.id));
    } catch (err) {
      console.error(err);
      alert("Error al guardar el nuevo orden.");
    }
  };

  // File Upload Helper
  const FileUploader = ({
    label,
    value,
    onChange,
    accept = "image/*,video/*"
  }: {
    label: string;
    value: string;
    onChange: (url: string) => void;
    accept?: string;
  }) => {
    const [uploading, setUploading] = useState(false);
    const [err, setErr] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setErr("");

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await uploadBuildingAsset(formData);
        onChange(res.url);
      } catch (error: any) {
        console.error(error);
        setErr(error.message || "Error al subir");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    const isVideo = value.toLowerCase().match(/\.(mp4|webm|mov|ogg)$/);
    const isImage = value.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|svg)$/);

    return (
      <div className="border border-base-300/40 rounded-xl p-3 bg-base-200/10 dark:bg-base-200/5 flex flex-col gap-2">
        <span className="text-xs font-bold text-base-content/60">{label}</span>
        {value ? (
          <div className="relative flex items-center justify-between gap-3 bg-base-100 p-2 rounded-lg border border-base-300/50 text-base-content">
            <div className="flex items-center gap-2 overflow-hidden">
              {isVideo ? (
                <FileVideo className="w-5 h-5 text-brand-orange shrink-0" />
              ) : (
                <ImageIcon className="w-5 h-5 text-brand-orange shrink-0" />
              )}
              <span className="text-xs text-base-content/85 truncate max-w-[200px]" title={value}>
                {value.split("/").pop()}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange("")}
              className="btn btn-xs btn-circle btn-error btn-outline"
            >
              ✕
            </button>
          </div>
        ) : (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={accept}
              className="hidden"
              id={`upload-${label}`}
            />
            <label
              htmlFor={`upload-${label}`}
              className={`flex items-center justify-center gap-2 border border-dashed border-base-300 hover:border-brand-orange dark:hover:border-brand-orange rounded-lg py-2.5 cursor-pointer text-xs font-semibold hover:text-brand-orange transition-all bg-base-100 hover:bg-base-200/50 dark:bg-base-200/30 text-base-content ${
                uploading ? "opacity-60 pointer-events-none" : ""
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Seleccionar Archivo
                </>
              )}
            </label>
            {err && <p className="text-[10px] text-red-500 mt-1 font-semibold">{err}</p>}
          </div>
        )}
      </div>
    );
  };

  // Generate missing assets report for selected face
  const getNotesReport = (face: any) => {
    if (!face) return { critical: [], warnings: [], status: "clean" };

    const critical = [];
    const warnings = [];

    // Critical Alerts
    if (!face.dayBackground) {
      critical.push("Falta la imagen de fondo diurno: El showroom no se podrá cargar de día.");
    }
    if (!face.nightBackground) {
      critical.push("Falta la imagen de fondo nocturno: El showroom no se podrá cargar de noche.");
    }

    // Warnings
    if (face.dayBackground && !face.dayBackgroundVideo) {
      warnings.push("Falta el video de fondo diurno: Se usará una imagen estática en su lugar.");
    }
    if (face.nightBackground && !face.nightBackgroundVideo) {
      warnings.push("Falta el video de fondo nocturno: Se usará una imagen estática en su lugar.");
    }
    if (!face.dayIntroVideo) {
      warnings.push("Falta el video de ingreso diurno ('Ingresar'): El botón de ingreso no tendrá animación de día.");
    }
    if (!face.nightIntroVideo) {
      warnings.push("Falta el video de ingreso nocturno ('Ingresar'): El botón de ingreso no tendrá animación de noche.");
    }
    if (!face.dayToNightTransition) {
      warnings.push("Falta el video de transición día-noche: El cambio de hora será instantáneo.");
    }
    if (!face.nightToDayTransition) {
      warnings.push("Falta el video de transición noche-día: El cambio de hora será instantáneo.");
    }

    // Single face rule
    if (faces.length > 1) {
      if (!face.dayToLeftTransition) {
        warnings.push("Falta transición hacia la izquierda (Día): La rotación hacia la izquierda no tendrá animación diurna.");
      }
      if (!face.dayToRightTransition) {
        warnings.push("Falta transición hacia la derecha (Día): La rotación hacia la derecha no tendrá animación diurna.");
      }
      if (!face.nightToLeftTransition) {
        warnings.push("Falta transición hacia la izquierda (Noche): La rotación hacia la izquierda no tendrá animación nocturna.");
      }
      if (!face.nightToRightTransition) {
        warnings.push("Falta transición hacia la derecha (Noche): La rotación hacia la derecha no tendrá animación nocturna.");
      }
    }

    const status = critical.length > 0 ? "error" : warnings.length > 0 ? "warning" : "ok";

    return { critical, warnings, status };
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full pb-12 items-start max-w-6xl mx-auto">
      {/* Left side: Horizontal columns & Connectors */}
      <div className="flex-1 flex flex-col gap-6 w-full">
        {/* Header */}
        <div className="flex justify-between items-center bg-base-100 p-6 rounded-2xl shadow-sm border border-base-300/50">
          <div>
            <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
              <Building className="w-6 h-6 text-brand-orange animate-pulse" />
              Estructura del Edificio
            </h1>
            <p className="text-base-content/70 text-xs mt-1 font-secondary">
              Agrega y organiza las caras del edificio de tu showroom interactivo de forma lineal.
            </p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 flex items-center gap-2 text-sm px-4"
          >
            <Plus className="w-4 h-4" />
            Nueva Cara
          </button>
        </div>

        {/* Horizontal Columns Container */}
        <div className="bg-base-100 rounded-2xl border border-base-300/50 p-6 shadow-sm overflow-x-auto min-h-[400px]">
          {faces.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-base-content/40 py-16 text-center">
              <Building className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-sm font-semibold">No se han registrado caras en el edificio.</p>
              <button
                onClick={() => handleOpenForm()}
                className="btn btn-outline btn-sm mt-4 text-brand-orange hover:bg-brand-orange hover:border-brand-orange dark:hover:text-white"
              >
                Crea la primera cara
              </button>
            </div>
          ) : (
            <div className="flex flex-row items-stretch gap-2 py-4">
              {faces.map((face, index) => {
                const isSelected = selectedFaceId === face.id;
                const { status } = getNotesReport(face);

                return (
                  <div key={face.id} className="flex flex-row items-center shrink-0">
                    {/* Face Column Card */}
                    <div
                      onClick={() => setSelectedFaceId(face.id)}
                      className={`w-72 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 relative cursor-pointer group shadow-sm bg-base-200/40 dark:bg-base-200/20 hover:bg-base-200/70 dark:hover:bg-base-200/30 ${
                        isSelected
                          ? "border-brand-orange ring-2 ring-brand-orange/20 bg-brand-orange/5 dark:bg-brand-orange/10"
                          : "border-base-300/80 hover:border-gray-400 dark:hover:border-gray-500"
                      }`}
                    >
                      {/* Badge status */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {status === "error" && (
                          <span className="badge badge-error text-white text-[10px] px-2 py-0.5 font-bold animate-pulse">Crítico</span>
                        )}
                        {status === "warning" && (
                          <span className="badge badge-warning text-amber-900 bg-amber-200 border-amber-300 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-900/30 text-[10px] px-2 py-0.5 font-bold">Incompleto</span>
                        )}
                        {status === "ok" && (
                          <span className="badge badge-success text-white text-[10px] px-2 py-0.5 font-bold">Listo</span>
                        )}
                      </div>

                      {/* Header Info */}
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-base-content/50">
                          Columna {index + 1}
                        </span>
                        <h3 className="text-lg font-bold text-base-content font-primary mt-1 pr-12 line-clamp-1">
                          {face.name}
                        </h3>

                        {/* Assets Preview Box */}
                        <div className="grid grid-cols-2 gap-2 mt-4 aspect-video bg-base-200 rounded-xl overflow-hidden border border-base-300/70">
                          {/* Day Preview */}
                          <div className="relative bg-base-300/40 flex items-center justify-center overflow-hidden">
                            {face.dayBackground ? (
                              <img
                                src={face.dayBackground}
                                alt="Day background"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Sun className="w-6 h-6 text-base-content/40" />
                            )}
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-bold uppercase">
                              Día
                            </div>
                          </div>
                          {/* Night Preview */}
                          <div className="relative bg-base-300/40 flex items-center justify-center overflow-hidden">
                            {face.nightBackground ? (
                              <img
                                src={face.nightBackground}
                                alt="Night background"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Moon className="w-6 h-6 text-base-content/40" />
                            )}
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded font-bold uppercase">
                              Noche
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Controls and actions */}
                      <div className="mt-8 pt-4 border-t border-base-300/50 flex items-center justify-between">
                        {/* Position Swappers */}
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={index === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(index, "left");
                            }}
                            className="btn btn-xs btn-square bg-base-100 hover:bg-base-200/85 border border-base-300/70 shadow-xs disabled:opacity-30 disabled:pointer-events-none text-base-content"
                            title="Mover a la izquierda"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={index === faces.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMove(index, "right");
                            }}
                            className="btn btn-xs btn-square bg-base-100 hover:bg-base-200/85 border border-base-300/70 shadow-xs disabled:opacity-30 disabled:pointer-events-none text-base-content"
                            title="Mover a la derecha"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Edit & Delete */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenForm(face);
                            }}
                            className="btn btn-xs btn-ghost text-brand-orange hover:bg-brand-orange/10 flex items-center gap-1 font-semibold"
                            title="Editar detalles"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(face.id);
                            }}
                            className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 font-semibold"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transition Connection Node */}
                    {index < faces.length - 1 && (
                       <div className="px-3 flex flex-col items-center group relative z-10 select-none">
                         <div className="w-12 h-10 border border-base-300/80 bg-base-100 rounded-lg flex items-center justify-center shadow-xs cursor-default">
                           <ArrowRightLeft className="w-4 h-4 text-base-content/40 group-hover:text-brand-orange transition-colors" />
                         </div>
                         <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/85 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300 shadow-lg whitespace-nowrap z-50">
                          {`Conexión: Columna ${index + 1} ↔ ${index + 2}`}
                          <div className="text-[9px] text-gray-300 font-normal mt-0.5">
                            {face.dayToRightTransition ? "✓ Transición diurna" : "✗ Falta trans. diurna"}
                          </div>
                          <div className="text-[9px] text-gray-300 font-normal">
                            {faces[index+1].dayToLeftTransition ? "✓ Retorno diurno" : "✗ Falta retorno diurno"}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Configuration Notes/Alerts Sidebar */}
      <div className="w-full lg:w-80 shrink-0 bg-base-100 rounded-2xl border border-base-300/50 p-6 shadow-sm flex flex-col gap-4 font-secondary min-h-[400px]">
        <h2 className="text-lg font-bold text-base-content font-primary border-b pb-3 border-base-300/50">
          Estado de Configuración
        </h2>

        {selectedFace ? (
          <div className="flex flex-col gap-4 flex-1">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                Cara Seleccionada
              </span>
              <h3 className="text-xl font-bold font-primary text-base-content truncate mt-0.5">
                {selectedFace.name}
              </h3>
            </div>

            {/* Alerts & Notes list */}
            {(() => {
              const { critical, warnings, status } = getNotesReport(selectedFace);

              if (status === "ok") {
                return (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-green-600 dark:text-green-400 bg-green-50/30 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30 p-4 rounded-xl gap-2 flex-1 shadow-sm">
                    <CheckCircle2 className="w-12 h-12 text-green-500 dark:text-green-400" />
                    <p className="text-xs font-bold font-primary">¡Configuración Completa!</p>
                    <p className="text-[10px] text-base-content/60 font-normal">
                      Esta cara cuenta con todos los elementos requeridos y opcionales. El showroom funcionará al 100%.
                    </p>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px]">
                  {faces.length === 1 && (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-xl text-xs flex gap-2 shadow-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                      <div>
                        <p className="font-bold">Info: Edificio de 1 Cara</p>
                        <p className="text-[10px] mt-0.5 leading-normal opacity-90">
                          Solo hay una cara configurada en el edificio. No se requieren ni se mostrarán transiciones de rotación.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Critical warnings */}
                  {critical.map((note, idx) => (
                    <div
                      key={`crit-${idx}`}
                      className="p-3.5 bg-red-50/50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-xs flex gap-2.5 shadow-xs font-semibold leading-relaxed animate-fade-in"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </div>
                  ))}

                  {/* Minor warnings */}
                  {warnings.map((note, idx) => (
                    <div
                      key={`warn-${idx}`}
                      className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-xl text-xs flex gap-2.5 font-medium leading-relaxed animate-fade-in shadow-xs"
                    >
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

            <button
              onClick={() => handleOpenForm(selectedFace)}
              className="btn btn-outline border-brand-orange hover:bg-brand-orange hover:border-brand-orange text-brand-orange hover:text-white mt-auto w-full flex items-center gap-2 text-xs py-2 rounded-xl"
            >
              <Edit className="w-4 h-4" />
              Editar Esta Cara
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-base-content/40 py-12 flex-1 gap-2">
            <Building className="w-10 h-10 opacity-20" />
            <p className="text-xs">Selecciona una cara para ver su estado detallado.</p>
          </div>
        )}
      </div>

      {/* Slide-in Edit / Create Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-base-100 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto flex flex-col font-secondary border border-base-300/50">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-base-300/50 pb-4 mb-4">
              <h2 className="text-xl font-bold font-primary text-base-content flex items-center gap-2">
                <Building className="w-5 h-5 text-brand-orange" />
                {editingFace ? `Editar Cara: ${editingFace.name}` : "Agregar Nueva Cara"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn btn-sm btn-circle btn-ghost text-base-content/70 hover:text-base-content"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveFace} className="flex flex-col gap-6 flex-1">
              {formError && (
                <div className="p-3 bg-red-50/50 dark:bg-red-950/20 text-red-500 dark:text-red-400 border border-red-150 dark:border-red-900/30 rounded-lg text-xs font-bold">
                  {formError}
                </div>
              )}

              {/* Step 1: Base Information */}
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-xs text-base-content/80">Nombre de la Cara *</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cara Central / Fachada Derecha"
                  className="input input-bordered w-full text-sm bg-base-200 focus:border-brand-orange text-base-content"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Grid 2 Columns: Day and Night */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DAY ASSETS */}
                <div className="border border-base-300/50 rounded-2xl p-5 flex flex-col gap-4 bg-base-200/20 dark:bg-base-200/5">
                  <h3 className="font-bold text-sm text-base-content border-b pb-2 border-base-300/50 flex items-center gap-2">
                    <Sun className="w-4 h-4 text-brand-orange" />
                    Recursos Diurnos (Día)
                  </h3>
                  
                  <FileUploader
                    label="Fondo de la Cara (Imagen obligatoria) *"
                    value={dayBackground}
                    onChange={setDayBackground}
                    accept="image/*"
                  />
                  <FileUploader
                    label="Video de Fondo (Opcional - Bucle)"
                    value={dayBackgroundVideo}
                    onChange={setDayBackgroundVideo}
                    accept="video/*"
                  />
                  <FileUploader
                    label="Imagen de Highlight (Opcional - Hover Ingresar)"
                    value={dayHighlight}
                    onChange={setDayHighlight}
                    accept="image/*"
                  />
                  <FileUploader
                    label="Transición botón 'Ingresar' (Video Walk diurno)"
                    value={dayIntroVideo}
                    onChange={setDayIntroVideo}
                    accept="video/*"
                  />
                </div>

                {/* NIGHT ASSETS */}
                <div className="border border-base-300/50 rounded-2xl p-5 flex flex-col gap-4 bg-base-200/20 dark:bg-base-200/5">
                  <h3 className="font-bold text-sm text-base-content border-b pb-2 border-base-300/50 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-brand-orange" />
                    Recursos Nocturnos (Noche)
                  </h3>

                  <FileUploader
                    label="Fondo de la Cara (Imagen obligatoria) *"
                    value={nightBackground}
                    onChange={setNightBackground}
                    accept="image/*"
                  />
                  <FileUploader
                    label="Video de Fondo (Opcional - Bucle)"
                    value={nightBackgroundVideo}
                    onChange={setNightBackgroundVideo}
                    accept="video/*"
                  />
                  <FileUploader
                    label="Imagen de Highlight (Opcional - Hover Ingresar)"
                    value={nightHighlight}
                    onChange={setNightHighlight}
                    accept="image/*"
                  />
                  <FileUploader
                    label="Transición botón 'Ingresar' (Video Walk nocturno)"
                    value={nightIntroVideo}
                    onChange={setNightIntroVideo}
                    accept="video/*"
                  />
                </div>
              </div>

              {/* TIMELAPSE TRANSITIONS */}
              <div className="border border-base-300/50 rounded-2xl p-5 flex flex-col gap-4 bg-base-200/20 dark:bg-base-200/5">
                <h3 className="font-bold text-sm text-base-content border-b pb-2 border-base-300/50">
                  Transición de Horarios (Día ↔ Noche)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FileUploader
                    label="Video Transición Día a Noche"
                    value={dayToNightTransition}
                    onChange={setDayToNightTransition}
                    accept="video/*"
                  />
                  <FileUploader
                    label="Video Transición Noche a Día"
                    value={nightToDayTransition}
                    onChange={setNightToDayTransition}
                    accept="video/*"
                  />
                </div>
              </div>

              {/* ROTATION TRANSITIONS (Disabled if faces <= 1) */}
              <div className="border border-base-300/50 rounded-2xl p-5 flex flex-col gap-4 bg-base-200/20 dark:bg-base-200/5">
                <div className="flex items-center justify-between border-b pb-2 border-base-300/50">
                  <h3 className="font-bold text-sm text-base-content">
                    Transición de Rotaciones (Entre Caras)
                  </h3>
                  {faces.length <= 1 && !editingFace && (
                    <span className="text-[10px] font-bold text-red-500 uppercase">
                      Inhabilitado (Solo 1 cara)
                    </span>
                  )}
                </div>

                {faces.length <= 1 && !editingFace ? (
                  <p className="text-xs text-base-content/60 py-2">
                    Las transiciones de rotación se habilitarán cuando crees más de una cara en el edificio.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Day Rotations */}
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                        Rotación Diurna
                      </span>
                      <FileUploader
                        label="Video rotar a la Izquierda"
                        value={dayToLeftTransition}
                        onChange={setDayToLeftTransition}
                        accept="video/*"
                      />
                      <FileUploader
                        label="Video rotar a la Derecha"
                        value={dayToRightTransition}
                        onChange={setDayToRightTransition}
                        accept="video/*"
                      />
                    </div>

                    {/* Night Rotations */}
                    <div className="flex flex-col gap-3">
                      <span className="text-xs font-bold text-brand-orange uppercase tracking-wider">
                        Rotación Nocturna
                      </span>
                      <FileUploader
                        label="Video rotar a la Izquierda"
                        value={nightToLeftTransition}
                        onChange={setNightToLeftTransition}
                        accept="video/*"
                      />
                      <FileUploader
                        label="Video rotar a la Derecha"
                        value={nightToRightTransition}
                        onChange={setNightToRightTransition}
                        accept="video/*"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="modal-action border-t border-base-300/50 pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost text-base-content/60 hover:text-base-content"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 flex items-center gap-2 px-6"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cara
                    </>
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

