import { GeneratedCopy } from "./types";
import config from "@/config/config";

// Respuesta simulada (Modo Demo) cuando no hay motor de IA o la copia falla
export function getMockResponse(prompt: string): GeneratedCopy {
  const line1 = config.company.buildingName.toUpperCase();
  let line2 = "Exclusividad & Confort";

  if (prompt?.toLowerCase().includes("quedan pocas")) {
    line2 = "Quedan pocas unidades";
  }

  return {
    aiResponse: `¡Modo Demo Activo! Procesé tu instrucción: "${prompt}". He inyectado copys sugeridos sobre el lienzo interactivo. Puedes arrastrarlos, editarlos y cambiar sus colores libremente en la mesa de trabajo.`,
    texts: [
      { text: line1, color: "#0E86C7", fontSize: 44 },
      { text: line2, color: "#FFFFFF", fontSize: 24 }
    ]
  };
}

// Mensaje honesto cuando la generación real falla y se usa una imagen de ejemplo
export function getFallbackMessage(err: unknown, aspectRatio: string): string {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("no configurada") || message.toLowerCase().includes("not configured")) {
    return `⚠️ No hay ningún motor de IA configurado (falta la clave de API). Coloqué una imagen de ejemplo (${aspectRatio}) para que puedas seguir trabajando en el lienzo.`;
  }
  if (message.includes("Too Many Requests") || message.toLowerCase().includes("quota")) {
    return `⚠️ El motor de IA rechazó la solicitud por límite de cuota: la clave de API requiere una cuenta con facturación habilitada. Coloqué una imagen de ejemplo (${aspectRatio}) mientras tanto.`;
  }
  return `⚠️ La generación con IA falló (${message.slice(0, 140)}). Coloqué una imagen de ejemplo (${aspectRatio}) para que puedas seguir trabajando en el lienzo.`;
}

// Imagen de ejemplo (placeholder) para el Modo Demo
export function getFallbackImage(_keyword: string): string {
  const luxuryRealEstateImages = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80"
  ];
  const randomIndex = Math.floor(Math.random() * luxuryRealEstateImages.length);
  return luxuryRealEstateImages[randomIndex];
}
