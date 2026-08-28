import React, { useState } from 'react';
import { type Unit } from '@/data/floors';
import { Copy, Check, RotateCcw, Trash2, X, Compass, Code, Layers } from 'lucide-react';

interface PathBuilderProps {
  generatedPath: string;
  points: { x: number; y: number }[];
  center: { x: number; y: number };
  units?: Unit[];
  selectedUnitId?: string | null;
  onSelectUnit?: (unitId: string) => void;
  onUndo: () => void;
  onClear: () => void;
  onClose: () => void;
}

const PathBuilder = ({
  generatedPath,
  points,
  center,
  units = [],
  selectedUnitId,
  onSelectUnit,
  onUndo,
  onClear,
  onClose,
}: PathBuilderProps) => {
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const jsonSnippet = JSON.stringify(
    {
      path: generatedPath,
      x: center.x,
      y: center.y,
    },
    null,
    2
  );

  const handleCopyPath = () => {
    if (!generatedPath) return;
    navigator.clipboard.writeText(generatedPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const handleCopyJson = () => {
    if (!generatedPath) return;
    navigator.clipboard.writeText(jsonSnippet);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-gray-900/95 text-white backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-white/20 animate-fade-in font-sans">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-brand-primary/20 text-brand-primary rounded-lg border border-brand-primary/30">
            <Compass className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              Coordenadas del Piso
            </h3>
            <p className="text-[11px] text-gray-400">
              {points.length} {points.length === 1 ? 'punto marcado' : 'puntos marcados'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          title="Cerrar herramienta"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Unit Selector (if units available) */}
      {units.length > 0 && onSelectUnit && (
        <div className="mb-3">
          <label className="block text-[11px] font-medium text-gray-300 mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-orange-400" />
            Asignar / Previsualizar en Unidad:
          </label>
          <select
            value={selectedUnitId || ''}
            onChange={(e) => onSelectUnit(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none"
          >
            <option value="">-- Ninguna unidad seleccionada --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                Unidad {u.identifier || u.id} ({u.subtitle || 'Dpto'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Generated SVG Path Area */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-semibold text-gray-300 flex items-center gap-1">
            <Code className="w-3 h-3 text-orange-400" />
            SVG Path (<code className="text-orange-300">d="..."</code>):
          </label>
          <button
            onClick={handleCopyPath}
            disabled={!generatedPath}
            className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copiedPath ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar Path</span>
              </>
            )}
          </button>
        </div>
        <textarea
          readOnly
          value={generatedPath || 'Haz clic en la imagen para agregar puntos...'}
          className="w-full h-16 bg-gray-950/80 border border-gray-800 text-gray-200 p-2 rounded-lg font-mono text-[11px] leading-relaxed break-all select-all focus:outline-none focus:border-orange-500/50 resize-none"
          onClick={(e) => e.currentTarget.select()}
        />
      </div>

      {/* JSON Snippet */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Centro aproximado: <strong className="text-white font-mono">x: {center.x}%, y: {center.y}%</strong>
          </span>
          <button
            onClick={handleCopyJson}
            disabled={!generatedPath}
            className="text-[11px] text-gray-300 hover:text-white flex items-center gap-1 font-medium disabled:opacity-40"
          >
            {copiedJson ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">¡JSON Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copiar JSON</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={points.length === 0}
          className="flex-1 py-1.5 px-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-gray-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Deshacer</span>
        </button>

        <button
          onClick={onClear}
          disabled={points.length === 0}
          className="flex-1 py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-medium flex items-center justify-center gap-1 border border-rose-500/30 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpiar</span>
        </button>
      </div>

      {/* Helper text */}
      <p className="mt-3 text-[10px] text-gray-400 text-center leading-normal">
        💡 Haz clic en los vértices del plano para trazar el perímetro. Luego copia el path a <code className="text-orange-300">floors.ts</code>.
      </p>
    </div>
  );
};

export default PathBuilder;
