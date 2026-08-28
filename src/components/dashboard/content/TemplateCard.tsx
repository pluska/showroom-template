import { Layout, MessageSquare, Video, ArrowRight } from "lucide-react";

export type Template = {
  id: string;
  platform: "facebook" | "instagram" | "tiktok" | "linkedin";
  platformLabel: string;
  typeLabel: string;
  width: number;
  height: number;
  aspectRatio: string; // '1:1', '9:16', '1.91:1', etc.
};

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  // Obtener icono correspondiente a la plataforma
  const getPlatformIcon = (platform: Template["platform"]) => {
    switch (platform) {
      case "facebook":
        return (
          <svg className="w-4 h-4 fill-blue-600" viewBox="0 0 24 24">
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
          </svg>
        );
      case "instagram":
        return (
          <svg className="w-4 h-4 fill-pink-600" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      case "tiktok":
        return (
          <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.17-.17-.25-.26-.1.15-.17.33-.23.51-.43 1.52-1.34 2.9-2.58 3.84a8.17 8.17 0 0 1-5.07 1.73c-2.48-.06-4.93-1.22-6.38-3.21a8.18 8.18 0 0 1-.95-7.46c.71-2.24 2.45-4.09 4.67-4.88 1.77-.63 3.73-.55 5.43.21.07.03.14.07.22.1v4.19c-.3-.15-.62-.27-.95-.36a4.135 4.135 0 0 0-5.23 2.9c-.39 1.57.25 3.33 1.63 4.15 1.34.8 3.14.7 4.38-.26.96-.75 1.47-1.97 1.49-3.19-.02-3.12-.01-6.24-.02-9.36z" />
          </svg>
        );
      case "linkedin":
        return (
          <svg className="w-4 h-4 fill-blue-700" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
        );
    }
  };

  // Renderizar un layout SVG ilustrativo correspondiente a la proporción
  const renderSVGPreview = (ratio: string) => {
    switch (ratio) {
      case "9:16":
        return (
          <svg className="w-full h-full text-gray-300" viewBox="0 0 100 160" fill="none">
            <rect x="5" y="5" width="90" height="150" rx="6" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
            {/* Cabecera / Stories */}
            <circle cx="20" cy="20" r="8" fill="currentColor" fillOpacity="0.2" />
            <rect x="33" y="14" width="40" height="5" rx="2" fill="currentColor" fillOpacity="0.3" />
            <rect x="33" y="22" width="20" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
            {/* Imagen principal */}
            <rect x="15" y="38" width="70" height="85" rx="4" fill="currentColor" fillOpacity="0.1" />
            <path d="M25 105 L45 80 L60 95 L75 75 L85 105 Z" fill="currentColor" fillOpacity="0.15" />
            <circle cx="35" cy="55" r="5" fill="currentColor" fillOpacity="0.15" />
            {/* CTA o barra inferior */}
            <rect x="25" y="132" width="50" height="10" rx="3" fill="currentColor" fillOpacity="0.25" />
          </svg>
        );
      case "1.91:1":
        return (
          <svg className="w-full h-full text-gray-300" viewBox="0 0 160 100" fill="none">
            <rect x="5" y="15" width="150" height="70" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
            {/* Card Layout Horizontal */}
            <rect x="15" y="25" width="70" height="50" rx="2" fill="currentColor" fillOpacity="0.1" />
            <path d="M20 70 L40 50 L55 60 L68 45 L80 70 Z" fill="currentColor" fillOpacity="0.15" />
            {/* Texto al costado */}
            <rect x="95" y="28" width="50" height="6" rx="2" fill="currentColor" fillOpacity="0.3" />
            <rect x="95" y="38" width="40" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
            <rect x="95" y="46" width="45" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
            <rect x="95" y="62" width="30" height="8" rx="2" fill="currentColor" fillOpacity="0.25" />
          </svg>
        );
      case "1:1":
      default:
        return (
          <svg className="w-full h-full text-gray-300" viewBox="0 0 120 120" fill="none">
            <rect x="10" y="10" width="100" height="100" rx="6" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
            {/* Layout Cuadrado */}
            <circle cx="28" cy="28" r="8" fill="currentColor" fillOpacity="0.2" />
            <rect x="42" y="22" width="45" height="5" rx="2" fill="currentColor" fillOpacity="0.3" />
            <rect x="42" y="30" width="25" height="4" rx="2" fill="currentColor" fillOpacity="0.2" />
            {/* Caja de Imagen */}
            <rect x="20" y="44" width="80" height="45" rx="3" fill="currentColor" fillOpacity="0.1" />
            <path d="M25 89 L45 69 L60 79 L80 60 L95 89 Z" fill="currentColor" fillOpacity="0.15" />
            {/* Iconos de Interacción */}
            <circle cx="28" cy="100" r="4" fill="currentColor" fillOpacity="0.3" />
            <circle cx="40" cy="100" r="4" fill="currentColor" fillOpacity="0.2" />
            <circle cx="52" cy="100" r="4" fill="currentColor" fillOpacity="0.2" />
          </svg>
        );
    }
  };

  return (
    <div 
      onClick={() => onSelect(template)}
      className="card bg-base-100 border border-base-200 hover:border-brand-orange/50 hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between font-secondary h-full"
    >
      {/* Vista previa ilustrativa */}
      <div className="h-44 bg-gray-50 flex items-center justify-center p-6 border-b border-base-100 group-hover:bg-orange-50/20 transition-colors">
        <div className="h-full flex items-center justify-center aspect-video max-w-full">
          {renderSVGPreview(template.aspectRatio)}
        </div>
      </div>

      {/* Clúster de texto */}
      <div className="p-4 flex flex-col gap-2">
        {/* Icono y plataforma */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold uppercase tracking-wider">
          {getPlatformIcon(template.platform)}
          <span>{template.platformLabel}</span>
        </div>

        {/* Tipo de publicación */}
        <h3 className="font-bold text-gray-800 font-primary text-sm group-hover:text-brand-orange transition-colors">
          {template.typeLabel}
        </h3>

        {/* Dimensiones y Aspect Ratio */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-base-100">
          <span className="text-xs text-gray-400 font-medium">
            {template.width} x {template.height} px
          </span>
          <span className="badge badge-sm bg-orange-50 text-brand-orange font-bold border-brand-orange/20 px-2 py-2">
            {template.aspectRatio}
          </span>
        </div>
      </div>
    </div>
  );
}
