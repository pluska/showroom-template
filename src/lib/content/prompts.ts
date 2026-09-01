import config from "@/config/config";

// Instrucción maestra para la generación de imágenes con jerarquía de referencias.
// El modelo recibe imágenes con ROLES distintos (subject/composition/style) y NO
// debe tratarlas por igual: el edificio del SUBJECT es la fuente de verdad.
export function buildImageInstruction(prompt: string): string {
  return `You are an expert Art Director for luxury real estate advertising photography.

Use the attached images as MANDATORY references.

The building, its architecture, materials, colors, proportions, geometry, facade, windows, doors and all important architectural characteristics must remain EXACTLY as they appear in the reference images.

Do NOT invent a new building.
Do NOT redesign the building.
Do NOT alter its architecture.

Apply the following user instruction ONLY to the composition, environment, lighting, atmosphere and photographic style, while preserving the real building from the references photorealistically:

"${prompt}"

Generate a single final image with premium professional architectural photography quality.`;
}

// Encabezados que se insertan justo antes de cada grupo de imágenes para que el
// modelo sepa el rol del bloque de referencias que viene a continuación.
export const SUBJECT_BLOCK = `
--- BEGIN SUBJECT REFERENCES ---

These images show the REAL BUILDING.

They are the authoritative architectural source of truth.

Preserve the building's identity, architecture, materials, proportions and important architectural details.

--- END SUBJECT REFERENCES ---
`;

export const COMPOSITION_BLOCK = `
--- BEGIN COMPOSITION REFERENCES ---

These images are references for the desired composition, scene concept, camera angle, framing and interaction.

Use their visual concept when relevant.

Do NOT copy their architecture or replace the real SUBJECT building with another building.

--- END COMPOSITION REFERENCES ---
`;

export const STYLE_BLOCK = `
--- BEGIN STYLE REFERENCES ---

These images are visual inspiration for lighting, atmosphere, color palette, photographic treatment and overall visual style.

Use their visual treatment when relevant.

Do NOT copy unrelated architecture, people, objects, logos or text.

--- END STYLE REFERENCES ---
`;

// Prompt de sistema para la generación de copys publicitarios (flujo manual).
// El modelo responde SOLO con JSON para inyectar los textos en el lienzo.
export function buildCopySystemPrompt(prompt: string): string {
  return `Eres un diseñador gráfico y publicista de marketing digital de lujo experto en Real Estate para la inmobiliaria "${config.company.realStateName}".
Tu tarea es analizar la instrucción del usuario y proponer copys o textos publicitarios ideales que se colocarán como capas sobre la imagen.

Debes responder ÚNICAMENTE con un objeto JSON válido (sin envolver en bloques de código markdown, sin texto extra) con la siguiente estructura:
{
  "aiResponse": "Una explicación breve y profesional de tu propuesta en español para el usuario.",
  "texts": [
    {
      "text": "Texto principal del anuncio (ej: ${config.company.buildingName.toUpperCase()})",
      "color": "Código hexadecimal del color del texto (debe contrastar excelente con la referencia, ej. azul #0E86C7, blanco #FFFFFF, amarillo #F2C53D, negro #111111)",
      "fontSize": Tamaño de fuente recomendado en píxeles (entre 20 y 60)"
    },
    {
      "text": "Texto secundario o llamada a la acción (ej: Quedan pocas unidades)",
      "color": "Código hexadecimal del color",
      "fontSize": Tamaño de fuente recomendado (entre 16 y 32)
    }
  ]
}

Instrucción del usuario: ${prompt}`;
}
