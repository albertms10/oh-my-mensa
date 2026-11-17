import type { AllergenCategoryId } from "@/types/allergens";
import { ALLERGEN_CATEGORIES } from "./allergens";
import { EMPTY_FILTERS, type DashboardFilters } from "./filters";

export const STORAGE_KEY = "allergen-analytics:filters:v1";
const KEYS = ["from", "to", "loc", "group", "allergen"] as const;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function filtersToParams(f: DashboardFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  f.locationIds.forEach((v) => p.append("loc", v));
  f.mealGroups.forEach((v) => p.append("group", v));
  f.allergens.forEach((v) => p.append("allergen", v));
  return p;
}

/** Returns null when the params contain none of the filter keys. Invalid values are dropped. */
export function filtersFromParams(p: URLSearchParams): DashboardFilters | null {
  if (!KEYS.some((k) => p.has(k))) return null;
  const date = (v: string | null) => (v && ISO_DATE.test(v) ? v : null);
  const known = new Set<string>(ALLERGEN_CATEGORIES.map((c) => c.id));
  return {
    from: date(p.get("from")),
    to: date(p.get("to")),
    locationIds: [...new Set(p.getAll("loc").filter(Boolean))],
    mealGroups: [...new Set(p.getAll("group").filter(Boolean))],
    allergens: [...new Set(p.getAll("allergen").filter((a) => known.has(a)))] as AllergenCategoryId[],
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

/** Browser only. Priority: URL query params, then localStorage, then no filters. */
export function readInitialFilters(): DashboardFilters {
  try {
    const fromUrl = filtersFromParams(new URLSearchParams(window.location.search));
    if (fromUrl) return fromUrl;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return filtersFromParams(new URLSearchParams(stored)) ?? EMPTY_FILTERS;
  } catch {
    /* storage unavailable (private mode etc.) */
  }
  return EMPTY_FILTERS;
}

/** Browser only. Mirrors filters into the address bar (no history entry) and localStorage. */
export function persistFilters(f: DashboardFilters): void {
  const params = filtersToParams(f);
  try {
    const url = new URL(window.location.href);
    KEYS.forEach((k) => url.searchParams.delete(k));
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
