import { getAssetUrl } from "@/utils/assets";

// Convertir una URL de imagen a base64 para enviarla a modelos multimodales.
// Resuelve rutas relativas del proxy same-origin contra el origen de la app.
export async function getImageBase64(url: string): Promise<{ base64: string; contentType: string }> {
  try {
    const absoluteUrl = getAssetUrl(url);
    let finalUrl = absoluteUrl;
    if (!absoluteUrl.startsWith("http")) {
      const origin = process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";
      finalUrl = `${origin}${absoluteUrl.startsWith("/") ? "" : "/"}${absoluteUrl}`;
    }

    const response = await fetch(finalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";
    return { base64, contentType };
  } catch (err) {
    console.error(`Error converting image to base64 (${url}):`, err);
    throw err;
  }
}

// Tamaño de salida soportado por gpt-image según la proporción del lienzo
export function pickImageSize(aspectRatio: string): string {
  if (aspectRatio === "9:16" || aspectRatio === "3:4") return "1024x1536";
  if (aspectRatio === "16:9" || aspectRatio === "1.91:1" || aspectRatio === "4:3") return "1536x1024";
  return "1024x1024";
}

// Guardar una imagen generada (base64) en R2 y devolver su URL pública o de
// proxy (en dev). Si no hay binding de R2, devuelve un data URL como fallback.
export async function saveGeneratedImage(
  env: any,
  base64: string,
  mime: string,
  source: string
): Promise<string> {
  const extension = mime === "image/png" ? "png" : "jpg";

  if (env?.R2) {
    const key = `media/social_content/generated_${source}_${Date.now()}.${extension}`;
    const buffer = Buffer.from(base64, "base64");
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    await env.R2.put(key, arrayBuffer, { httpMetadata: { contentType: mime } });

    const isDev = process.env.NODE_ENV === "development";
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
    return isDev ? `/api/r2/${key}` : `${r2PublicUrl}/${key}`;
  }

  return `data:${mime};base64,${base64}`;
}
