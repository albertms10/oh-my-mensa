import type { FlatDish } from "@/types/menu";

export type ChartId = "overTime" | "distribution" | "byMealGroup" | "freeOverTime" | "locations";

export interface ChartVisibility {
  visible: Record<ChartId, boolean>;
  /** Human-readable reasons for hidden charts. */
  hidden: { chart: string; reason: string }[];
}

/** Hides charts that carry no information for the current (filtered) data. */
export function chartVisibility(dishes: readonly FlatDish[], categoryCount: number): ChartVisibility {
  const days = new Set(dishes.map((d) => d.date)).size;
  const groups = new Set(dishes.map((d) => d.mealGroup)).size;
  const locations = new Set(dishes.map((d) => d.locationId)).size;
  const rules: [ChartId, string, boolean, string][] = [
    ["overTime", "Allergens over time", days >= 2, "needs at least 2 days"],
    ["distribution", "Allergen distribution", categoryCount >= 2, "needs at least 2 allergen categories"],
    ["byMealGroup", "Allergens by meal group", groups >= 2, "needs at least 2 meal groups"],
    ["freeOverTime", "Allergen-free dishes over time", days >= 2, "needs at least 2 days"],
    ["locations", "Location comparison", locations >= 2, "needs at least 2 locations"],
  ];
  const empty = dishes.length === 0;
  return {
    visible: Object.fromEntries(rules.map(([id, , ok]) => [id, ok])) as Record<ChartId, boolean>,
    hidden: empty ? [] : rules.filter(([, , ok]) => !ok).map(([, chart, , reason]) => ({ chart, reason })),
  };
}
