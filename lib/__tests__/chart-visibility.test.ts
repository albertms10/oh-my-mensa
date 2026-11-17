import { aggregateWithoutByDay } from "@/lib/aggregations";
import { chartVisibility } from "@/lib/chart-visibility";
import { describe, expect, it } from "vitest";
import { DISHES } from "./helpers";

describe("chart visibility", () => {
  it("shows everything for multi-day, multi-location, multi-group data", () => {
    const { visible, hidden } = chartVisibility(DISHES, 8);
    expect(Object.values(visible).every(Boolean)).toBe(true);
    expect(hidden).toEqual([]);
  });
  it("hides location comparison for one location", () => {
    const one = DISHES.filter((d) => d.locationId === "1");
    expect(chartVisibility(one, 8).visible.locations).toBe(false);
  });
  it("hides time charts for a single day and distribution for one category", () => {
    const day = DISHES.filter((d) => d.date === "2026-11-03");
    const v = chartVisibility(day, 1).visible;
    expect(v.overTime).toBe(false);
    expect(v.freeOverTime).toBe(false);
    expect(v.distribution).toBe(false);
    expect(v.byMealGroup).toBe(false);
  });
  it("reports no hidden charts for an empty dataset", () => {
    expect(chartVisibility([], 8).hidden).toEqual([]);
  });
});

describe("aggregateWithoutByDay", () => {
  it("counts dishes without selected allergens per day", () => {
    const rows = aggregateWithoutByDay(DISHES, ["gluten"]);
    expect(rows).toEqual([
      { key: "2026-11-02", total: 2, free: 2 },
      { key: "2026-11-03", total: 2, free: 1 },
      { key: "2026-11-10", total: 1, free: 0 },
    ]);
  });
  it("uses all eight categories when nothing is selected", () => {
    expect(aggregateWithoutByDay(DISHES, []).map((r) => r.free)).toEqual([1, 1, 0]);
  });
});
