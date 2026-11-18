import { EMPTY_FILTERS, type DashboardFilters } from "./filters";

export const STORAGE_KEY = "allergen-analytics:filters:v1";
// Allergens are shared with the overview via preferences, so they are not part of the URL.
const KEYS = ["from", "to", "loc", "group"] as const;
const LEGACY_KEYS = ["allergen"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function filtersToParams(f: DashboardFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  f.locationIds.forEach((v) => p.append("loc", v));
  f.mealGroups.forEach((v) => p.append("group", v));
  return p;
}

/** Returns null when the params contain none of the filter keys. Invalid values are dropped. Allergens are never read from the URL. */
export function filtersFromParams(p: URLSearchParams): DashboardFilters | null {
  if (!KEYS.some((k) => p.has(k))) return null;
  const date = (v: string | null) => (v && ISO_DATE.test(v) ? v : null);
  return {
    from: date(p.get("from")),
    to: date(p.get("to")),
    locationIds: [...new Set(p.getAll("loc").filter(Boolean))],
    mealGroups: [...new Set(p.getAll("group").filter(Boolean))],
    allergens: [],
  };
}

/** Drops filter values that do not exist in the loaded data (stale links or storage). */
export function sanitizeFilters(
  f: DashboardFilters,
  ctx: { locationIds: string[]; mealGroups: string[]; minDate?: string; maxDate?: string },
): DashboardFilters {
  const outside =
    (f.from && ctx.maxDate && f.from > ctx.maxDate) || (f.to && ctx.minDate && f.to < ctx.minDate);
  return {
    ...f,
    from: outside ? null : f.from,
    to: outside ? null : f.to,
    locationIds: f.locationIds.filter((id) => ctx.locationIds.includes(id)),
    mealGroups: f.mealGroups.filter((g) => ctx.mealGroups.includes(g)),
  };
}

/** Browser only. Priority: URL query params, then stored filters, then `fallback` (e.g. overview preferences). */
export function readInitialFilters(fallback: DashboardFilters = EMPTY_FILTERS): DashboardFilters {
  try {
    const fromUrl = filtersFromParams(new URLSearchParams(window.location.search));
    if (fromUrl) return fromUrl;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return filtersFromParams(new URLSearchParams(stored)) ?? EMPTY_FILTERS;
  } catch {
    /* storage unavailable (private mode etc.) */
  }
  return fallback;
}

/** Browser only. Mirrors filters into the address bar (no history entry) and localStorage. */
export function persistFilters(f: DashboardFilters): void {
  const params = filtersToParams(f);
  try {
    const url = new URL(window.location.href);
    [...KEYS, ...LEGACY_KEYS].forEach((k) => url.searchParams.delete(k));
    params.forEach((v, k) => url.searchParams.append(k, v));
    window.history.replaceState(window.history.state, "", url);
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, params.toString());
  } catch {
    /* ignore */
  }
}
