import { aggregateByDay, countByCategory, percentOf, sharePercent, shareWithAny } from "@/lib/aggregations";
import { describe, expect, it } from "vitest";
import { DISHES } from "./helpers";

describe("share of dishes", () => {
  it("computes percentages with one decimal and handles zero totals", () => {
    expect(percentOf(1, 3)).toBe(33.3);
    expect(percentOf(0, 0)).toBe(0);
  });
  it("counts dishes with any selected category once", () => {
    // DISHES: a(gluten,egg,milk) b() c(soy,sesame,celery) d() e(nuts,gluten,mustard)
    expect(shareWithAny(DISHES, ["gluten", "egg"])).toEqual({ count: 2, total: 5, percent: 40 });
    expect(shareWithAny(DISHES, ["gluten", "nuts", "soy"])).toMatchObject({ count: 3, percent: 60 });
    expect(shareWithAny([], ["gluten"])).toEqual({ count: 0, total: 0, percent: 0 });
  });
  it("is not the sum of the category counts", () => {
    const counts = countByCategory(DISHES);
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(shareWithAny(DISHES, Object.keys(counts) as never).count).toBeLessThan(sum);
  });
  it("converts per-day counts to shares of that day's dishes", () => {
    const day = aggregateByDay(DISHES).find((d) => d.key === "2026-11-03")!; // dishes a, b
    expect(sharePercent(day.counts, day.total).gluten).toBe(50);
  });
});
