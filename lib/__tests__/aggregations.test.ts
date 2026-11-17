import {
  aggregateByDay, aggregateByLocation, aggregateByMealGroup, computeKpis, countByCategory,
} from "@/lib/aggregations";
import { describe, expect, it } from "vitest";
import { DISHES } from "./helpers";

describe("aggregations", () => {
  it("counts each dish once per category", () => {
    const c = countByCategory(DISHES);
    expect(c.egg).toBe(1);
    expect(c.gluten).toBe(2);
    expect(c.milk).toBe(1);
  });
  it("sorts days chronologically", () => {
    expect(aggregateByDay(DISHES).map((d) => d.key)).toEqual([
      "2026-11-02", "2026-11-03", "2026-11-10",
    ]);
  });
  it("aggregates per day with free counts", () => {
    const day = aggregateByDay(DISHES).find((d) => d.key === "2026-11-03")!;
    expect(day.total).toBe(2);
    expect(day.allergenFree).toBe(1);
    expect(day.counts.gluten).toBe(1);
  });
  it("aggregates per meal group and location", () => {
    const groups = aggregateByMealGroup(DISHES);
    expect(groups.find((g) => g.key === "Veggie")!.total).toBe(3);
    const locs = aggregateByLocation(DISHES);
    expect(locs.find((l) => l.key === "1")!.total).toBe(3);
  });
  it("computes KPIs and handles empty input", () => {
    const k = computeKpis(DISHES);
    expect(k.totalDishes).toBe(5);
    expect(k.allergenFreeDishes).toBe(2);
    expect(k.allergenFreePercent).toBeCloseTo(40);
    expect(k.topAllergen?.id).toBe("gluten");
    const e = computeKpis([]);
    expect(e.allergenFreePercent).toBeNull();
    expect(e.topAllergen).toBeNull();
  });
});
