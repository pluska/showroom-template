"use client";

import { useState, useEffect } from "react";
import { Loader2, FileImage, GripVertical } from "lucide-react";
import { getMedia } from "@/app/actions/media";
import { getContentImageSources } from "@/app/actions/content";
import { getAssetUrl } from "@/utils/assets";

type MediaItem = {
  id: string;
  title: string;
  url: string;
};

// Barra lateral de medios del proyecto: las imágenes se arrastran al lienzo
export default function MediaSidebar() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Todo el multimedia no eliminado (el estado "activo" solo aplica al sitio
    // público) + renders de fachada del edificio + contenido ya generado
    Promise.all([getMedia(), getContentImageSources().catch(() => ({ renders: [], pastContent: [] }))])
      .then(([mediaItems, sources]) => {
        const images = mediaItems
          .filter((m) => m.type?.startsWith("image/"))
          .map((m) => ({ id: m.id, title: m.title, url: m.url }));
        const renders = (sources.renders || []).map((r) => ({ id: r.id, title: r.title, url: r.url }));
        const past = (sources.pastContent || []).map((p) => ({ id: p.id, title: p.title, url: p.url }));
        setItems([...renders, ...images, ...past]);
      })
      .catch((err) => console.error("Error loading media sidebar:", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="w-full xl:w-52 shrink-0 bg-white border border-base-200 rounded-2xl p-4 flex flex-col gap-3 max-h-[560px]">
      <h3 className="text-xs font-bold font-primary text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
        <FileImage className="w-3.5 h-3.5 text-brand-orange" />
        Medios del Proyecto
      </h3>
      <p className="text-[10px] text-gray-400 leading-relaxed">
        Arrastra una imagen y suéltala sobre el lienzo. La primera se usa de fondo.
      </p>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin text-brand-orange" />
          <span className="text-[10px]">Cargando medios...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-[10px]">
          No hay imágenes en el proyecto.
        </div>
      ) : (
        /* El scroll va fuera del grid: con overflow sobre el propio grid, este
           toma altura definida y las filas automaticas se estiran, haciendo que
           las miniaturas cuadradas desborden y se amontonen. */
        <div className="overflow-y-auto scrollbar-thin pr-1 min-h-0">
        <div className="grid grid-cols-3 xl:grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", item.url);
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="relative rounded-lg overflow-hidden border border-base-200 aspect-square bg-gray-50 cursor-grab active:cursor-grabbing hover:border-brand-orange/60 hover:shadow-md transition-all group"
              title={item.title}
            >
              <img
                src={getAssetUrl(item.url)}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[8px] text-white font-semibold truncate flex items-center gap-0.5">
                  <GripVertical className="w-2.5 h-2.5 shrink-0" />
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
