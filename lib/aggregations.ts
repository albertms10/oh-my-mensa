import type { AllergenCategoryId, CategoryCounts } from "@/types/allergens";
import type { FlatDish } from "@/types/menu";
import { ALLERGEN_CATEGORIES, emptyCounts } from "./allergens";
import { filterWithout } from "./filters";

export interface GroupStats {
  key: string;
  label: string;
  /** Unique dishes. */
  total: number;
  allergenFree: number;
  /** Dishes containing each category (not mutually exclusive). */
  counts: CategoryCounts;
}

export function countByCategory(dishes: readonly FlatDish[]): CategoryCounts {
  const counts = emptyCounts();
  for (const d of dishes) for (const c of d.categories) counts[c] += 1;
  return counts;
}

function groupStats(
  dishes: readonly FlatDish[],
  keyOf: (d: FlatDish) => string,
  labelOf: (d: FlatDish) => string,
): GroupStats[] {
  const groups = new Map<string, FlatDish[]>();
  for (const d of dishes) {
    const k = keyOf(d);
    const list = groups.get(k);
    if (list) list.push(d);
    else groups.set(k, [d]);
  }
  return [...groups].map(([key, list]) => ({
    key,
    label: labelOf(list[0]),
    total: list.length,
    allergenFree: list.filter((d) => d.allergenFree).length,
    counts: countByCategory(list),
  }));
}

/** Chronologically sorted. Days without data are absent. */
export function aggregateByDay(dishes: readonly FlatDish[]): GroupStats[] {
  return groupStats(dishes, (d) => d.date, (d) => d.date).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
}

export function aggregateByMealGroup(dishes: readonly FlatDish[]): GroupStats[] {
  return groupStats(dishes, (d) => d.mealGroup, (d) => d.mealGroup).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export function aggregateByLocation(dishes: readonly FlatDish[]): GroupStats[] {
  return groupStats(dishes, (d) => d.locationId, (d) => d.locationName).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export interface Kpis {
  totalDishes: number;
  allergenFreeDishes: number;
  /** 0–100, or null when there are no dishes. */
  allergenFreePercent: number | null;
  topAllergen: { id: AllergenCategoryId; count: number } | null;
}

export function computeKpis(
  dishes: readonly FlatDish[],
  categories: readonly AllergenCategoryId[] = ALLERGEN_CATEGORIES.map((c) => c.id),
): Kpis {
  const counts = countByCategory(dishes);
  const free = dishes.filter((d) => d.allergenFree).length;
  let top: Kpis["topAllergen"] = null;
  for (const id of categories) {
    if (counts[id] > 0 && (!top || counts[id] > top.count)) top = { id, count: counts[id] };
  }
  return {
    totalDishes: dishes.length,
    allergenFreeDishes: free,
    allergenFreePercent: dishes.length ? (free / dishes.length) * 100 : null,
    topAllergen: top,
  };
}

/** Number of dishes per key that contain none of `excluded` (empty = all eight categories). */
export function countWithoutBy(
  dishes: readonly FlatDish[],
  excluded: readonly AllergenCategoryId[],
  keyOf: (d: FlatDish) => string,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const d of filterWithout(dishes, excluded)) out.set(keyOf(d), (out.get(keyOf(d)) ?? 0) + 1);
  return out;
}

export interface FreeDayStats { key: string; total: number; free: number }

/** Per day (chronological): all dishes and dishes without the excluded categories. */
export function aggregateWithoutByDay(
  dishes: readonly FlatDish[],
  excluded: readonly AllergenCategoryId[],
): FreeDayStats[] {
  const free = countWithoutBy(dishes, excluded, (d) => d.date);
  return aggregateByDay(dishes).map((d) => ({ key: d.key, total: d.total, free: free.get(d.key) ?? 0 }));
}
