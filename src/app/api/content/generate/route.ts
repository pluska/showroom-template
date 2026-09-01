import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { socialContent, socialContentMessages, imageGenerations } from "@/lib/db/schema";
import { eq, gte, count } from "drizzle-orm";
import { auth } from "@/auth";
import { MONTHLY_IMAGE_LIMIT, currentPeriodStart, nextPeriodStart } from "@/lib/content/quota";
import { normalizeReferences } from "@/lib/content/references";
import { saveGeneratedImage } from "@/lib/content/media";
import { buildCopySystemPrompt } from "@/lib/content/prompts";
import { generateOpenAIImage, generateOpenAICopy } from "@/lib/content/openai";
import { getFallbackImage, getFallbackMessage, getMockResponse } from "@/lib/content/fallback";
import { CopyText } from "@/lib/content/types";

// Endpoint del generador de contenido para RRSS. Orquesta dos flujos:
//   - modo "ia":     genera una imagen (OpenAI Responses API)
//   - modo "manual": genera copys publicitarios en JSON para el lienzo
// La lógica de cada motor vive en src/lib/content/*.
export async function POST(request: NextRequest) {
  try {
    // El middleware no cubre /api (ver matcher en src/middleware.ts), así que la
    // sesión se valida aquí: sin esto cualquiera podría gastar la cuota de OpenAI.
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, referenceUrls, references, aspectRatio, socialContentId, engine, modo } = body;

    if (!socialContentId) {
      return NextResponse.json({ error: "Missing socialContentId" }, { status: 400 });
    }

    const db = await getDb();
    // Gemini queda desactivado por decisión del cliente: aunque el cuerpo pida
    // "gemini", se ignora y todo pasa por OpenAI. El código del motor se
    // conserva en lib/content/gemini.ts para poder reactivarlo más adelante.
    const selectedEngine: "openai" | "gemini" = "openai";
    const workMode = modo === "ia" ? "ia" : "manual";
    // Acepta el formato nuevo (references tipadas) o el antiguo (referenceUrls)
    const refs = normalizeReferences(references ?? referenceUrls);

    // Guardar el mensaje del usuario
    if (prompt) {
      await db.insert(socialContentMessages).values({ socialContentId, sender: "USER", text: prompt });
    }

    // Mantener el estado en DRAFT durante la edición
    await db.update(socialContent).set({ status: "DRAFT", prompt }).where(eq(socialContent.id, socialContentId));

    const { env } = (await getCloudflareContext({ async: true })) as any;
    const openaiKey = env?.OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    // --- FLUJO IA: GENERACIÓN DE IMAGEN ---
    if (workMode === "ia") {
      // Tope mensual: se corta ANTES de llamar a OpenAI para no gastar la
      // cuota de la cuenta. Los reintentos fallidos no consumen porque solo
      // se registra la generación cuando devuelve una imagen real.
      const [usedRow] = await db
        .select({ total: count() })
        .from(imageGenerations)
        .where(gte(imageGenerations.createdAt, currentPeriodStart()));
      const used = Number(usedRow?.total || 0);

      if (used >= MONTHLY_IMAGE_LIMIT) {
        const resets = nextPeriodStart().toLocaleDateString("es-PE", { day: "numeric", month: "long" });
        const limitMessage = `Se alcanzó el límite de ${MONTHLY_IMAGE_LIMIT} imágenes de este mes. El contador se reinicia el ${resets}. Puedes seguir usando el lienzo y los copys sin restricción.`;
        await db.insert(socialContentMessages).values({ socialContentId, sender: "AI", text: limitMessage });
        return NextResponse.json(
          { error: limitMessage, quotaExceeded: true, used, limit: MONTHLY_IMAGE_LIMIT },
          { status: 429 }
        );
      }

      let resultUrl = "";
      let aiResponseText = "";
      let generated = false;

      try {
        if (!openaiKey) throw new Error("OPENAI_API_KEY no configurada");
        const img = await generateOpenAIImage(prompt, refs, aspectRatio, openaiKey);
        resultUrl = await saveGeneratedImage(env, img.base64, img.mime, "openai");
        aiResponseText = img.aiResponse;
        generated = true;
      } catch (err) {
        console.error("Error en generación de imagen, usando fallback:", err);
        resultUrl = getFallbackImage(prompt);
        aiResponseText = getFallbackMessage(err, aspectRatio);
      }

      if (generated) {
        await db.insert(imageGenerations).values({
          socialContentId,
          engine: selectedEngine,
          createdBy: session?.user?.id || null,
        });
      }

      await db.insert(socialContentMessages).values({ socialContentId, sender: "AI", text: aiResponseText });
      return NextResponse.json({
        success: true,
        resultUrl,
        aiResponse: aiResponseText,
        quota: { used: used + (generated ? 1 : 0), limit: MONTHLY_IMAGE_LIMIT },
      });
    }

    // --- FLUJO MANUAL: GENERACIÓN DE COPYS ---
    const systemPrompt = buildCopySystemPrompt(prompt);
    let aiResponseText = "";
    let textsToInject: CopyText[] = [];

    try {
      if (!openaiKey) throw new Error("OPENAI_API_KEY no configurada");
      const copy = await generateOpenAICopy(prompt, systemPrompt, openaiKey);
      aiResponseText = copy.aiResponse;
      textsToInject = copy.texts;
    } catch (err) {
      console.error("Error en generación de copy, usando fallback:", err);
      const mock = getMockResponse(prompt);
      aiResponseText = mock.aiResponse;
      textsToInject = mock.texts;
    }

    await db.insert(socialContentMessages).values({ socialContentId, sender: "AI", text: aiResponseText });
    return NextResponse.json({ success: true, aiResponse: aiResponseText, texts: textsToInject });
  } catch (error: any) {
    console.error("Error general en generate/route.ts:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
