"use client";

import { use } from "react";
import { Image } from "lucide-react";

export default function ImagePage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-primary text-brand-orange">Multimedia</h1>
        <p className="text-gray-500 text-sm font-secondary">Gestiona las imágenes, renders y recursos audiovisuales de la plataforma.</p>
      </div>

      <div className="bg-base-100 rounded-lg shadow-sm border border-base-200 p-8 flex flex-col items-center justify-center min-h-[350px] text-center">
        <div className="p-4 rounded-full bg-base-200 text-brand-orange mb-4">
          <Image className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-bold font-primary">Módulo en Desarrollo</h3>
        <p className="text-gray-500 text-sm max-w-md mt-2">
          Este módulo está siendo preparado para su próxima implementación. Pronto podrás gestionar aquí toda la información relacionada con multimedia.
        </p>
      </div>
    </div>
  );
}
