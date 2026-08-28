import { getImageBase64, pickImageSize } from "./media";
import { buildImageInstruction } from "./prompts";
import { ImageReference, GeneratedImage, GeneratedCopy } from "./types";

// Modelos configurables por entorno para poder ajustarlos sin tocar el código.
const ORCHESTRATOR_MODEL = process.env.OPENAI_ORCHESTRATOR_MODEL || "gpt-5";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1.5";
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium";
const COPY_MODEL = process.env.OPENAI_COPY_MODEL || "gpt-4o";

// Generar una imagen con la Responses API de OpenAI. El modelo de texto orquesta
// la herramienta image_generation razonando sobre las referencias.
export async function generateOpenAIImage(
  prompt: string,
  references: ImageReference[],
  aspectRatio: string,
  apiKey: string
): Promise<GeneratedImage> {
  const size = pickImageSize(aspectRatio);
  const hasReferences = references.length > 0;

  const messageContent: any[] = [];
  let aiResponse = "";

  if (hasReferences) {
    messageContent.push({ type: "input_text", text: buildImageInstruction(prompt) });

    for (const ref of references) {
      try {
        const { base64, contentType } = await getImageBase64(ref.url);
        messageContent.push({
          type: "input_image",
          image_url: `data:${contentType};base64,${base64}`,
        });
      } catch (error) {
        console.error(`Error cargando referencia (${ref.url}):`, error);
      }
    }

    aiResponse =
      "¡Listo! He generado la nueva imagen con OpenAI combinando tus referencias con la instrucción.";
  } else {
    messageContent.push({ type: "input_text", text: prompt });
    aiResponse = "¡Listo! He generado una nueva imagen con OpenAI a partir de tu instrucción.";
  }

  console.log(
    `OpenAI Responses API → orquestador: ${ORCHESTRATOR_MODEL}, imagen: ${IMAGE_MODEL}, ` +
      `referencias: ${references.length}, tamaño: ${size}`
  );

  const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: ORCHESTRATOR_MODEL,
      input: [{ role: "user", content: messageContent }],
      tools: [
        {
          type: "image_generation",
          model: IMAGE_MODEL,
          size,
          quality: IMAGE_QUALITY,
          // input_fidelity "high" preserva con mucha más fidelidad los detalles
          // de las imágenes de entrada (la arquitectura real del edificio)
          input_fidelity: "high",
        },
      ],
    }),
  });

  if (!openaiResponse.ok) {
    const errorBody = await openaiResponse.text();
    console.error("OpenAI Responses API Error:", errorBody);
    throw new Error(
      `OpenAI Responses API error: ${openaiResponse.status} ${openaiResponse.statusText} - ${errorBody}`
    );
  }

  const openaiData = await openaiResponse.json();

  const imageGenerationCall = openaiData.output?.find(
    (item: any) => item.type === "image_generation_call"
  );
  const base64Image = imageGenerationCall?.result;

  if (!base64Image) {
    console.error("Respuesta completa de OpenAI:", JSON.stringify(openaiData, null, 2));
    throw new Error("OpenAI no devolvió ninguna imagen en la respuesta");
  }

  return { base64: base64Image, mime: "image/png", aiResponse };
}

// Generar copys publicitarios (JSON) con OpenAI para el flujo manual del lienzo
export async function generateOpenAICopy(
  prompt: string,
  systemPrompt: string,
  apiKey: string
): Promise<GeneratedCopy> {
  console.log(`Generando copys con OpenAI (${COPY_MODEL})...`);
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: COPY_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Instrucción del usuario: ${prompt}` },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Copy error: ${response.statusText}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0]?.message?.content || "{}");
  return {
    aiResponse: parsed.aiResponse || "He redactado copys sugeridos para tu banner.",
    texts: parsed.texts || [],
  };
}
