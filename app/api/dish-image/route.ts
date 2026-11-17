import { getConfig } from "@/lib/server/config";
import { isValidImagePath } from "@/lib/server/images";
import { NextRequest, NextResponse } from "next/server";

/** Server-side proxy for dish photos: the browser never contacts MaxManager directly. */
export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("p") ?? "";
  if (!isValidImagePath(path)) return new NextResponse("Invalid image path", { status: 400 });
  const cfg = getConfig();
  try {
    const res = await fetch(`${cfg.maxmanager.baseUrl}/${path}`, {
      signal: AbortSignal.timeout(cfg.timeoutMs),
    });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return new NextResponse("Not found", { status: 404 });
    return new NextResponse(res.body, {
      headers: { "content-type": type, "cache-control": "public, max-age=86400, s-maxage=86400" },
    });
  } catch {
    return new NextResponse("Image could not be loaded", { status: 502 });
  }
}
