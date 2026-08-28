import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDb } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { auth } from "@/auth";
import { STORAGE_LIMIT_BYTES, formatBytes } from "@/lib/content/quota";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = await getCloudflareContext({ async: true }) as any;
    if (!env || !env.R2) {
      return NextResponse.json({ error: "R2 binding not found" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const category = formData.get("category") as string || "extra";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const key = category.toLowerCase() === "progress"
      ? `progress/${fileName}`
      : `media/${category.toLowerCase()}/${fileName}`;

    // Tope de espacio del módulo de Contenido. Solo aplica a sus prefijos: los
    // avances de obra y el resto de multimedia no compiten por esta cuota.
    if (key.startsWith("media/social_reference/") || key.startsWith("media/social_content/")) {
      let usedBytes = 0;
      for (const prefix of ["media/social_reference/", "media/social_content/"]) {
        let cursor: string | undefined = undefined;
        do {
          const listed: any = await env.R2.list({ prefix, cursor, limit: 1000 });
          for (const obj of listed.objects || []) usedBytes += obj.size || 0;
          cursor = listed.truncated ? listed.cursor : undefined;
        } while (cursor);
      }

      if (usedBytes + file.size > STORAGE_LIMIT_BYTES) {
        return NextResponse.json(
          {
            error: `No hay espacio suficiente: el módulo de Contenido usa ${formatBytes(usedBytes)} de ${formatBytes(STORAGE_LIMIT_BYTES)}. Elimina referencias que ya no uses para liberar espacio.`,
            storageExceeded: true,
            usedBytes,
            limitBytes: STORAGE_LIMIT_BYTES,
          },
          { status: 413 }
        );
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    await env.R2.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type }
    });

    const isDev = process.env.NODE_ENV === 'development';
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

    let url = "";
    if (isDev) {
      url = `/api/r2/${key}`;
    } else {
      url = `${r2PublicUrl}/${key}`;
    }

    // Persistir las referencias del generador de contenido en la tabla media
    // para que sigan disponibles en sesiones futuras (antes solo iban a R2)
    let mediaId: string | null = null;
    if (category === "social_reference") {
      const db = await getDb();
      const [inserted] = await db
        .insert(media)
        .values({
          title: file.name,
          url,
          type: file.type,
          category: "SOCIAL_REFERENCE",
          isActive: false,
        })
        .returning();
      // Se devuelve el id de la fila (no la clave de R2) porque es lo que
      // necesita el borrado de referencias del módulo de Contenido.
      mediaId = inserted?.id ?? null;
    }

    return NextResponse.json({
      success: true,
      url,
      key,
      mediaId,
      type: file.type,
      name: file.name
    });
  } catch (error: any) {
    console.error("R2 Upload API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
