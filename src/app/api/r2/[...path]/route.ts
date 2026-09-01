import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    let env: any = null;
    try {
      const ctx = await getCloudflareContext({ async: true }) as any;
      env = ctx?.env;
    } catch {
      // En dev local sin wrangler, getCloudflareContext puede fallar
    }

    const resolvedParams = await params;
    const path = Array.isArray(resolvedParams.path) ? resolvedParams.path.join("/") : resolvedParams.path;
    const rangeHeader = request.headers.get("range");

    if (!env || !env.R2) {
      // Fallback: en dev el bucket local suele estar vacío; buscar el objeto
      // en el dominio público de R2 (el fetch server-side no tiene CORS)
      // PLANTILLA: sin bucket por defecto. Si NEXT_PUBLIC_R2_PUBLIC_URL no
      // está configurada, el proxy responde 404 en vez de ir al bucket de otro
      // proyecto. Ver src/utils/assets.ts.
      const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
      if (r2PublicUrl) {
        const fetchHeaders = new Headers();
        if (rangeHeader) {
          fetchHeaders.set("range", rangeHeader);
        }
        const publicRes = await fetch(`${r2PublicUrl}/${path}`, {
          headers: fetchHeaders,
        });

        if (publicRes.ok || publicRes.status === 206) {
          const headers = new Headers();
          const ct = publicRes.headers.get("content-type");
          if (ct) headers.set("content-type", ct);
          
          const cr = publicRes.headers.get("content-range");
          if (cr) headers.set("content-range", cr);
          
          const cl = publicRes.headers.get("content-length");
          if (cl) headers.set("content-length", cl);

          const cache = publicRes.headers.get("cache-control");
          if (cache) headers.set("cache-control", cache);
          else headers.set("cache-control", "public, max-age=3600");
          
          headers.set("accept-ranges", "bytes");

          return new NextResponse(publicRes.body, {
            status: publicRes.status,
            headers,
          });
        }
      }
      return new NextResponse("Not Found", { status: 404 });
    }

    // Si R2 binding está disponible
    let r2Range: any = undefined;
    if (rangeHeader && rangeHeader.startsWith("bytes=")) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const startStr = parts[0]?.trim();
      const endStr = parts[1]?.trim();

      const start = startStr ? parseInt(startStr, 10) : undefined;
      const end = endStr ? parseInt(endStr, 10) : undefined;

      if (start !== undefined && !isNaN(start)) {
        r2Range = {
          offset: start,
          length: (end !== undefined && !isNaN(end)) ? end - start + 1 : undefined
        };
      } else if (end !== undefined && !isNaN(end)) {
        r2Range = { suffix: end };
      }
    }

    const object = await env.R2.get(path, r2Range ? { range: r2Range } : undefined);

    if (object === null) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const headers = new Headers();
    if (object.httpMetadata) {
      if (object.httpMetadata.contentType) headers.set("content-type", object.httpMetadata.contentType);
      if (object.httpMetadata.contentLanguage) headers.set("content-language", object.httpMetadata.contentLanguage);
      if (object.httpMetadata.contentDisposition) headers.set("content-disposition", object.httpMetadata.contentDisposition);
      if (object.httpMetadata.contentEncoding) headers.set("content-encoding", object.httpMetadata.contentEncoding);
      if (object.httpMetadata.cacheControl) headers.set("cache-control", object.httpMetadata.cacheControl);
    }
    if (object.httpEtag) {
      headers.set("etag", object.httpEtag);
    }
    
    headers.set("accept-ranges", "bytes");

    if (object.range) {
      const start = object.range.offset;
      const end = object.range.offset + (object.range.length ?? 0) - 1;
      const total = object.size;
      headers.set("Content-Range", `bytes ${start}-${end}/${total}`);
      headers.set("Content-Length", (object.range.length ?? 0).toString());

      return new NextResponse(object.body, {
        status: 206,
        headers,
      });
    }

    headers.set("Content-Length", object.size.toString());
    return new NextResponse(object.body, { headers });
  } catch (error) {
    console.error("R2 Local API Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
