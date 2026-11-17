import { EMPTY_FILTERS, applyBaseFilters, filterByAllergens, filterWithout, flattenEntries } from "@/lib/filters";
import { describe, expect, it } from "vitest";
import { DISHES } from "./helpers";

describe("filters", () => {
  it("returns everything with empty filters", () => {
    expect(applyBaseFilters(DISHES, EMPTY_FILTERS)).toHaveLength(5);
  });
  it("filters by inclusive date range", () => {
    const r = applyBaseFilters(DISHES, { ...EMPTY_FILTERS, from: "2026-11-03", to: "2026-11-03" });
    expect(r.map((d) => d.dishId)).toEqual(["a", "b"]);
  });
  it("filters by location and meal group", () => {
    const r = applyBaseFilters(DISHES, { ...EMPTY_FILTERS, locationIds: ["1"], mealGroups: ["Veggie"] });
    expect(r.map((d) => d.dishId)).toEqual(["e"]);
  });
  it("filters by allergen (any selected)", () => {
    expect(filterByAllergens(DISHES, ["egg", "soy"]).map((d) => d.dishId)).toEqual(["a", "c"]);
    expect(filterByAllergens(DISHES, [])).toHaveLength(5);
  });
  it("dedupes codes and defaults missing meal group", () => {
    const [d] = flattenEntries([
      { locationId: "1", locationName: "X", date: "2026-01-01", mealGroup: " ",
        dishes: [{ id: "z", name: "Z", allergens: ["Ei", "Ei", " "] }] },
    ]);
    expect(d.codes).toEqual(["Ei"]);
    expect(d.mealGroup).toBe("Unknown");
  });
  it("lists dishes without the selected allergens", () => {
    expect(filterWithout(DISHES, ["gluten"]).map((d) => d.dishId)).toEqual(["b", "c", "d"]);
    expect(filterWithout(DISHES, ["gluten", "soy"]).map((d) => d.dishId)).toEqual(["b", "d"]);
  });
  it("falls back to fully allergen-free dishes without a selection", () => {
    expect(filterWithout(DISHES, []).map((d) => d.dishId)).toEqual(["b", "d"]);
  });
});
