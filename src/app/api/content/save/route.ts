import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { socialContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    // Esta ruta escribe en R2. El middleware no cubre /api (ver matcher en
    // src/middleware.ts), así que sin esta guarda sería una subida anónima
    // a un bucket de acceso público.
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { socialContentId, imageBase64 } = body;

    if (!socialContentId || !imageBase64) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Extraer los bytes de Base64
    let cleanBase64 = imageBase64;
    if (imageBase64.includes("base64,")) {
      cleanBase64 = imageBase64.split("base64,")[1];
    }

    const buffer = Buffer.from(cleanBase64, "base64");
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const db = await getDb();
    const { env } = await getCloudflareContext({ async: true }) as any;
    let resultUrl = "";

    if (env && env.R2) {
      const fileName = `final_${socialContentId}_${Date.now()}.jpg`;
      const key = `media/social_content/${fileName}`;

      await env.R2.put(key, arrayBuffer, {
        httpMetadata: { contentType: "image/jpeg" }
      });

      const isDev = process.env.NODE_ENV === 'development';
      const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

      if (isDev) {
        resultUrl = `/api/r2/${key}`;
      } else {
        resultUrl = `${r2PublicUrl}/${key}`;
      }
    } else {
      // Fallback local en desarrollo si no hay binding
      resultUrl = imageBase64; // Guardar dataURL directamente como fallback
    }

    // Actualizar registro en base de datos a COMPLETED
    await db
      .update(socialContent)
      .set({
        status: "COMPLETED",
        resultUrl,
        updatedAt: new Date()
      })
      .where(eq(socialContent.id, socialContentId));

    return NextResponse.json({
      success: true,
      resultUrl
    });
  } catch (error: any) {
    console.error("Error in save api route:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
