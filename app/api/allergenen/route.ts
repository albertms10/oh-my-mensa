import { getMenuData } from "@/lib/server/data-provider";
import { ProviderError } from "@/lib/server/errors";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  try {
    const data = await getMenuData({ refresh });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/allergenen]", error instanceof Error ? error.message : "unknown error");
    const message =
      error instanceof ProviderError ? error.publicMessage : "Menu data could not be loaded.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
