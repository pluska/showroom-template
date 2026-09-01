"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Text, Rect, Transformer, Group, Circle, Line } from "react-konva";
import useImage from "use-image";
import { Trash2, Plus, Type, Check, RefreshCw, Layers, ArrowUp, Save, ImageOff, LayoutTemplate } from "lucide-react";
import { getCanvasImageUrl } from "@/utils/assets";
import { createCanvasTemplate, CanvasTemplateLayout } from "@/app/actions/templates";
import MediaSidebar from "./MediaSidebar";

interface TextNode {
  id: string;
  text: string;
  color: string;
  fontSize: number;
  x: number;
  y: number;
}

interface MediaNode {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  naturalApplied?: boolean;
}

interface TemplateEditorProps {
  mediaUrls: string[]; // Primera imagen = fondo del lienzo; el resto, capas movibles
  aspectRatio: string;
  targetWidth: number;
  targetHeight: number;
  initialTexts: Array<{ text: string; color: string; fontSize: number }>;
  templateLayout?: CanvasTemplateLayout | null; // Layout de una plantilla guardada (posiciones en espacio del editor)
  showMediaBar?: boolean; // Mostrar la barra lateral de medios arrastrables
  onSave: (imageBase64: string) => void;
  isSaving: boolean;
}

// Capa de imagen arrastrable y redimensionable sobre el lienzo
function OverlayImage({
  node,
  isSelected,
  onSelect,
  onChange,
  onDelete
}: {
  node: MediaNode;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (node: MediaNode) => void;
  onDelete: () => void;
}) {
  const [img] = useImage(getCanvasImageUrl(node.url), "anonymous");
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  // Ajustar la altura a la proporción natural de la imagen al cargarla
  useEffect(() => {
    if (img && !node.naturalApplied && img.width > 0) {
      const ratio = img.height / img.width;
      onChange({ ...node, height: Math.round(node.width * ratio), naturalApplied: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  // Conectar el transformador (manijas de redimensión) al nodo seleccionado
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, img]);

  if (!img) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={img}
        x={node.x}
        y={node.y}
        width={node.width}
        height={node.height}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={onSelect}
        onDragEnd={(e) => onChange({ ...node, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const n = shapeRef.current;
          if (!n) return;
          const scaleX = n.scaleX();
          const scaleY = n.scaleY();
          n.scaleX(1);
          n.scaleY(1);
          onChange({
            ...node,
            x: n.x(),
            y: n.y(),
            width: Math.max(20, n.width() * scaleX),
            height: Math.max(20, n.height() * scaleY)
          });
        }}
      />
      {isSelected && (
        <>
          <Transformer
            ref={trRef}
            rotateEnabled={false}
            anchorStroke="#FF7A00"
            anchorFill="#FFFFFF"
            borderStroke="#FF7A00"
            borderDash={[4, 2]}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 20 || newBox.height < 20 ? oldBox : newBox
            }
          />
          <Group
            x={node.x + node.width}
            y={node.y - 12}
            onClick={(e) => {
              e.cancelBubble = true;
              onDelete();
            }}
            onTap={(e) => {
              e.cancelBubble = true;
              onDelete();
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "pointer";
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = "default";
            }}
          >
            <Circle
              radius={9}
              fill="#EF4444"
              stroke="#FFFFFF"
              strokeWidth={1.5}
              shadowBlur={3}
              shadowColor="black"
              shadowOpacity={0.3}
            />
            <Line
              points={[-3, -3, 3, 3]}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              lineCap="round"
              lineJoin="round"
            />
            <Line
              points={[3, -3, -3, 3]}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              lineCap="round"
              lineJoin="round"
            />
          </Group>
        </>
      )}
    </>
  );
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  mediaUrls,
  aspectRatio,
  targetWidth,
  targetHeight,
  initialTexts,
  templateLayout,
  showMediaBar,
  onSave,
  isSaving
}) => {
  const stageRef = useRef<any>(null);

  // El fondo es estado: puede llegar de los medios seleccionados o soltarse desde la barra lateral
  const [backgroundUrl, setBackgroundUrl] = useState<string>(mediaUrls[0] || "");
  // Cargar imagen de fondo vía proxy same-origin (evita problemas de CORS en el canvas)
  const [image, imageStatus] = useImage(getCanvasImageUrl(backgroundUrl), "anonymous");

  // Dimensiones visuales del lienzo en pantalla, derivadas del formato real
  const visualWidth = 320;
  const visualHeight = Math.round(visualWidth * (targetHeight / targetWidth));

  // Recorte tipo "object-cover" para que el fondo llene el lienzo sin deformarse
  let bgCrop: { x: number; y: number; width: number; height: number } | undefined;
  if (image && image.width > 0 && image.height > 0) {
    const scale = Math.max(visualWidth / image.width, visualHeight / image.height);
    const cropW = visualWidth / scale;
    const cropH = visualHeight / scale;
    bgCrop = {
      x: (image.width - cropW) / 2,
      y: (image.height - cropH) / 2,
      width: cropW,
      height: cropH
    };
  }

  // Capas de imagen adicionales (medios 2..n seleccionados)
  const [overlays, setOverlays] = useState<MediaNode[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

  // Estado de los nodos de texto
  const [texts, setTexts] = useState<TextNode[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState("");

  // Inicializar fondo y capas cuando cambian los medios seleccionados
  useEffect(() => {
    setBackgroundUrl(mediaUrls[0] || "");
    const overlayUrls = mediaUrls.slice(1);
    setOverlays(
      overlayUrls.map((url, idx) => ({
        id: `media-${idx}-${url.slice(-24)}`,
        url,
        x: 24 + idx * 28,
        y: 24 + idx * 28,
        width: Math.round(visualWidth * 0.45),
        height: Math.round(visualWidth * 0.45)
      }))
    );
    setSelectedMediaId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaUrls.join("|")]);

  // Cargar los textos de una plantilla guardada (posiciones exactas en espacio del editor)
  useEffect(() => {
    if (templateLayout && templateLayout.texts && templateLayout.texts.length > 0) {
      setTexts(
        templateLayout.texts.map((t, idx) => ({
          id: `text-tpl-${idx}-${Date.now()}`,
          text: t.text,
          color: t.color || "#FFFFFF",
          fontSize: t.fontSize || 20,
          x: t.x ?? 30,
          y: t.y ?? 40 + idx * 60
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateLayout]);

  // Inyectar los textos sugeridos por la IA sin borrar los textos del usuario
  useEffect(() => {
    if (initialTexts && initialTexts.length > 0) {
      const formatted = initialTexts.map((t, idx) => ({
        id: `text-ai-${idx}-${Date.now()}`,
        text: t.text,
        color: t.color || "#FFFFFF",
        // Escalar tamaño de fuente para el tamaño visual de pantalla
        fontSize: Math.round(t.fontSize / 3) || 16,
        x: 30,
        y: 40 + idx * 60
      }));
      setTexts(prev => [...prev.filter(t => !t.id.startsWith("text-ai-")), ...formatted]);
      setSelectedMediaId(null);
      setSelectedTextId(formatted[0].id);
      setEditingTextValue(formatted[0].text);
    }
  }, [initialTexts]);

  const selectText = (t: TextNode) => {
    setSelectedTextId(t.id);
    setSelectedMediaId(null);
    setEditingTextValue(t.text);
  };

  const selectMedia = (id: string) => {
    setSelectedMediaId(id);
    setSelectedTextId(null);
    setEditingTextValue("");
  };

  const deselectAll = () => {
    setSelectedTextId(null);
    setSelectedMediaId(null);
    setEditingTextValue("");
  };

  // Manejar el cambio del input de texto seleccionado
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditingTextValue(val);
    setTexts(prev =>
      prev.map(t => (t.id === selectedTextId ? { ...t, text: val } : t))
    );
  };

  // Agregar nuevo texto manualmente
  const handleAddText = () => {
    const newId = `text-manual-${Date.now()}`;
    const newNode: TextNode = {
      id: newId,
      text: "Doble clic para editar",
      color: "#FFFFFF",
      fontSize: 20,
      x: visualWidth / 2 - 80,
      y: visualHeight / 2 - 10
    };
    setTexts(prev => [...prev, newNode]);
    setSelectedTextId(newId);
    setSelectedMediaId(null);
    setEditingTextValue(newNode.text);
  };

  // Eliminar el elemento seleccionado (texto o capa de imagen)
  const handleDeleteSelected = () => {
    if (selectedTextId) {
      setTexts(prev => prev.filter(t => t.id !== selectedTextId));
      setSelectedTextId(null);
      setEditingTextValue("");
    } else if (selectedMediaId) {
      setOverlays(prev => prev.filter(o => o.id !== selectedMediaId));
      setSelectedMediaId(null);
    }
  };

  // Traer la capa de imagen seleccionada al frente
  const handleBringToFront = () => {
    if (!selectedMediaId) return;
    setOverlays(prev => {
      const node = prev.find(o => o.id === selectedMediaId);
      if (!node) return prev;
      return [...prev.filter(o => o.id !== selectedMediaId), node];
    });
  };

  // Recibir un medio arrastrado desde la barra lateral y soltado sobre el lienzo
  const [isDragOver, setIsDragOver] = useState(false);
  const handleMediaDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const url = e.dataTransfer.getData("text/plain");
    if (!url) return;

    if (!backgroundUrl) {
      // Sin fondo aún: el medio soltado se convierte en el fondo del lienzo
      setBackgroundUrl(url);
      return;
    }

    // Con fondo: se agrega como capa movible centrada en el punto donde se soltó
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.round(visualWidth * 0.45);
    const dropX = Math.round(e.clientX - rect.left - size / 2);
    const dropY = Math.round(e.clientY - rect.top - size / 2);
    const newNode: MediaNode = {
      id: `media-drop-${Date.now()}`,
      url,
      x: Math.max(0, Math.min(dropX, visualWidth - size)),
      y: Math.max(0, Math.min(dropY, visualHeight - size)),
      width: size,
      height: size
    };
    setOverlays(prev => [...prev, newNode]);
    setSelectedMediaId(newNode.id);
    setSelectedTextId(null);
  };

  // Quitar el fondo actual (el siguiente medio soltado pasará a ser el fondo)
  const handleRemoveBackground = () => {
    setBackgroundUrl("");
  };

  // Guardar la composición actual como plantilla reutilizable
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState<string>("");
  const handleSaveAsTemplate = async () => {
    if (!templateName.trim() || isSavingTemplate) return;
    setIsSavingTemplate(true);
    setTemplateFeedback("");
    try {
      const layout: CanvasTemplateLayout = {
        version: 1,
        texts: texts.map(t => ({
          text: t.text,
          color: t.color,
          fontSize: t.fontSize,
          x: t.x,
          y: t.y
        }))
      };
      await createCanvasTemplate(templateName, targetWidth, targetHeight, aspectRatio, layout);
      setTemplateFeedback("¡Plantilla guardada! La encontrarás en \"Mis Plantillas\".");
      setTemplateName("");
    } catch (err) {
      console.error("Error saving canvas template:", err);
      setTemplateFeedback("Error al guardar la plantilla. Intenta de nuevo.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Cambiar color del texto seleccionado
  const handleColorChange = (color: string) => {
    if (!selectedTextId) return;
    setTexts(prev =>
      prev.map(t => (t.id === selectedTextId ? { ...t, color } : t))
    );
  };

  // Fijar el tamaño de fuente del texto seleccionado (en píxeles de la resolución final)
  const handleFontSizeSet = (targetPx: number) => {
    if (!selectedTextId || Number.isNaN(targetPx)) return;
    const clamped = Math.max(8, Math.min(300, targetPx));
    setTexts(prev =>
      prev.map(t =>
        t.id === selectedTextId ? { ...t, fontSize: clamped / 3 } : t
      )
    );
  };

  // Exportar y Guardar
  const handleExport = () => {
    if (!stageRef.current) return;

    // Deseleccionar para que no se exporten contornos ni manijas de selección
    const currentSelectedText = selectedTextId;
    const currentSelectedMedia = selectedMediaId;
    setSelectedTextId(null);
    setSelectedMediaId(null);

    // Esperar un render tick para exportar
    setTimeout(() => {
      // Calcular factor de escala para exportar a la resolución objetivo real
      const pixelRatio = targetWidth / visualWidth;

      const dataUrl = stageRef.current.toDataURL({
        mimeType: "image/jpeg",
        quality: 0.95,
        pixelRatio: pixelRatio
      });

      // Restaurar selección
      setSelectedTextId(currentSelectedText);
      setSelectedMediaId(currentSelectedMedia);

      // Enviar al callback
      onSave(dataUrl);
    }, 50);
  };

  const selectedText = texts.find(t => t.id === selectedTextId);
  const hasSelection = Boolean(selectedTextId || selectedMediaId);

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
      {/* Columna Izquierda: Lienzo de Edición */}
      <div className="flex flex-col items-center gap-4 bg-gray-50 border border-base-200 rounded-2xl p-6 shadow-inner mx-auto">
        <span className="text-xs uppercase tracking-widest font-bold text-gray-400">
          Mesa de Trabajo ({targetWidth}x{targetHeight} px)
        </span>

        {/* Contenedor del Canvas de Konva (acepta medios arrastrados desde la barra) */}
        <div
          className={`relative bg-white shadow-lg border rounded-lg overflow-hidden flex items-center justify-center select-none transition-all ${
            isDragOver ? "border-brand-orange ring-4 ring-orange-100" : "border-gray-200"
          }`}
          style={{ width: visualWidth, height: visualHeight }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleMediaDrop}
        >
          {!backgroundUrl && overlays.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300 pointer-events-none z-10 p-4 text-center">
              <LayoutTemplate className="w-8 h-8" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Arrastra aquí un medio desde la barra derecha
              </span>
            </div>
          )}
          {backgroundUrl && imageStatus === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 backdrop-blur-xs gap-2 z-10">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-orange" />
              <span className="text-xs font-semibold text-gray-500">Cargando Medios...</span>
            </div>
          )}

          {backgroundUrl && imageStatus === "failed" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/80 gap-1 z-10 p-4 text-center">
              <span className="text-xs font-bold text-red-500">No se pudo cargar la imagen de fondo</span>
              <span className="text-[10px] text-red-400 break-all">{backgroundUrl}</span>
            </div>
          )}

          <Stage
            width={visualWidth}
            height={visualHeight}
            ref={stageRef}
            onMouseDown={(e) => {
              // Si hace click en el fondo (Stage o imagen de fondo), deseleccionar
              const clickedOnEmpty =
                e.target === e.target.getStage() || e.target.name() === "background";
              if (clickedOnEmpty) deselectAll();
            }}
          >
            <Layer>
              {/* Base neutra cuando no hay imagen de fondo (hace visibles los textos claros) */}
              {!image && (
                <Rect
                  name="background"
                  x={0}
                  y={0}
                  width={visualWidth}
                  height={visualHeight}
                  fill="#E5E7EB"
                />
              )}

              {/* Imagen de Fondo del Canvas (cover, sin deformar) */}
              {image && (
                <KonvaImage
                  name="background"
                  image={image}
                  width={visualWidth}
                  height={visualHeight}
                  crop={bgCrop}
                />
              )}

              {/* Capas de imagen adicionales (movibles y redimensionables) */}
              {overlays.map((node) => (
                <OverlayImage
                  key={node.id}
                  node={node}
                  isSelected={node.id === selectedMediaId}
                  onSelect={() => selectMedia(node.id)}
                  onChange={(updated) =>
                    setOverlays(prev => prev.map(o => (o.id === updated.id ? updated : o)))
                  }
                  onDelete={() => {
                    setOverlays(prev => prev.filter(o => o.id !== node.id));
                    setSelectedMediaId(null);
                  }}
                />
              ))}

              {/* Nodos de Texto */}
              {texts.map((t) => {
                const isSelected = t.id === selectedTextId;
                return (
                  <React.Fragment key={t.id}>
                    {/* Rectángulo de selección flotante para feedback visual */}
                    {isSelected && (
                      <>
                        <Rect
                          x={t.x - 4}
                          y={t.y - 4}
                          // Cálculo aproximado de la caja del texto para dibujar el contorno
                          width={t.text.length * (t.fontSize * 0.58) + 8}
                          height={t.fontSize + 8}
                          stroke="#FF7A00"
                          strokeWidth={1.5}
                          dash={[4, 2]}
                          cornerRadius={2}
                        />
                        <Group
                          x={t.x + t.text.length * (t.fontSize * 0.58) + 4}
                          y={t.y - 12}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            setTexts(prev => prev.filter(item => item.id !== t.id));
                            setSelectedTextId(null);
                            setEditingTextValue("");
                          }}
                          onTap={(e) => {
                            e.cancelBubble = true;
                            setTexts(prev => prev.filter(item => item.id !== t.id));
                            setSelectedTextId(null);
                            setEditingTextValue("");
                          }}
                          onMouseEnter={(e) => {
                            const stage = e.target.getStage();
                            if (stage) stage.container().style.cursor = "pointer";
                          }}
                          onMouseLeave={(e) => {
                            const stage = e.target.getStage();
                            if (stage) stage.container().style.cursor = "default";
                          }}
                        >
                          <Circle
                            radius={9}
                            fill="#EF4444"
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            shadowBlur={3}
                            shadowColor="black"
                            shadowOpacity={0.3}
                          />
                          <Line
                            points={[-3, -3, 3, 3]}
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            lineCap="round"
                            lineJoin="round"
                          />
                          <Line
                            points={[3, -3, -3, 3]}
                            stroke="#FFFFFF"
                            strokeWidth={1.5}
                            lineCap="round"
                            lineJoin="round"
                          />
                        </Group>
                      </>
                    )}
                    <Text
                      text={t.text}
                      fontSize={t.fontSize}
                      fill={t.color}
                      fontFamily="Inter, system-ui, sans-serif"
                      fontStyle="bold"
                      x={t.x}
                      y={t.y}
                      draggable
                      onDragStart={() => selectText(t)}
                      onDragEnd={(e) => {
                        setTexts(prev =>
                          prev.map(item =>
                            item.id === t.id
                              ? { ...item, x: e.target.x(), y: e.target.y() }
                              : item
                          )
                        );
                      }}
                      onClick={() => selectText(t)}
                      onTap={() => selectText(t)}
                      // Permitir edición por doble click en el canvas
                      onDblClick={() => {
                        const newText = prompt("Editar texto:", t.text);
                        if (newText !== null) {
                          setTexts(prev =>
                            prev.map(item =>
                              item.id === t.id ? { ...item, text: newText } : item
                            )
                          );
                          setEditingTextValue(newText);
                        }
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </Layer>
          </Stage>
        </div>

        <p className="text-[10px] text-gray-400 font-medium text-center">
          💡 Arrastra los textos y las imágenes libremente sobre el lienzo.<br/>
          Usa las manijas naranjas para redimensionar las imágenes. Doble clic en un texto para editarlo.
        </p>

        {backgroundUrl && (
          <button
            onClick={handleRemoveBackground}
            className="btn btn-xs btn-ghost text-gray-400 hover:text-red-500 gap-1 text-[10px]"
          >
            <ImageOff className="w-3 h-3" />
            Quitar imagen de fondo
          </button>
        )}
      </div>

      {/* Columna Derecha: Panel de Herramientas del Editor */}
      <div className="flex-1 bg-white border border-base-200 rounded-2xl p-6 w-full flex flex-col gap-5">
        <h3 className="text-sm font-bold font-primary text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <Type className="w-4 h-4 text-brand-orange" />
          Herramientas de Diseño
        </h3>

        {/* Acciones Rápidas */}
        <div className="flex gap-2">
          <button
            onClick={handleAddText}
            className="btn btn-sm btn-outline border-base-300 hover:bg-base-100 flex-1 gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5 text-brand-orange" />
            Añadir Texto
          </button>

          {hasSelection && (
            <button
              onClick={handleDeleteSelected}
              className="btn btn-sm btn-outline border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 gap-1 text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </button>
          )}
        </div>

        {/* Configuración del elemento seleccionado */}
        {selectedText ? (
          <div className="border border-base-200 bg-gray-50/50 rounded-xl p-4 flex flex-col gap-4 animate-fade-in">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
              Texto Seleccionado
            </span>

            {/* Input de Contenido */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Contenido del texto:</label>
              <input
                type="text"
                value={editingTextValue}
                onChange={handleTextChange}
                placeholder="Escribe el copy aquí..."
                className="input input-sm border-base-300 focus:border-brand-orange focus:ring-1 focus:ring-orange-100 rounded-lg text-xs"
              />
            </div>

            {/* Paleta de Colores: presets corporativos + selector libre */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Color del texto:</label>
              <div className="flex items-center gap-3">
                {[
                  { name: "Naranja", hex: "#F59C1D" },
                  { name: "Blanco", hex: "#FFFFFF" },
                  { name: "Amarillo", hex: "#FAE200" },
                  { name: "Negro", hex: "#111111" }
                ].map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => handleColorChange(color.hex)}
                    className={`w-7 h-7 rounded-full border shadow-xs transition-transform ${
                      selectedText.color.toUpperCase() === color.hex ? "scale-110 ring-2 ring-brand-orange/40" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex, borderColor: color.hex === "#FFFFFF" ? "#E5E7EB" : color.hex }}
                    title={color.name}
                  >
                    {selectedText.color.toUpperCase() === color.hex && (
                      <Check className={`w-3.5 h-3.5 mx-auto ${color.hex === "#FFFFFF" || color.hex === "#FAE200" ? "text-gray-800" : "text-white"}`} />
                    )}
                  </button>
                ))}

                {/* Selector libre: cualquier color */}
                <label
                  className="relative w-7 h-7 rounded-full border border-gray-200 shadow-xs cursor-pointer overflow-hidden hover:scale-105 transition-transform shrink-0"
                  title="Elegir cualquier color"
                  style={{ background: "conic-gradient(#ef4444, #f59e0b, #84cc16, #06b6d4, #6366f1, #d946ef, #ef4444)" }}
                >
                  <input
                    type="color"
                    value={selectedText.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </label>

                <div className="flex items-center gap-1.5 ml-auto">
                  <span
                    className="w-4 h-4 rounded border border-gray-200 shrink-0"
                    style={{ backgroundColor: selectedText.color }}
                  />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{selectedText.color}</span>
                </div>
              </div>
            </div>

            {/* Selector de Tamaño de Letra: deslizador + valor editable */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500">Tamaño de la tipografía:</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={24}
                  max={240}
                  step={1}
                  value={Math.round(selectedText.fontSize * 3)}
                  onChange={(e) => handleFontSizeSet(Number(e.target.value))}
                  className="range range-xs [--range-shdw:#F59C1D] flex-1"
                />
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={8}
                    max={300}
                    value={Math.round(selectedText.fontSize * 3)}
                    onChange={(e) => handleFontSizeSet(Number(e.target.value))}
                    className="input input-xs w-16 border-base-300 focus:border-brand-orange text-xs font-bold text-center rounded"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">px</span>
                </div>
              </div>
            </div>
          </div>
        ) : selectedMediaId ? (
          <div className="border border-base-200 bg-gray-50/50 rounded-xl p-4 flex flex-col gap-4 animate-fade-in">
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-orange" />
              Capa de Imagen Seleccionada
            </span>
            <p className="text-xs text-gray-500 leading-relaxed">
              Arrastra la imagen para reubicarla o usa las manijas naranjas del lienzo para cambiar su tamaño.
            </p>
            <button
              onClick={handleBringToFront}
              className="btn btn-sm btn-outline border-base-300 hover:bg-base-100 gap-1 text-xs self-start"
            >
              <ArrowUp className="w-3.5 h-3.5 text-brand-orange" />
              Traer al Frente
            </button>
          </div>
        ) : (
          <div className="border border-dashed border-base-300 rounded-xl p-8 text-center text-gray-400 text-xs">
            Selecciona un texto o una imagen en el lienzo para personalizarlos.
          </div>
        )}

        {/* Guardar como Plantilla reutilizable */}
        <div className="border border-base-200 bg-orange-50/30 rounded-xl p-4 flex flex-col gap-2.5">
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 flex items-center gap-1.5">
            <LayoutTemplate className="w-3.5 h-3.5 text-brand-orange" />
            Guardar como Plantilla
          </span>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Guarda la medida del lienzo y la posición de los textos para reutilizarlos con otros medios.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nombre de la plantilla..."
              className="input input-sm border-base-300 focus:border-brand-orange rounded-lg text-xs flex-1"
              disabled={isSavingTemplate}
            />
            <button
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim() || isSavingTemplate}
              className="btn btn-sm btn-outline border-brand-orange/40 text-brand-orange hover:bg-orange-50 hover:border-brand-orange gap-1 text-xs"
            >
              {isSavingTemplate ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Guardar
            </button>
          </div>
          {templateFeedback && (
            <p className={`text-[10px] font-semibold ${templateFeedback.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
              {templateFeedback}
            </p>
          )}
        </div>

        {/* Botón de Finalización */}
        <div className="mt-4 pt-4 border-t border-base-100 flex flex-col gap-2">
          <button
            onClick={handleExport}
            disabled={isSaving || (Boolean(backgroundUrl) && imageStatus !== "loaded")}
            className="btn bg-brand-orange hover:bg-brand-dark-orange text-white border-0 w-full"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Guardando en la nube...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Finalizar y Guardar Publicación
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barra lateral derecha: Medios arrastrables del proyecto */}
      {showMediaBar && <MediaSidebar />}
    </div>
  );
};

export default TemplateEditor;
