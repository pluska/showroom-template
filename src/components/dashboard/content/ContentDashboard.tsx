"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Trash2, Calendar, Layout, Sparkles, MessageSquare, ImageIcon, ExternalLink, Loader2, ArrowRight, LayoutTemplate, Type, Download, LogOut } from "lucide-react";
import TemplateCard, { Template } from "./TemplateCard";
import MediaSelector from "./MediaSelector";
import AIGenerator from "./AIGenerator";
import { getAssetUrl, getCanvasImageUrl } from "@/utils/assets";
import StepIndicator from "./StepIndicator";
import {
  createSocialContent,
  updateSocialContentReferences,
  deleteSocialContent,
  getSocialContentById,
  getImageQuota,
  getContentStorage,
  type ImageQuota,
  type ContentStorage
} from "@/app/actions/content";
import { getCanvasTemplates, createCanvasTemplate, deleteCanvasTemplate, CanvasTemplateLayout } from "@/app/actions/templates";

type SocialContentItem = {
  id: string;
  title: string;
  platform: string;
  templateType: string;
  width: number;
  height: number;
  aspectRatio: string;
  prompt: string | null;
  resultUrl: string | null;
  referenceUrls: any;
  status: string;
  createdAt: Date | null;
};

interface ContentDashboardProps {
  initialContentList: SocialContentItem[];
}

// Lista de plantillas predefinidas del spec
const AVAILABLE_TEMPLATES: Template[] = [
  { id: "ig_post", platform: "instagram", platformLabel: "Instagram", typeLabel: "Instagram Post (1:1)", width: 1080, height: 1080, aspectRatio: "1:1" },
  { id: "ig_story", platform: "instagram", platformLabel: "Instagram", typeLabel: "Instagram Story (9:16)", width: 1080, height: 1920, aspectRatio: "9:16" },
  { id: "ig_landscape", platform: "instagram", platformLabel: "Instagram", typeLabel: "Instagram Landscape (1.91:1)", width: 1080, height: 566, aspectRatio: "1.91:1" },
  { id: "fb_post_horiz", platform: "facebook", platformLabel: "Facebook", typeLabel: "Post Horizontal (1.91:1)", width: 1200, height: 630, aspectRatio: "1.91:1" },
  { id: "fb_post_square", platform: "facebook", platformLabel: "Facebook", typeLabel: "Post Cuadrado (1:1)", width: 1200, height: 1200, aspectRatio: "1:1" },
  { id: "fb_story", platform: "facebook", platformLabel: "Facebook", typeLabel: "Facebook Story (9:16)", width: 1080, height: 1920, aspectRatio: "9:16" },
  { id: "tt_cover", platform: "tiktok", platformLabel: "TikTok", typeLabel: "TikTok Cover (9:16)", width: 1080, height: 1920, aspectRatio: "9:16" },
  { id: "li_post_horiz", platform: "linkedin", platformLabel: "LinkedIn", typeLabel: "LinkedIn Post (1.91:1)", width: 1200, height: 627, aspectRatio: "1.91:1" },
  { id: "li_post_square", platform: "linkedin", platformLabel: "LinkedIn", typeLabel: "LinkedIn Post (1:1)", width: 1080, height: 1080, aspectRatio: "1:1" },
];

export default function ContentDashboard({ initialContentList }: ContentDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modoParam = searchParams.get("modo") as "manual" | "ia" | null;

  const [contentList, setContentList] = useState<SocialContentItem[]>(initialContentList);
  const [flowStep, setFlowStep] = useState<"list" | "select_mode" | "templates" | "media" | "generate">("list");
  const [modo, setModo] = useState<"manual" | "ia" | null>(null);
  
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedMediaUrls, setSelectedMediaUrls] = useState<string[]>([]);
  const [socialContentId, setSocialContentId] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Contenido pendiente de reabrir: el usuario elige en un modal con qué flujo continuar
  const [reopenItem, setReopenItem] = useState<SocialContentItem | null>(null);

  // Contenido completado a convertir en plantilla reutilizable
  const [templateModalItem, setTemplateModalItem] = useState<SocialContentItem | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateModalFeedback, setTemplateModalFeedback] = useState("");

  // Plantillas de lienzo guardadas por el usuario ("Mis Plantillas")
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  const [templateLayout, setTemplateLayout] = useState<CanvasTemplateLayout | null>(null);

  // Consumo mensual de imágenes: se lee al entrar al módulo y tras cada
  // generación, para que el contador refleje lo que queda disponible.
  const [quota, setQuota] = useState<ImageQuota | null>(null);
  const [storage, setStorage] = useState<ContentStorage | null>(null);
  const refreshQuota = () => {
    getImageQuota()
      .then(setQuota)
      .catch((err) => console.error("Error loading image quota:", err));
    getContentStorage()
      .then(setStorage)
      .catch((err) => console.error("Error loading content storage:", err));
  };
  useEffect(refreshQuota, []);

  // Cargar las plantillas guardadas al entrar al paso de selección
  useEffect(() => {
    if (flowStep === "templates") {
      getCanvasTemplates()
        .then(setCustomTemplates)
        .catch((err) => console.error("Error loading canvas templates:", err));
    }
  }, [flowStep]);

  // Sincronizar el estado con el parámetro 'modo' de la URL
  useEffect(() => {
    if (modoParam === "manual" || modoParam === "ia") {
      setModo(modoParam);
      if (flowStep === "list" || flowStep === "select_mode") {
        setFlowStep("templates");
      }
    } else {
      setModo(null);
      // Solo regresar a list si no estábamos ya editando un paso avanzado
      if (flowStep !== "media" && flowStep !== "generate") {
        setFlowStep("list");
      }
    }
  }, [modoParam]);

  // Iniciar flujo de creación
  const handleStartCreation = () => {
    setSelectedTemplate(null);
    setSelectedMediaUrls([]);
    setSocialContentId("");
    setChatMessages([]);
    setTemplateLayout(null);
    setFlowStep("select_mode");
  };

  const handleSelectModo = (selectedMode: "manual" | "ia") => {
    setModo(selectedMode);
    router.push(`/dashboard/content?modo=${selectedMode}`);
    setFlowStep("templates");
  };

  // Seleccionar plantilla e insertar DRAFT en DB
  const handleSelectTemplate = async (template: Template) => {
    setIsNavigating(true);
    try {
      const title = `Contenido ${template.platformLabel} - ${new Date().toLocaleDateString()}`;

      const newDraft = await createSocialContent(
        title,
        template.platform,
        template.id,
        template.width,
        template.height,
        template.aspectRatio
      );

      if (newDraft) {
        setSocialContentId(newDraft.id);
        setSelectedTemplate(template);
        setTemplateLayout(null);
        setFlowStep("media");
      }
    } catch (error) {
      console.error("Error creating draft content:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  // Seleccionar una plantilla guardada: salta la selección de medios y va
  // directo al editor; los medios se arrastran desde la barra lateral
  const handleSelectCustomTemplate = async (ct: any) => {
    setIsNavigating(true);
    try {
      const title = `${ct.name} - ${new Date().toLocaleDateString()}`;

      const newDraft = await createSocialContent(
        title,
        "custom",
        `custom_${ct.id}`,
        ct.width,
        ct.height,
        ct.aspectRatio
      );

      if (newDraft) {
        setSocialContentId(newDraft.id);
        setSelectedTemplate({
          id: `custom_${ct.id}`,
          platform: "custom" as any,
          platformLabel: "Plantilla",
          typeLabel: `${ct.name} (${ct.aspectRatio})`,
          width: ct.width,
          height: ct.height,
          aspectRatio: ct.aspectRatio
        });
        setSelectedMediaUrls([]);
        setTemplateLayout(ct.layout as CanvasTemplateLayout);
        // El editor de canvas es el del flujo manual
        setModo("manual");
        router.push("/dashboard/content?modo=manual");
        setFlowStep("generate");
      }
    } catch (error) {
      console.error("Error creating draft from custom template:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  // Eliminar una plantilla guardada
  const handleDeleteCustomTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta plantilla guardada?")) return;
    try {
      await deleteCanvasTemplate(id);
      setCustomTemplates(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Error deleting canvas template:", error);
    }
  };

  // Guardar referencias y avanzar a IA
  const handleMediaSelection = async (mediaUrls: string[]) => {
    if (!socialContentId) return;
    setIsNavigating(true);
    try {
      await updateSocialContentReferences(socialContentId, mediaUrls);
      setSelectedMediaUrls(mediaUrls);
      setFlowStep("generate");
    } catch (error) {
      console.error("Error updating references:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  // Reabrir un contenido en el flujo elegido por el usuario (manual o IA).
  // Sin fijar el modo aquí, AIGenerator interpreta modo=null como flujo IA.
  const handleReopenContent = async (item: SocialContentItem, chosenModo: "manual" | "ia") => {
    setReopenItem(null);
    setIsNavigating(true);
    try {
      const fullData = await getSocialContentById(item.id);
      if (fullData) {
        setSocialContentId(fullData.id);
        
        // Encontrar plantilla correspondiente
        const matchingTemplate = AVAILABLE_TEMPLATES.find(t => t.id === fullData.templateType) || {
          id: fullData.templateType,
          platform: fullData.platform as any,
          platformLabel: fullData.platform.toUpperCase(),
          typeLabel: `${fullData.platform.toUpperCase()} Post`,
          width: fullData.width,
          height: fullData.height,
          aspectRatio: fullData.aspectRatio
        };

        setSelectedTemplate(matchingTemplate);
        
        // Parsear referencias
        let refUrls: string[] = [];
        if (fullData.referenceUrls) {
          try {
            refUrls = typeof fullData.referenceUrls === "string" 
              ? JSON.parse(fullData.referenceUrls) 
              : fullData.referenceUrls;
          } catch (e) {
            refUrls = [];
          }
        }
        setSelectedMediaUrls(refUrls);
        setChatMessages(fullData.messages || []);
        setTemplateLayout(null);
        setModo(chosenModo);

        // Ir directo al editor/generador si ya tiene referencias; si no, a medios
        setFlowStep(refUrls.length > 0 ? "generate" : "media");
        router.push(`/dashboard/content?modo=${chosenModo}`);
      }
    } catch (error) {
      console.error("Error reopening content:", error);
    } finally {
      setIsNavigating(false);
    }
  };

  // Eliminar contenido
  const handleDeleteContent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("¿Estás seguro de que deseas eliminar este contenido?")) return;

    try {
      await deleteSocialContent(id);
      setContentList(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting content:", error);
    }
  };

  // Descargar la imagen final de un contenido guardado.
  // Se baja como blob vía el proxy same-origin: el atributo download de un <a>
  // se ignora en URLs cross-origin (R2 público), por eso no basta un enlace directo.
  const handleDownloadContent = async (item: SocialContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.resultUrl || downloadingId) return;
    setDownloadingId(item.id);
    try {
      const response = await fetch(getCanvasImageUrl(item.resultUrl));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const safeTitle = item.title.replace(/[^\w\sáéíóúñÁÉÍÓÚÑ-]/g, "").trim().replace(/\s+/g, "_") || "contenido";
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${safeTitle}.${ext}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (error) {
      console.error("Error downloading content image:", error);
      alert("No se pudo descargar la imagen. Intenta nuevamente.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Abrir el modal para convertir un contenido completado en plantilla
  const handleOpenTemplateModal = (item: SocialContentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setNewTemplateName(item.title);
    setTemplateModalFeedback("");
    setTemplateModalItem(item);
  };

  // Crear la plantilla con la medida del lienzo del contenido completado.
  // Los textos del diseño exportado están aplanados en la imagen: no se pueden extraer.
  const handleCreateTemplateFromContent = async () => {
    if (!templateModalItem || !newTemplateName.trim() || isCreatingTemplate) return;
    setIsCreatingTemplate(true);
    setTemplateModalFeedback("");
    try {
      await createCanvasTemplate(
        newTemplateName.trim(),
        templateModalItem.width,
        templateModalItem.height,
        templateModalItem.aspectRatio,
        { version: 1, texts: [] }
      );
      setTemplateModalFeedback("¡Plantilla guardada! La verás en \"Mis Plantillas\" al crear contenido.");
      setTimeout(() => {
        setTemplateModalItem(null);
        setTemplateModalFeedback("");
      }, 1600);
    } catch (error) {
      console.error("Error creating template from content:", error);
      setTemplateModalFeedback("Error: no se pudo guardar la plantilla. Intenta nuevamente.");
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  // Salir del flujo de creación: vuelve a la vista inicial recargando la lista
  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    setIsNavigating(true);
    window.location.href = "/dashboard/content";
  };

  // Finalizar creación y recargar lista principal
  const handleFinishFlow = async () => {
    setIsNavigating(true);
    try {
      // Recargar la lista principal redirigiendo al estado list
      window.location.reload();
    } catch (error) {
      console.error("Error finalizing content flow:", error);
    }
  };

  return (
    <div className="w-full font-secondary">
      {isNavigating && (
        <div className="fixed inset-0 bg-base-100/60 z-[150] flex items-center justify-center backdrop-blur-xs">
          <Loader2 className="w-8 h-8 animate-spin text-brand-orange" />
        </div>
      )}

      {/* Modal de confirmación para salir del flujo de creación */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            className="bg-base-100 rounded-2xl shadow-xl border border-base-200 p-6 w-full max-w-sm mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <h3 className="font-bold font-primary text-gray-800">Salir del editor</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">Se perderán los cambios ¿Continuar?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="btn btn-sm btn-ghost text-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmExit}
                className="btn btn-sm bg-brand-orange hover:bg-brand-dark-orange text-white border-0"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de elección de flujo al reabrir un contenido guardado */}
      {reopenItem && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={() => setReopenItem(null)}
        >
          <div
            className="bg-base-100 rounded-2xl shadow-xl border border-base-200 p-6 w-full max-w-md mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold font-primary text-gray-800 text-center">
              ¿Cómo quieres continuar trabajando?
            </h3>
            <p className="text-xs text-gray-400 text-center mt-1 mb-6 truncate">
              "{reopenItem.title}"
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleReopenContent(reopenItem, "manual")}
                className="border border-base-200 hover:border-brand-orange/50 hover:shadow-md rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all group cursor-pointer bg-base-100"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layout className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold font-primary text-gray-800 group-hover:text-brand-orange transition-colors">
                  Diseño Manual
                </span>
                <span className="text-[10px] text-gray-400 leading-relaxed">
                  Trabaja sobre el lienzo con tus medios y textos.
                </span>
              </button>

              <button
                onClick={() => handleReopenContent(reopenItem, "ia")}
                className="border border-base-200 hover:border-brand-orange/50 hover:shadow-md rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all group cursor-pointer bg-base-100"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold font-primary text-gray-800 group-hover:text-brand-orange transition-colors">
                  Estudio IA
                </span>
                <span className="text-[10px] text-gray-400 leading-relaxed">
                  Genera imágenes nuevas a partir de tus referencias.
                </span>
              </button>
            </div>

            <button
              onClick={() => setReopenItem(null)}
              className="btn btn-sm btn-ghost text-gray-400 mx-auto block mt-5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal para convertir un contenido completado en plantilla */}
      {templateModalItem && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-xs animate-fade-in"
          onClick={() => !isCreatingTemplate && setTemplateModalItem(null)}
        >
          <div
            className="bg-base-100 rounded-2xl shadow-xl border border-base-200 p-6 w-full max-w-sm mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center shrink-0">
                <LayoutTemplate className="w-5 h-5" />
              </div>
              <h3 className="font-bold font-primary text-gray-800">Convertir en Plantilla</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Se guardará la medida del lienzo ({templateModalItem.width}x{templateModalItem.height} px, {templateModalItem.aspectRatio}) como plantilla reutilizable en "Mis Plantillas".
            </p>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-xs font-semibold text-gray-500">Nombre de la plantilla:</label>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Nombre de la plantilla..."
                className="input input-sm border-base-300 focus:border-brand-orange rounded-lg text-xs w-full"
                disabled={isCreatingTemplate}
              />
            </div>
            {templateModalFeedback && (
              <p className={`text-[11px] font-semibold mb-3 ${templateModalFeedback.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
                {templateModalFeedback}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setTemplateModalItem(null)}
                disabled={isCreatingTemplate}
                className="btn btn-sm btn-ghost text-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTemplateFromContent}
                disabled={!newTemplateName.trim() || isCreatingTemplate}
                className="btn btn-sm bg-brand-orange hover:bg-brand-dark-orange text-white border-0 gap-1.5"
              >
                {isCreatingTemplate ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LayoutTemplate className="w-3.5 h-3.5" />
                )}
                Guardar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {flowStep === "list" && (
        <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
          {/* Cabecera */}
          <div className="border-b pb-5 border-base-300 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold font-primary text-brand-orange flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-brand-orange animate-pulse" />
                Contenido para Redes Sociales
              </h1>
              <p className="text-gray-500 text-sm mt-1">Crea y gestiona creatividades publicitarias automatizadas con Inteligencia Artificial.</p>
            </div>
            <div className="flex items-center gap-4">
              {quota && (
                <div
                  className="hidden sm:flex flex-col items-end gap-1 pr-4 border-r border-base-300"
                  title={`Se reinicia el ${quota.resetsOn}`}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-lg font-bold leading-none ${quota.remaining === 0 ? "text-error" : "text-brand-orange"}`}>
                      {quota.used}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">/ {quota.limit} imágenes</span>
                  </div>
                  <progress
                    className={`progress w-32 h-1.5 ${quota.remaining === 0 ? "progress-error" : "progress-warning"}`}
                    value={quota.used}
                    max={quota.limit}
                  />
                  <span className="text-[10px] text-gray-400 capitalize">
                    {quota.remaining === 0 ? `Sin cupo · reinicia el ${quota.resetsOn}` : `${quota.remaining} restantes en ${quota.period}`}
                  </span>
                </div>
              )}
              {storage && (
                <div className="hidden md:flex flex-col items-end gap-1 pr-4 border-r border-base-300">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-lg font-bold leading-none ${storage.percent >= 90 ? "text-error" : "text-brand-orange"}`}>
                      {storage.usedLabel}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">/ {storage.limitLabel}</span>
                  </div>
                  <progress
                    className={`progress w-32 h-1.5 ${storage.percent >= 90 ? "progress-error" : "progress-warning"}`}
                    value={storage.percent}
                    max={100}
                  />
                  <span className="text-[10px] text-gray-400">Almacenamiento usado</span>
                </div>
              )}
              <button
                onClick={handleStartCreation}
                className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear nuevo
              </button>
            </div>
          </div>

          {/* Renderizado de lista o empty state */}
          {contentList.length === 0 ? (
            /* Empty State: Pergamino + Pluma + Tintero en SVG */
            <div className="bg-base-100 rounded-2xl shadow-xs border border-base-200 py-20 px-8 flex flex-col items-center justify-center text-center max-w-2xl mx-auto mt-8 animate-scale-in">
              <div className="w-64 h-48 mb-8 flex items-center justify-center">
                {/* SVG Ilustración Pluma, Pergamino y Tintero en Tonos Grises */}
                <svg className="w-full h-full text-gray-200" viewBox="0 0 400 300" fill="none">
                  {/* Fondo o Aura suave */}
                  <circle cx="200" cy="150" r="100" fill="currentColor" fillOpacity="0.15" />
                  
                  {/* Pergamino */}
                  <path d="M120 70 C120 70, 160 50, 240 50 C280 50, 280 90, 240 90 L160 90 C120 90, 120 130, 160 130 L240 130 C280 130, 280 170, 240 170 L140 170 C110 170, 110 200, 140 200" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M140 170 L240 170 C280 170, 280 210, 240 210 L160 210 C120 210, 120 250, 160 250 C240 250, 280 230, 280 230" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M140 110 L220 110" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
                  <path d="M140 150 L200 150" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
                  <path d="M140 190 L220 190" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
                  
                  {/* Tintero */}
                  <path d="M110 210 L150 210 L160 250 L100 250 Z" fill="#6B7280" />
                  <rect x="120" y="195" width="20" height="15" rx="2" fill="#4B5563" />
                  <path d="M125 195 L125 185 L135 185 L135 195 Z" fill="#374151" />
                  {/* Sello o etiqueta del tintero */}
                  <rect x="115" y="220" width="30" height="20" rx="2" fill="#D1D5DB" fillOpacity="0.9" />
                  
                  {/* Pluma */}
                  <g transform="translate(140, 60) rotate(-35)">
                    {/* Eje de la pluma */}
                    <path d="M10 200 L10 -20" stroke="#374151" strokeWidth="3" strokeLinecap="round" />
                    {/* Cuerpo de la pluma */}
                    <path d="M10 -20 C25 20, 25 80, 10 120 C-5 80, -5 20, 10 -20" fill="#E5E7EB" stroke="#9CA3AF" strokeWidth="2" />
                    {/* Cortes del plumaje */}
                    <path d="M22 30 L10 40 M23 60 L10 70 M20 90 L10 100 M-2 30 L10 40 M-3 60 L10 70" stroke="#9CA3AF" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              <h2 className="text-xl font-bold font-primary text-gray-800 mb-2">No hay contenido generado</h2>
              <p className="text-gray-400 text-sm max-w-sm mb-8 leading-relaxed">Comienza creando tu primera publicación optimizada por Inteligencia Artificial para tus redes sociales.</p>
              
              <button 
                onClick={handleStartCreation}
                className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 px-8 py-3 h-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear contenido
              </button>
            </div>
          ) : (
            /* Grid de contenido generado previamente */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contentList.map((item) => {
                const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-";
                const isCompleted = item.status === "COMPLETED";
                
                return (
                  <div
                    key={item.id}
                    onClick={() => setReopenItem(item)}
                    className="card bg-base-100 shadow-xs border border-base-200 hover:border-brand-orange/40 hover:shadow-md transition-all cursor-pointer overflow-hidden group flex flex-col justify-between"
                  >
                    {/* Visual Preview */}
                    <div className="h-44 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                      {item.resultUrl ? (
                        <img src={getAssetUrl(item.resultUrl)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="text-center p-6 text-gray-400 flex flex-col items-center gap-1.5 bg-gray-50 w-full h-full justify-center">
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sin Imagen Generada</span>
                        </div>
                      )}
                      
                      {/* Estado */}
                      <div className="absolute top-3 right-3">
                        <span className={`badge border-0 font-bold py-2 px-3 uppercase text-[9px] ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : item.status === 'GENERATING' 
                              ? 'bg-amber-500 text-white animate-pulse' 
                              : 'bg-gray-400 text-white'
                        }`}>
                          {item.status === 'COMPLETED' ? 'Completado' : item.status === 'GENERATING' ? 'Generando' : 'Borrador'}
                        </span>
                      </div>
                    </div>

                    {/* Meta datos */}
                    <div className="p-5 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        <span>{item.platform}</span>
                        <span>•</span>
                        <span>{item.width}x{item.height} px</span>
                      </div>
                      
                      <h3 className="font-bold text-gray-800 font-primary text-sm group-hover:text-brand-orange transition-colors truncate">
                        {item.title}
                      </h3>

                      {item.prompt && (
                        <p className="text-[11px] text-gray-400 line-clamp-2 min-h-[32px] italic bg-gray-50 p-2 rounded border border-gray-100">
                          "{item.prompt}"
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-base-200">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {dateStr}
                        </span>
                        
                        <div className="flex gap-2">
                          {isCompleted && (
                            <button
                              onClick={(e) => handleOpenTemplateModal(item, e)}
                              className="btn btn-ghost btn-xs text-gray-500 hover:text-brand-orange hover:bg-orange-50 p-1.5 rounded"
                              title="Convertir en Plantilla"
                            >
                              <LayoutTemplate className="w-4 h-4" />
                            </button>
                          )}
                          {item.resultUrl && (
                            <button
                              onClick={(e) => handleDownloadContent(item, e)}
                              disabled={downloadingId === item.id}
                              className="btn btn-ghost btn-xs text-gray-500 hover:text-brand-orange hover:bg-orange-50 p-1.5 rounded"
                              title="Descargar imagen"
                            >
                              {downloadingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDeleteContent(item.id, e)}
                            className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50 p-1.5 rounded"
                            title="Eliminar contenido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {flowStep === "select_mode" && (
        <div className="w-full max-w-4xl mx-auto pb-12 animate-fade-in font-secondary">
          <div className="border-b pb-5 border-base-300 flex justify-between items-center mb-10">
            <div>
              <h1 className="text-xl font-bold font-primary text-gray-800">
                Elige tu flujo de creación
              </h1>
              <p className="text-gray-400 text-xs mt-1">Selecciona la forma en que deseas componer tu pieza publicitaria.</p>
            </div>
            <button
              onClick={() => {
                router.push("/dashboard/content");
                setFlowStep("list");
              }}
              className="btn btn-sm btn-ghost hover:bg-base-200 text-xs text-gray-500"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
            {/* Tarjeta A: Diseño Manual */}
            <div 
              onClick={() => handleSelectModo("manual")}
              className="card bg-base-100 border border-base-200 hover:border-brand-orange/40 hover:shadow-lg transition-all p-8 cursor-pointer group flex flex-col items-center text-center justify-between min-h-[260px] animate-scale-in"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Layout className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-primary text-gray-800 mb-2 group-hover:text-brand-orange transition-colors">
                  Diseño Manual
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed max-w-[280px]">
                  Usa renders y fotos existentes del proyecto para armar tu pieza publicitaria rápidamente.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-brand-orange group-hover:gap-2 transition-all">
                Iniciar Composición <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Tarjeta B: Estudio Creativo IA */}
            <div 
              onClick={() => handleSelectModo("ia")}
              className="card bg-base-100 border border-base-200 hover:border-brand-orange/40 hover:shadow-lg transition-all p-8 cursor-pointer group flex flex-col items-center text-center justify-between min-h-[260px] animate-scale-in [animation-delay:100ms]"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-50 text-brand-orange flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-primary text-gray-800 mb-2 group-hover:text-brand-orange transition-colors">
                  Estudio Creativo IA
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed max-w-[280px]">
                  Genera nuevos conceptos visuales y fusiones con Inteligencia Artificial partiendo de referencias.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-[11px] font-bold text-brand-orange group-hover:gap-2 transition-all">
                Iniciar Estudio IA <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {flowStep !== "list" && flowStep !== "select_mode" && (
        <div className="w-full max-w-6xl mx-auto pb-12">
          {/* Componente superior del flujo de pasos */}
          <div className="bg-base-100 rounded-2xl shadow-xs border border-base-200 p-6 mb-6 relative">
            <StepIndicator
              currentStep={
                flowStep === "templates" ? 1 : flowStep === "media" ? 2 : 3
              }
              finalStepLabel={modo === "manual" ? "Editor Canvas" : "Generación IA"}
            />
            <button
              onClick={() => setShowExitConfirm(true)}
              className="btn btn-sm btn-outline border-base-300 text-gray-500 hover:bg-red-50 hover:border-red-300 hover:text-red-500 gap-1.5 text-xs absolute top-4 right-4"
              title="Volver a la vista inicial"
            >
              <LogOut className="w-3.5 h-3.5" />
              Salir
            </button>
          </div>

          {/* Renderizado dinámico del paso actual */}
          {flowStep === "templates" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="border-b pb-4 border-base-200 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold font-primary text-gray-800">Selecciona una Plantilla</h2>
                  <p className="text-gray-400 text-sm mt-0.5">Elige el formato de publicación óptimo para tu campaña en redes sociales.</p>
                </div>
                <button
                  onClick={() => {
                    router.push("/dashboard/content");
                    setFlowStep("select_mode");
                  }}
                  className="btn btn-xs btn-outline border-base-300 text-gray-500 hover:bg-base-100 text-[10px]"
                >
                  Cambiar Flujo
                </button>
              </div>
              {/* Mis Plantillas: composiciones guardadas por el usuario */}
              {customTemplates.length > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-brand-orange" />
                    <h3 className="text-sm font-bold font-primary text-gray-800 uppercase tracking-wider">
                      Mis Plantillas
                    </h3>
                    <span className="badge badge-sm bg-orange-50 text-brand-orange border-0 font-bold text-[10px]">
                      {customTemplates.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 -mt-2">
                    Al usar una plantilla guardada irás directo al editor: arrastra los medios al lienzo desde la barra derecha.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {customTemplates.map((ct) => {
                      const textCount = (ct.layout as CanvasTemplateLayout)?.texts?.length || 0;
                      return (
                        <div
                          key={ct.id}
                          onClick={() => handleSelectCustomTemplate(ct)}
                          className="card bg-base-100 border border-brand-orange/20 hover:border-brand-orange/60 hover:shadow-lg transition-all p-5 cursor-pointer group flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                              <LayoutTemplate className="w-5 h-5" />
                            </div>
                            <button
                              onClick={(e) => handleDeleteCustomTemplate(ct.id, e)}
                              className="btn btn-ghost btn-xs text-red-400 hover:bg-red-50 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Eliminar plantilla"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-800 font-primary text-sm group-hover:text-brand-orange transition-colors truncate">
                              {ct.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400 font-semibold">
                              <span>{ct.width}x{ct.height} px</span>
                              <span className="badge badge-xs bg-orange-50 text-brand-orange border-brand-orange/20 font-bold px-1.5">{ct.aspectRatio}</span>
                              <span className="flex items-center gap-0.5">
                                <Type className="w-3 h-3" />
                                {textCount} {textCount === 1 ? "texto" : "textos"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-brand-orange group-hover:gap-2 transition-all mt-auto">
                            Usar Plantilla <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-b border-base-200 mt-2" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {AVAILABLE_TEMPLATES.map((tmpl) => (
                  <TemplateCard
                    key={tmpl.id}
                    template={tmpl}
                    onSelect={handleSelectTemplate}
                  />
                ))}
              </div>
            </div>
          )}

          {flowStep === "media" && selectedTemplate && (
            <MediaSelector
              template={selectedTemplate}
              modo={modo}
              onBack={() => {
                // Si vuelve atrás, limpiar la URL del modo si el usuario lo desea, o mantenerla
                setFlowStep("templates");
              }}
              onContinue={handleMediaSelection}
            />
          )}

          {flowStep === "generate" && selectedTemplate && (
            <AIGenerator
              socialContentId={socialContentId}
              template={selectedTemplate}
              referenceUrls={selectedMediaUrls}
              initialMessages={chatMessages}
              modo={modo}
              templateLayout={templateLayout}
              onBackToMedia={() => setFlowStep("media")}
              onFinish={handleFinishFlow}
              onQuotaChange={refreshQuota}
            />
          )}
        </div>
      )}
    </div>
  );
}
