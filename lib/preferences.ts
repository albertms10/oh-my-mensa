import type { AllergenCategoryId } from "@/types/allergens";
import { ALLERGEN_CATEGORIES } from "./allergens";
import { EMPTY_FILTERS, type DashboardFilters } from "./filters";

export const PREFERENCES_KEY = "allergen-analytics:preferences";
export const PREFERENCES_VERSION = 1;

/** What the overview personalizes on: allergens to avoid and mensas to show. */
export interface Preferences {
  version: typeof PREFERENCES_VERSION;
  allergens: AllergenCategoryId[];
  /** Empty = all mensas. */
  locationIds: string[];
}

const KNOWN = new Set<string>(ALLERGEN_CATEGORIES.map((c) => c.id));

export function createPreferences(allergens: readonly AllergenCategoryId[], locationIds: readonly string[]): Preferences {
  return {
    version: PREFERENCES_VERSION,
    allergens: ALLERGEN_CATEGORIES.map((c) => c.id).filter((id) => allergens.includes(id)),
    locationIds: [...new Set(locationIds)],
  };
}

/**
 * Parses and validates a stored value. Returns null for missing, malformed, outdated
 * or incomplete data, which sends the user back to the questionnaire.
 */
export function parsePreferences(raw: string | null): Preferences | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const o = data as Record<string, unknown>;
  if (o.version !== PREFERENCES_VERSION) return null;
  if (!Array.isArray(o.allergens) || !Array.isArray(o.locationIds)) return null;
  if (!o.allergens.every((a) => typeof a === "string" && KNOWN.has(a))) return null;
  if (!o.locationIds.every((l) => typeof l === "string" && l.length > 0)) return null;
  return createPreferences(o.allergens as AllergenCategoryId[], o.locationIds as string[]);
}

export function serializePreferences(p: Preferences): string {
  return JSON.stringify(p);
}

/** Browser only. */
export function readStoredPreferences(): Preferences | null {
  try {
    return parsePreferences(window.localStorage.getItem(PREFERENCES_KEY));
  } catch {
    return null;
  }
}

/** Seed for the details page filters (allergens are shared live; the rest is seeded once). */
export function preferencesToFilters(p: Preferences | null): DashboardFilters {
  return p ? { ...EMPTY_FILTERS, allergens: p.allergens, locationIds: p.locationIds } : EMPTY_FILTERS;
}
