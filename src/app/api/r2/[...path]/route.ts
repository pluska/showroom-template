import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const env = getRequestContext().env as any;
    if (!env || !env.R2) {
      return new NextResponse("R2 binding not found", { status: 500 });
    }

    const resolvedParams = await params;
    const path = resolvedParams.path.join("/");
    const object = await env.R2.get(path);

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
    
    // Si queremos soportar streaming básico, idealmente deberíamos 
    // retornar el stream y configurar el Content-Length.
    headers.set("Content-Length", object.size.toString());

    return new NextResponse(object.body, { headers });
  } catch (error) {
    console.error("R2 Local API Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
