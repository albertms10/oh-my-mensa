import type { MenuResponse } from "@/types/menu";

export interface MenuResult { data?: MenuResponse; error?: string }

/** Browser → our own API only (never MaxManager directly). `date` = a single day. */
export async function loadMenu(opts: { refresh?: boolean; date?: string } = {}): Promise<MenuResult> {
  const q = new URLSearchParams();
  if (opts.refresh) q.set("refresh", "1");
  if (opts.date) q.set("date", opts.date);
  try {
    const res = await fetch(`/api/allergenen${q.size ? `?${q}` : ""}`, { cache: "no-store" });
    const body = await res.json().catch(() => null);
    if (!res.ok) return { error: body?.error ?? `Request failed (${res.status}).` };
    return { data: body as MenuResponse };
  } catch {
    return { error: "The server could not be reached." };
  }
}
