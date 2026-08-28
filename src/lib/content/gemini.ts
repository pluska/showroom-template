import { getImageBase64 } from "./media";
import { ImageReference, GeneratedImage, GeneratedCopy } from "./types";

// NOTA: Gemini está deshabilitado en la UI (solo se usa OpenAI). Este módulo se
// conserva íntegro para poder reactivarlo en el futuro sin reescribir la lógica.

// Umbral por imagen para adjuntarla inline; por encima se usa la Files API de
// Gemini (el request inline completo no puede superar los 20 MB).
const GEMINI_INLINE_LIMIT_BYTES = 6 * 1024 * 1024;

function toGeminiRatio(aspectRatio: string): string {
  if (aspectRatio === "9:16") return "9:16";
  if (aspectRatio === "16:9" || aspectRatio === "1.91:1") return "16:9";
  if (aspectRatio === "4:3") return "4:3";
  if (aspectRatio === "3:4") return "3:4";
  return "1:1";
}

// Subir una imagen grande a la Files API de Gemini y devolver su fileUri
export async function uploadToGeminiFiles(
  bytes: Buffer,
  mimeType: string,
  geminiKey: string
): Promise<string> {
  const startResponse = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${geminiKey}`,
    {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file: { display_name: `reference_${Date.now()}` } }),
    }
  );

  const uploadUrl = startResponse.headers.get("x-goog-upload-url");
  if (!startResponse.ok || !uploadUrl) {
    throw new Error(`Gemini Files API start error: ${startResponse.statusText}`);
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "X-Goog-Upload-Command": "upload, finalize",
      "X-Goog-Upload-Offset": "0",
    },
    body: new Uint8Array(bytes),
  });

  if (!uploadResponse.ok) {
    throw new Error(`Gemini Files API upload error: ${uploadResponse.statusText}`);
  }

  const uploadData = await uploadResponse.json();
  let file = uploadData.file;

  // Las imágenes suelen quedar ACTIVE de inmediato; esperar si sigue procesando
  for (let i = 0; i < 5 && file?.state === "PROCESSING"; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const statusResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${file.name}?key=${geminiKey}`
    );
    if (statusResponse.ok) file = await statusResponse.json();
  }

  if (!file?.uri || (file.state && file.state !== "ACTIVE")) {
    throw new Error(`Gemini Files API: el archivo no quedó activo (estado: ${file?.state})`);
  }
  return file.uri;
}

// Generar imagen con Gemini: edición con referencias (gemini-2.5-flash-image) o
// texto → imagen con Imagen 3 cuando no hay referencias.
export async function generateGeminiImage(
  prompt: string,
  references: ImageReference[],
  aspectRatio: string,
  geminiKey: string
): Promise<GeneratedImage> {
  const geminiRatio = toGeminiRatio(aspectRatio);
  const hasReferences = references.length > 0;
  let base64Bytes: string | undefined;
  let resultMime = "image/jpeg";
  let aiResponse = "";

  if (hasReferences) {
    console.log("Generando composición con Gemini 2.5 Flash Image (referencias)...");
    const imageParts: any[] = [];
    for (const ref of references) {
      try {
        const { base64, contentType } = await getImageBase64(ref.url);
        const bytes = Buffer.from(base64, "base64");
        if (bytes.byteLength > GEMINI_INLINE_LIMIT_BYTES) {
          console.log(`Referencia grande (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB), subiendo a Files API...`);
          const fileUri = await uploadToGeminiFiles(bytes, contentType, geminiKey);
          imageParts.push({ fileData: { mimeType: contentType, fileUri } });
        } else {
          imageParts.push({ inlineData: { mimeType: contentType, data: base64 } });
        }
      } catch (e) {
        console.error("Error loading reference image:", e);
      }
    }

    if (imageParts.length === 0) {
      throw new Error("No se pudo cargar ninguna imagen de referencia");
    }

    const editInstruction = `Eres un Director de Arte experto en fotografía publicitaria de Real Estate de lujo.
Usa las imágenes adjuntas como REFERENCIA OBLIGATORIA: el edificio, su arquitectura, materiales, colores y proporciones deben mantenerse EXACTAMENTE como aparecen en las referencias. NO inventes un edificio nuevo ni alteres su diseño.
Aplica la siguiente instrucción del usuario únicamente sobre la composición, el entorno, la iluminación y el estilo fotográfico, integrando el edificio real de las referencias de forma fotorrealista:

"${prompt}"

Genera una única imagen final con calidad de fotografía arquitectónica profesional premium.`;

    const nanoResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [...imageParts, { text: editInstruction }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: geminiRatio },
          },
        }),
      }
    );

    if (!nanoResponse.ok) {
      const errBody = await nanoResponse.text();
      throw new Error(`Gemini Image error: ${nanoResponse.statusText} - ${errBody}`);
    }

    const nanoData = await nanoResponse.json();
    const parts = nanoData.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData?.data);
    base64Bytes = imagePart?.inlineData?.data;
    resultMime = imagePart?.inlineData?.mimeType || "image/png";

    if (!base64Bytes) {
      throw new Error("Gemini Image no devolvió ninguna imagen en la respuesta");
    }
    aiResponse =
      "¡Listo! He generado la nueva imagen combinando tus referencias con la instrucción, manteniendo la arquitectura original del proyecto.";
  } else {
    console.log("Generando imagen desde cero con Imagen 3...");
    const imagenResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: geminiRatio, outputMimeType: "image/jpeg" },
        }),
      }
    );

    if (!imagenResponse.ok) {
      const errBody = await imagenResponse.text();
      throw new Error(`Imagen 3 error: ${imagenResponse.statusText} - ${errBody}`);
    }
    const imagenData = await imagenResponse.json();
    base64Bytes = imagenData.predictions?.[0]?.bytesBase64Encoded;
    resultMime = "image/jpeg";
    aiResponse = "¡Listo! He generado una nueva imagen con Imagen 3 a partir de tu instrucción.";
  }

  if (!base64Bytes) {
    throw new Error("Gemini no devolvió ninguna imagen");
  }
  return { base64: base64Bytes, mime: resultMime, aiResponse };
}

// Generar copys publicitarios (JSON) con Gemini para el flujo manual del lienzo
export async function generateGeminiCopy(
  _prompt: string,
  systemPrompt: string,
  geminiKey: string
): Promise<GeneratedCopy> {
  console.log("Generando copys con Gemini...");
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini Copy API error: ${response.statusText}`);
  }

  const data = await response.json();
  const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const parsed = JSON.parse(jsonText);
  return {
    aiResponse: parsed.aiResponse || "He generado copys sugeridos para tu banner.",
    texts: parsed.texts || [],
  };
}
