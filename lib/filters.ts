import type { AllergenCategoryId, ContaminationRules } from "@/types/allergens";
import type { FlatDish, MenuEntry } from "@/types/menu";
import { ALLERGEN_CATEGORIES, categoriesForCodes } from "./allergens";
import { findCrossContamination } from "./cross-contamination";

export interface DashboardFilters {
  from: string | null;
  to: string | null;
  /** Empty = all. */
  locationIds: string[];
  /** Empty = all. */
  mealGroups: string[];
  /** Empty = all. Focuses allergen charts and the dish explorer. */
  allergens: AllergenCategoryId[];
}

export const EMPTY_FILTERS: DashboardFilters = {
  from: null,
  to: null,
  locationIds: [],
  mealGroups: [],
  allergens: [],
};

export function flattenEntries(entries: readonly MenuEntry[], rules?: ContaminationRules): FlatDish[] {
  return entries.flatMap((entry) =>
    (entry.dishes ?? []).map((dish, i) => {
      const codes = [
        ...new Set((dish.allergens ?? []).map((c) => c.trim()).filter(Boolean)),
      ];
      const categories = categoriesForCodes(codes);
      const allergensKnown = dish.allergensKnown !== false;
      const crossContamination = findCrossContamination(dish.name, categories, rules);
      const effectiveCategories = ALLERGEN_CATEGORIES.map((c) => c.id).filter(
        (id) => categories.includes(id) || crossContamination.some((h) => h.category === id),
      );
      return {
        key: `${entry.locationId}|${entry.date}|${entry.mealGroup}|${dish.id}|${i}`,
        dishId: dish.id,
        name: dish.name,
        locationId: entry.locationId,
        locationName: entry.locationName,
        date: entry.date,
        mealGroup: entry.mealGroup?.trim() || "Unknown",
        codes,
        categories,
        effectiveCategories,
        crossContamination,
        allergensKnown,
        allergenFree: allergensKnown && effectiveCategories.length === 0,
        image: dish.image,
      };
    }),
  );
}

/** Date, location and meal-group filters (inclusive date range). */
export function applyBaseFilters(
  dishes: readonly FlatDish[],
  f: DashboardFilters,
): FlatDish[] {
  return dishes.filter(
    (d) =>
      (!f.from || d.date >= f.from) &&
      (!f.to || d.date <= f.to) &&
      (f.locationIds.length === 0 || f.locationIds.includes(d.locationId)) &&
      (f.mealGroups.length === 0 || f.mealGroups.includes(d.mealGroup)),
  );
}

/** Keep dishes containing (or possibly cross-contaminated with) at least one selected category. Empty = no-op. */
export function filterByAllergens(
  dishes: readonly FlatDish[],
  allergens: readonly AllergenCategoryId[],
): FlatDish[] {
  if (allergens.length === 0) return [...dishes];
  return dishes.filter((d) => d.effectiveCategories.some((c) => allergens.includes(c)));
}

/**
 * Dishes containing none of the selected categories. With no selection this is
 * the allergen-free set (none of all eight configured categories).
 */
export function filterWithout(
  dishes: readonly FlatDish[],
  allergens: readonly AllergenCategoryId[],
): FlatDish[] {
  if (allergens.length === 0) return dishes.filter((d) => d.allergenFree);
  // Dishes with missing allergen information are never reported as "without" an allergen.
  return dishes.filter((d) => d.allergensKnown && !d.effectiveCategories.some((c) => allergens.includes(c)));
}
