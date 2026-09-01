// Tipos compartidos del generador de contenido para RRSS

// Rol de cada imagen de referencia dentro de la jerarquía de generación:
// - subject: el proyecto inmobiliario real (fuente de verdad de la arquitectura)
// - composition: referencia de composición/escena (ángulo, encuadre, interacción)
// - style: inspiración visual (iluminación, atmósfera, tratamiento fotográfico)
export type ImageReferenceType = "subject" | "composition" | "style";

export interface ImageReference {
  url: string;
  type: ImageReferenceType;
}

export type EngineId = "openai" | "gemini";
export type WorkMode = "manual" | "ia";

// Resultado de una generación de imagen (aún sin subir a R2)
export interface GeneratedImage {
  base64: string;
  mime: string;
  aiResponse: string;
}

export interface CopyText {
  text: string;
  color: string;
  fontSize: number;
}

// Resultado de una generación de copys para el lienzo
export interface GeneratedCopy {
  aiResponse: string;
  texts: CopyText[];
}
