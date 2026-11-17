/** Server-only configuration. Never import from client components. */
function int(name: string, fallback: number, min: number): number {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n >= min ? n : fallback;
}

export function getConfig() {
  return {
    provider: process.env.DATA_PROVIDER === "maxmanager" ? ("maxmanager" as const) : ("mock" as const),
    cacheTtlMs: int("CACHE_TTL_SECONDS", 900, 0) * 1000,
    timeoutMs: int("REQUEST_TIMEOUT_MS", 10_000, 1000),
    maxmanager: {
      baseUrl: (process.env.MAXMANAGER_BASE_URL || "https://sws2.maxmanager.xyz").replace(/\/$/, ""),
      weeks: int("MAXMANAGER_WEEKS", 2, 1),
      locationOverride: process.env.MAXMANAGER_LOCATION_IDS?.trim() || "",
    },
  };
}
