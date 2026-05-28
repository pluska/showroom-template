"use client";

import { use } from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-primary text-brand-orange">Features</h1>
        <p className="text-gray-500 text-sm font-secondary">Configuración global de características y especificaciones del showroom.</p>
      </div>

      <div className="bg-base-100 rounded-lg shadow-sm border border-base-200 p-8 flex flex-col items-center justify-center min-h-[350px] text-center">
        <div className="p-4 rounded-full bg-base-200 text-brand-orange mb-4">
          <Settings className="w-12 h-12" />
        </div>
        <h3 className="text-lg font-bold font-primary">Módulo en Desarrollo</h3>
        <p className="text-gray-500 text-sm max-w-md mt-2">
          Este módulo está siendo preparado para su próxima implementación. Pronto podrás gestionar aquí toda la información relacionada con features.
        </p>
      </div>
    </div>
  );
}
