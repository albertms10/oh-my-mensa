import { ISO_DATE } from "@/lib/dates";
import { getMenuData } from "@/lib/server/data-provider";
import { ProviderError } from "@/lib/server/errors";
import { NextRequest, NextResponse } from "next/server";

/** Query: `refresh=1` bypasses the cache; `date=YYYY-MM-DD` limits the data to one day. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const date = params.get("date");
  if (date !== null && !ISO_DATE.test(date))
    return NextResponse.json({ error: "Invalid date parameter." }, { status: 400 });
  try {
    const data = await getMenuData({ refresh: params.get("refresh") === "1", date: date ?? undefined });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[api/allergenen]", error instanceof Error ? error.message : "unknown error");
    const message =
      error instanceof ProviderError ? error.publicMessage : "Menu data could not be loaded.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
