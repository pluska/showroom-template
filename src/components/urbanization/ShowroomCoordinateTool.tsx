"use client";

// ============================================================================
// HERRAMIENTA DE TRAZADO Y MARCADO DE COORDENADAS PARA EL SHOWROOM
// ----------------------------------------------------------------------------
// Permite trazar polígonos y puntos clicando directamente sobre cualquier
// pantalla del showroom (Master Plan, Fases, Zonas, Torres, Plantas, etc.).
//
// Incluye dos modos de interacción:
//   - ➕ Modo Cruz (Marcar/Trazar): Clic para agregar nuevos vértices
//   - ✋ Modo Mano (Mover/Arrastrar): Arrastra el polígono o cuadro completo
// ============================================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Code,
  Compass,
  Copy,
  Crosshair,
  Hand,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  MousePointer,
  Move,
  Plus,
  RotateCcw,
  Square,
  Trash2,
  X,
} from 'lucide-react';

export interface Point {
  x: number;
  y: number;
}

export type ExportFormat = 'path' | 'hotspot' | 'fullHotspot' | 'polygon' | 'unit';
export type ToolMode = 'draw' | 'move';

interface ShowroomCoordinateToolProps {
  isOpen: boolean;
  onToggle: () => void;
  activeStepName: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * El escenario ajustado del paso activo (ver `FitStage`). Es el rectángulo
   * que ocupa la imagen de verdad, y por tanto el ÚNICO espacio en el que una
   * coordenada significa algo: medir contra la ventana daría números que solo
   * valen en la pantalla en la que se tomaron. Si el paso no tiene escenario
   * —la portada, los lados—, se cae al contenedor de la página.
   */
  stageEl?: HTMLElement | null;
}

/**
 * Calcula el centroide geométrico de un polígono cerrado (o la media aritmética
 * si tiene menos de 3 puntos o es colineal).
 */
function calculateCentroid(points: Point[], precision: number = 1): Point {
  if (points.length === 0) return { x: 50, y: 50 };
  if (points.length === 1) {
    return {
      x: Number(points[0].x.toFixed(precision)),
      y: Number(points[0].y.toFixed(precision)),
    };
  }
  if (points.length === 2) {
    return {
      x: Number(((points[0].x + points[1].x) / 2).toFixed(precision)),
      y: Number(((points[0].y + points[1].y) / 2).toFixed(precision)),
    };
  }

  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const factor = points[i].x * points[j].y - points[j].x * points[i].y;
    area += factor;
    cx += (points[i].x + points[j].x) * factor;
    cy += (points[i].y + points[j].y) * factor;
  }

  area = area / 2;

  if (Math.abs(area) < 0.001) {
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return {
      x: Number(avgX.toFixed(precision)),
      y: Number(avgY.toFixed(precision)),
    };
  }

  cx = cx / (6 * area);
  cy = cy / (6 * area);

  return {
    x: Number(cx.toFixed(precision)),
    y: Number(cy.toFixed(precision)),
  };
}

export default function ShowroomCoordinateTool({
  isOpen,
  onToggle,
  activeStepName,
  containerRef,
  stageEl = null,
}: ShowroomCoordinateToolProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [toolMode, setToolMode] = useState<ToolMode>('draw');
  const [mousePos, setMousePos] = useState<Point | null>(null);
  // El indicador flotante se coloca con la posición REAL del puntero, no con
  // el porcentaje: el porcentaje es del escenario y el indicador va `fixed`.
  const [cursorClient, setCursorClient] = useState<Point | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('fullHotspot');
  const [precision, setPrecision] = useState<number>(1);
  const [unitNumber, setUnitNumber] = useState<number>(1);

  // Estado para arrastre
  const [dragState, setDragState] = useState<{
    type: 'vertex' | 'all';
    vertexIdx?: number;
    startPoint: Point;
    initialPoints: Point[];
  } | null>(null);

  // SVG Path generado
  const generatedPath = useMemo(() => {
    if (points.length === 0) return '';
    const d = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(precision)} ${p.y.toFixed(precision)}`)
      .join(' ');
    return points.length >= 3 ? `${d} Z` : d;
  }, [points, precision]);

  // Centroide
  const center = useMemo(() => calculateCentroid(points, precision), [points, precision]);

  // Snippets formateados
  const formattedCode = useMemo(() => {
    switch (selectedFormat) {
      case 'path':
        return generatedPath;
      case 'hotspot':
        return JSON.stringify({ x: center.x, y: center.y }, null, 2);
      case 'fullHotspot':
        return `hotspot: {\n  x: ${center.x},\n  y: ${center.y},\n  path: '${generatedPath}',\n}`;
      case 'polygon':
        return `polygon: [\n${points
          .map((p) => `  { x: ${p.x.toFixed(precision)}, y: ${p.y.toFixed(precision)} },`)
          .join('\n')}\n]`;
      case 'unit':
        return `{ number: ${unitNumber}, x: ${center.x}, y: ${center.y}, path: '${generatedPath}' },`;
      default:
        return generatedPath;
    }
  }, [selectedFormat, generatedPath, center, points, precision, unitNumber]);

  const handleCopy = useCallback((text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }, []);

  const handleUndo = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleClear = useCallback(() => {
    setPoints([]);
    setMousePos(null);
    setCursorClient(null);
    setDragState(null);
  }, []);

  // Convertir coordenadas del cliente a % relativo al escenario de la imagen
  const clientToPercent = useCallback(
    (clientX: number, clientY: number): Point => {
      const el = stageEl || containerRef.current || document.body;
      const rect = el.getBoundingClientRect();
      const x = Number(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)).toFixed(precision));
      const y = Number(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)).toFixed(precision));
      return { x, y };
    },
    [stageEl, containerRef, precision],
  );

  // Iniciar arrastre de todo el polígono
  const startDragAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (points.length === 0) return;
      const current = clientToPercent(e.clientX, e.clientY);
      setDragState({
        type: 'all',
        startPoint: current,
        initialPoints: [...points],
      });
    },
    [points, clientToPercent],
  );

  // Iniciar arrastre de un vértice individual
  const startDragVertex = useCallback(
    (e: React.MouseEvent, idx: number) => {
      e.stopPropagation();
      const current = clientToPercent(e.clientX, e.clientY);
      setDragState({
        type: 'vertex',
        vertexIdx: idx,
        startPoint: current,
        initialPoints: [...points],
      });
    },
    [points, clientToPercent],
  );

  // Clic sobre el lienzo principal
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isOpen || dragState !== null) return;
      if ((e.target as HTMLElement).closest?.('.coord-tool-panel')) return;

      // Solo agregar puntos si estamos en modo 'draw'
      if (toolMode === 'draw') {
        const p = clientToPercent(e.clientX, e.clientY);
        setPoints((prev) => [...prev, p]);
      }
    },
    [isOpen, dragState, toolMode, clientToPercent],
  );

  // Movimiento del cursor sobre el lienzo
  const handleOverlayMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isOpen) return;

      const p = clientToPercent(e.clientX, e.clientY);
      setCursorClient({ x: e.clientX, y: e.clientY });

      if (dragState) {
        if (dragState.type === 'vertex' && dragState.vertexIdx !== undefined) {
          // Arrastrar solo un vértice
          setPoints((prev) => {
            const next = [...prev];
            next[dragState.vertexIdx!] = p;
            return next;
          });
        } else if (dragState.type === 'all') {
          // Arrastrar todo el conjunto de coordenadas
          const dx = p.x - dragState.startPoint.x;
          const dy = p.y - dragState.startPoint.y;

          setPoints(
            dragState.initialPoints.map((pt) => ({
              x: Number(Math.max(0, Math.min(100, pt.x + dx)).toFixed(precision)),
              y: Number(Math.max(0, Math.min(100, pt.y + dy)).toFixed(precision)),
            })),
          );
        }
      } else {
        setMousePos(p);
      }
    },
    [isOpen, dragState, clientToPercent, precision],
  );

  const handleMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Atajos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (points.length > 0) {
          handleClear();
        } else {
          onToggle();
        }
      } else if (e.key.toLowerCase() === 'm' && !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        setToolMode('move');
      } else if (e.key.toLowerCase() === 'd' && !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        setToolMode('draw');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleUndo, handleClear, onToggle, points.length]);

  const drawingOverlay = (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onClick={handleOverlayClick}
          onMouseMove={handleOverlayMouseMove}
          onMouseUp={handleMouseUp}
          className={`absolute inset-0 w-full h-full z-40 select-none ${
            dragState?.type === 'all'
              ? 'cursor-grabbing'
              : toolMode === 'move'
              ? 'cursor-grab'
              : 'cursor-crosshair'
          }`}
        >
          {/* Polígono relleno semitransparente (arrastrable) */}
          {points.length >= 2 && (
            <polygon
              points={points.map((p) => `${p.x},${p.y}`).join(' ')}
              onMouseDown={startDragAll}
              className={`transition-colors duration-200 ${
                toolMode === 'move'
                  ? 'fill-amber-500/35 stroke-amber-300 stroke-[0.35] cursor-grab active:cursor-grabbing hover:fill-amber-500/50'
                  : 'fill-amber-500/25 stroke-white stroke-[0.25] hover:fill-amber-500/35 cursor-move'
              }`}
            />
          )}

          {/* Línea guía hasta el cursor (solo en modo 'draw') */}
          {toolMode === 'draw' && points.length > 0 && mousePos && !dragState && (
            <line
              x1={points[points.length - 1].x}
              y1={points[points.length - 1].y}
              x2={mousePos.x}
              y2={mousePos.y}
              stroke="#f59e0b"
              strokeWidth="0.25"
              strokeDasharray="1 1"
            />
          )}

          {/* Línea cerrando con el primer punto si hay >= 2 (en modo 'draw') */}
          {toolMode === 'draw' && points.length >= 2 && mousePos && !dragState && (
            <line
              x1={mousePos.x}
              y1={mousePos.y}
              x2={points[0].x}
              y2={points[0].y}
              stroke="#ffffff"
              strokeWidth="0.15"
              strokeDasharray="0.8 0.8"
              opacity="0.5"
            />
          )}

          {/* Marcador del centroide calculado con Manija para Mover Todo */}
          {points.length >= 2 && (
            <g
              transform={`translate(${center.x}, ${center.y})`}
              onMouseDown={startDragAll}
              className="cursor-grab active:cursor-grabbing group/center"
            >
              <circle r="1.8" className="fill-amber-400/20 group-hover/center:fill-amber-400/40 transition-colors" />
              <circle r="1.1" className="fill-black/80 stroke-amber-400 stroke-[0.25]" />
              <circle r="0.4" className="fill-amber-300" />
              <text
                x="2.4"
                y="0.4"
                fontSize="1.3"
                className="fill-amber-300 font-mono font-bold select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
              >
                ✋ Arrastrar ({center.x}%, {center.y}%)
              </text>
            </g>
          )}

          {/* Vértices colocados con números (arrastrables individualmente) */}
          {points.map((p, i) => (
            <g
              key={`vertex-${i}`}
              onMouseDown={(e) => startDragVertex(e, i)}
              className="cursor-move group"
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="1.2"
                className="fill-black/70 stroke-amber-400 stroke-[0.25] group-hover:scale-125 transition-transform"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="0.5"
                className="fill-white"
              />
              <text
                x={p.x}
                y={p.y - 1.8}
                textAnchor="middle"
                fontSize="1.5"
                fontWeight="bold"
                className="fill-white font-mono select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
              >
                {i + 1}
              </text>
            </g>
          ))}
        </svg>
  );

  return (
    <>
      {/* Botón flotante para abrir/cerrar la herramienta en el Showroom */}
      <button
        type="button"
        onClick={onToggle}
        className={`fixed top-5 left-18 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur-md border text-xs font-semibold uppercase tracking-wider transition-all duration-300 shadow-2xl cursor-pointer ${
          isOpen
            ? 'bg-amber-600 border-white text-white ring-2 ring-amber-400 scale-105'
            : 'bg-black/65 border-white/20 text-white/90 hover:text-white hover:bg-black/85'
        }`}
        title="Herramienta para trazar polígonos y marcar coordenadas"
      >
        <Compass size={15} className={isOpen ? 'text-white animate-spin [animation-duration:12s]' : 'text-amber-400'} />
        <span className="hidden md:inline">
          {isOpen ? 'Trazado Activo' : 'Marcar Coordenadas'}
        </span>
      </button>

      {/*
        La capa de trazado se monta DENTRO del escenario de la imagen, no sobre
        la página: es lo que hace que el `viewBox 0 0 100 100` del lienzo y el
        de los recortes de la zona sean el mismo espacio. Puesta sobre la
        página, un polígono trazado aquí caería desplazado al pintarlo allí.
      */}
      {isOpen && (stageEl ? createPortal(drawingOverlay, stageEl) : drawingOverlay)}

      {/* Indicador flotante cerca del cursor */}
      {isOpen && mousePos && !dragState && (
        <div
          style={{ left: cursorClient?.x ?? 0, top: cursorClient?.y ?? 0 }}
          className="fixed pointer-events-none z-50 transform translate-x-4 -translate-y-4 px-2.5 py-1 bg-black/85 backdrop-blur-md border border-white/20 rounded-md text-[10px] text-amber-300 font-mono shadow-lg flex items-center gap-1.5"
        >
          {toolMode === 'draw' ? <Plus size={10} className="text-amber-400" /> : <Hand size={10} className="text-amber-400" />}
          <span>X: {mousePos.x}% | Y: {mousePos.y}%</span>
        </div>
      )}

      {/* Panel / Drawer flotante con inspector y herramientas */}
      {isOpen && (
        <div className="coord-tool-panel fixed bottom-6 right-6 z-50 w-84 sm:w-96 bg-neutral-950/95 text-white backdrop-blur-2xl p-4 sm:p-5 rounded-2xl shadow-2xl border border-amber-500/30 animate-in fade-in duration-200 font-sans">
          {/* Barra de título */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Compass size={16} />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white flex items-center gap-1.5">
                  Marcador de Coordenadas
                </h3>
                <p className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {activeStepName} · {points.length} {points.length === 1 ? 'punto' : 'puntos'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsMinimized((prev) => !prev)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title={isMinimized ? 'Expandir panel' : 'Minimizar panel'}
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                title="Cerrar herramienta"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="mt-3 space-y-3">
              {/* Barra de herramientas: Modo Cruz (Marcar) vs Modo Mano (Mover) */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
                  Modo de interacción:
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-neutral-900/90 p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setToolMode('draw')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      toolMode === 'draw'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-neutral-300 hover:text-white hover:bg-white/5'
                    }`}
                    title="Modo Cruz: Clic en la imagen para agregar vértices"
                  >
                    <Plus size={14} className={toolMode === 'draw' ? 'text-white' : 'text-amber-400'} />
                    <span>Marcar / Cruz</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setToolMode('move')}
                    disabled={points.length === 0}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      toolMode === 'move'
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'text-neutral-300 hover:text-white hover:bg-white/5'
                    }`}
                    title="Modo Mano: Arrastra el cuadro o polígono completo desde el centro o interior"
                  >
                    <Hand size={14} className={toolMode === 'move' ? 'text-white' : 'text-amber-400'} />
                    <span>Mover / Mano</span>
                  </button>
                </div>
              </div>

              {/* Selector de formato de exportación */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-neutral-400 font-semibold mb-1.5">
                  Formato de salida:
                </label>
                <div className="grid grid-cols-3 gap-1 bg-neutral-900/80 p-1 rounded-xl border border-white/10 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('fullHotspot')}
                    className={`py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedFormat === 'fullHotspot'
                        ? 'bg-amber-500 text-white shadow'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Hotspot + Path
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('path')}
                    className={`py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedFormat === 'path'
                        ? 'bg-amber-500 text-white shadow'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Solo Path
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('hotspot')}
                    className={`py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedFormat === 'hotspot'
                        ? 'bg-amber-500 text-white shadow'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Centro &#123;x, y&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('polygon')}
                    className={`py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer ${
                      selectedFormat === 'polygon'
                        ? 'bg-amber-500 text-white shadow'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Polígono []
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFormat('unit')}
                    className={`py-1 px-2 rounded-lg font-medium transition-colors cursor-pointer col-span-2 ${
                      selectedFormat === 'unit'
                        ? 'bg-amber-500 text-white shadow'
                        : 'text-neutral-300 hover:text-white'
                    }`}
                  >
                    Slot Unidad (Depto)
                  </button>
                </div>
              </div>

              {/* Si es formato de unidad, permitir ingresar número */}
              {selectedFormat === 'unit' && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-neutral-900 rounded-xl border border-white/10 text-xs">
                  <span className="text-neutral-400">Número de unidad:</span>
                  <input
                    type="number"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(Number(e.target.value) || 1)}
                    className="w-16 bg-neutral-950 border border-neutral-700 px-2 py-1 rounded text-right font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Textarea con código generado y botón de copiar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Centroide: x: <strong className="text-amber-400">{center.x}%</strong>, y:{' '}
                    <strong className="text-amber-400">{center.y}%</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPrecision((p) => (p === 1 ? 2 : 1))}
                      className="text-[9px] text-neutral-400 hover:text-white font-mono bg-neutral-900 px-1.5 py-0.5 rounded border border-white/10 cursor-pointer"
                      title="Cambiar decimales de precisión"
                    >
                      {precision} dec
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(formattedCode, 'code')}
                      disabled={!formattedCode}
                      className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold disabled:opacity-40 cursor-pointer"
                    >
                      {copiedKey === 'code' ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={formattedCode || 'Haz clic sobre la imagen para comenzar a trazar...'}
                  rows={4}
                  className="w-full bg-neutral-900 border border-neutral-800 text-amber-200/90 p-2.5 rounded-xl font-mono text-[11px] leading-relaxed select-all focus:outline-none focus:border-amber-500/50 resize-none"
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>

              {/* Botones de acción rápida: Deshacer y Limpiar */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={points.length === 0}
                  className="flex-1 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-neutral-200 text-xs font-medium flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                  title="Deshacer último vértice (Ctrl+Z)"
                >
                  <RotateCcw size={13} />
                  <span>Deshacer</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={points.length === 0}
                  className="flex-1 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 border border-rose-500/30 transition-colors cursor-pointer"
                  title="Limpiar todos los puntos (Esc)"
                >
                  <Trash2 size={13} />
                  <span>Limpiar</span>
                </button>
              </div>

              {/* Guía rápida */}
              <p className="text-[10px] text-neutral-400 text-center leading-normal pt-1 border-t border-white/5">
                💡 <strong>Cruz</strong> para marcar vértices. <strong>Mano</strong> o arrastra desde el <strong>Centro</strong> para mover el cuadro completo.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
