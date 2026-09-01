import { ImageReference, ImageReferenceType } from "./types";

const VALID_TYPES: ImageReferenceType[] = ["subject", "composition", "style"];

// Normaliza la entrada de referencias del request. Acepta tanto el formato
// antiguo (string[] de URLs) como el nuevo (ImageReference[] con rol). Las URLs
// sin rol se asumen "subject": preservar el edificio real es siempre la prioridad.
export function normalizeReferences(input: unknown): ImageReference[] {
  if (!Array.isArray(input)) return [];

  const result: ImageReference[] = [];
  for (const item of input) {
    if (typeof item === "string") {
      if (item) result.push({ url: item, type: "subject" });
    } else if (item && typeof item.url === "string" && item.url) {
      const type: ImageReferenceType = VALID_TYPES.includes(item.type) ? item.type : "subject";
      result.push({ url: item.url, type });
    }
  }
  return result;
}
