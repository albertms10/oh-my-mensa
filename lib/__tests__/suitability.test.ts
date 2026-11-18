import { filterWithout, flattenEntries } from "@/lib/filters";
import { buildTodayOverview, evaluateDish } from "@/lib/suitability";
import type { MenuEntry } from "@/types/menu";
import { describe, expect, it } from "vitest";

const TODAY = "2026-11-17";
const entries: MenuEntry[] = [
  { locationId: "1", locationName: "Central", date: TODAY, mealGroup: "Main", dishes: [
    { id: "a", name: "Spaetzle", allergens: ["GlW", "Ei"] },
    { id: "b", name: "Rice bowl", allergens: [] },
    { id: "c", name: "Mystery soup", allergens: [], allergensKnown: false },
    { id: "d", name: "Tofu curry", allergens: ["So"] },
  ] },
  { locationId: "1", locationName: "Central", date: "2026-11-16", mealGroup: "Main", dishes: [{ id: "old", name: "Yesterday", allergens: [] }] },
  { locationId: "2", locationName: "Vaihingen", date: TODAY, mealGroup: "Veggie", dishes: [
    { id: "e", name: "Salad", allergens: ["Se"] },
  ] },
];
const dishes = flattenEntries(entries);
const locations = [
  { id: "1", name: "Central" }, { id: "2", name: "Vaihingen" }, { id: "3", name: "Hohenheim" },
];
const build = (selected: string[], avoid: Parameters<typeof buildTodayOverview>[0]["avoid"]) =>
  buildTodayOverview({ dishes, locations, selectedLocationIds: selected, avoid, date: TODAY });

describe("dish evaluation", () => {
  const by = (id: string) => dishes.find((d) => d.dishId === id)!;
  it("distinguishes match, contains and unknown", () => {
    expect(evaluateDish(by("a"), ["gluten"])).toMatchObject({ status: "contains", conflicts: ["gluten"] });
    expect(evaluateDish(by("d"), ["gluten"]).status).toBe("match");
    expect(evaluateDish(by("c"), ["gluten"]).status).toBe("unknown");
    expect(evaluateDish(by("c"), []).status).toBe("unknown");
  });
  it("does not confuse a preference match with allergen-free", () => {
    const tofu = by("d");
    expect(evaluateDish(tofu, ["gluten"]).status).toBe("match");
    expect(tofu.allergenFree).toBe(false); // contains soy
    expect(by("b").allergenFree).toBe(true);
  });
  it("never treats missing allergen info as allergen-free or as free of an allergen", () => {
    expect(by("c").allergenFree).toBe(false);
    expect(filterWithout(dishes, []).map((d) => d.dishId)).not.toContain("c");
    expect(filterWithout(dishes, ["gluten"]).map((d) => d.dishId)).not.toContain("c");
  });
});

describe("today overview", () => {
  it("only includes today and filters by avoided allergens", () => {
    const o = build(["1"], ["gluten"]);
    expect(o.suitable).toHaveLength(1);
    expect(o.suitable[0].groups[0].dishes.map((d) => d.dishId)).toEqual(["b", "d"]);
    expect(o.counts).toMatchObject({ total: 4, suitable: 2, containing: 1, unknown: 1 });
  });
  it("supports multiple avoided allergens and mensas", () => {
    const o = build(["1", "2"], ["gluten", "sesame"]);
    expect(o.suitable.map((s) => s.locationName)).toEqual(["Central"]);
    expect(o.counts.containing).toBe(2);
  });
  it("shows all mensas when none are selected (or none are valid)", () => {
    expect(build([], []).showingAll).toBe(true);
    expect(build(["nope"], []).locations.map((l) => l.name)).toEqual(["Central", "Hohenheim", "Vaihingen"]);
  });
  it("without avoided allergens includes every dish with allergen info", () => {
    const o = build([], []);
    expect(o.counts.suitable).toBe(4); // a, b, d, e (c unknown)
    expect(o.counts.unknown).toBe(1);
  });
  it("keeps mensas without a menu today as empty sections", () => {
    const o = build(["3"], []);
    expect(o.menus).toHaveLength(1);
    expect(o.menus[0].dishCount).toBe(0);
    expect(o.suitable).toEqual([]);
    expect(o.counts.total).toBe(0);
  });
  it("returns no suitable dishes when everything contains an avoided allergen", () => {
    const o = build(["2"], ["sesame"]);
    expect(o.suitable).toEqual([]);
    expect(o.counts).toMatchObject({ total: 1, containing: 1 });
  });
  it("handles an empty dataset", () => {
    const o = buildTodayOverview({ dishes: [], locations: [], selectedLocationIds: [], avoid: [], date: TODAY });
    expect(o.counts.total).toBe(0);
    expect(o.menus).toEqual([]);
  });
});
