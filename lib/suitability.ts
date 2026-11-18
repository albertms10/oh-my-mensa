import type { AllergenCategoryId, ContaminationHint } from "@/types/allergens";
import type { FlatDish, Location } from "@/types/menu";

/**
 * match    – allergen info available, no avoided category declared and no possible cross-contamination with one
 * contains – at least one avoided category declared OR possibly cross-contaminated (treated like contained)
 * unknown  – allergen info missing; never treated as safe
 * Note: "match" is NOT "allergen-free"; that is `dish.allergenFree` (none of all 8 categories).
 */
export type MatchStatus = "match" | "contains" | "unknown";

export interface Evaluation {
  status: MatchStatus;
  conflicts: AllergenCategoryId[];
  /** Possible cross-contamination with avoided categories. Counts as "contains" (unless info is missing). */
  warnings: ContaminationHint[];
}
export type EvaluatedDish = FlatDish & { evaluation: Evaluation };

export function evaluateDish(dish: FlatDish, avoid: readonly AllergenCategoryId[]): Evaluation {
  const warnings = dish.crossContamination.filter((h) => avoid.includes(h.category));
  if (!dish.allergensKnown) return { status: "unknown", conflicts: [], warnings };
  const conflicts = dish.categories.filter((c) => avoid.includes(c));
  return { status: conflicts.length || warnings.length ? "contains" : "match", conflicts, warnings };
}

export interface MealGroupSection { mealGroup: string; dishes: EvaluatedDish[] }
export interface MensaSection {
  locationId: string;
  locationName: string;
  groups: MealGroupSection[];
  dishCount: number;
}

function section(loc: Location, dishes: EvaluatedDish[]): MensaSection {
  const groups = new Map<string, EvaluatedDish[]>(); // first-appearance order = menu order
  for (const d of dishes) groups.set(d.mealGroup, [...(groups.get(d.mealGroup) ?? []), d]);
  return {
    locationId: loc.id,
    locationName: loc.name,
    groups: [...groups].map(([mealGroup, list]) => ({ mealGroup, dishes: list })),
    dishCount: dishes.length,
  };
}

export interface TodayOverview {
  date: string;
  /** Mensas shown (selection, or all when none selected / none valid). */
  locations: Location[];
  showingAll: boolean;
  /** Every dish of today per shown mensa, including mensas without a menu (empty groups). */
  menus: MensaSection[];
  /** Only dishes with status "match", per mensa that has any. */
  suitable: MensaSection[];
  counts: {
    total: number; suitable: number; containing: number; unknown: number; allergenFree: number;
    /** Dishes excluded only because of possible cross-contamination (no declared conflict). */
    warned: number;
  };
}

export function buildTodayOverview(input: {
  dishes: readonly FlatDish[];
  locations: readonly Location[];
  selectedLocationIds: readonly string[];
  avoid: readonly AllergenCategoryId[];
  date: string;
}): TodayOverview {
  const { dishes, selectedLocationIds, avoid, date } = input;
  const known = new Map<string, string>(input.locations.map((l) => [l.id, l.name]));
  for (const d of dishes) if (!known.has(d.locationId)) known.set(d.locationId, d.locationName);
  const all: Location[] = [...known].map(([id, name]) => ({ id, name }));

  const selected = all.filter((l) => selectedLocationIds.includes(l.id));
  const showingAll = selected.length === 0;
  const shown = (showingAll ? all : selected).sort((a, b) => a.name.localeCompare(b.name));
  const ids = new Set(shown.map((l) => l.id));

  const today: EvaluatedDish[] = dishes
    .filter((d) => d.date === date && ids.has(d.locationId))
    .map((d) => ({ ...d, evaluation: evaluateDish(d, avoid) }));

  const menus = shown.map((loc) => section(loc, today.filter((d) => d.locationId === loc.id)));
  const suitable = shown
    .map((loc) => section(loc, today.filter((d) => d.locationId === loc.id && d.evaluation.status === "match")))
    .filter((s) => s.dishCount > 0);
  const count = (s: MatchStatus) => today.filter((d) => d.evaluation.status === s).length;

  return {
    date, locations: shown, showingAll, menus, suitable,
    counts: {
      total: today.length, suitable: count("match"), containing: count("contains"),
      unknown: count("unknown"), allergenFree: today.filter((d) => d.allergenFree).length,
      warned: today.filter((d) => d.evaluation.status === "contains" && d.evaluation.conflicts.length === 0).length,
    },
  };
}
