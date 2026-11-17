import { filtersFromParams, filtersToParams, sanitizeFilters } from "@/lib/filter-url";
import { EMPTY_FILTERS } from "@/lib/filters";
import { isValidImagePath, normalizeImagePath } from "@/lib/server/images";
import { describe, expect, it } from "vitest";

describe("filter URL serialization", () => {
  it("round-trips filters", () => {
    const f = { from: "2026-11-02", to: "2026-11-06", locationIds: ["1", "4"], mealGroups: ["Menü 1", "A,B"], allergens: ["gluten" as const, "milk" as const] };
    expect(filtersFromParams(new URLSearchParams(filtersToParams(f).toString()))).toEqual(f);
  });
  it("returns null without filter params and drops invalid values", () => {
    expect(filtersFromParams(new URLSearchParams("foo=1"))).toBeNull();
    const f = filtersFromParams(new URLSearchParams("from=nope&allergen=gluten&allergen=bogus"))!;
    expect(f.from).toBeNull();
    expect(f.allergens).toEqual(["gluten"]);
  });
  it("serializes empty filters to an empty query", () => {
    expect(filtersToParams(EMPTY_FILTERS).toString()).toBe("");
  });
  it("sanitizes values missing from the data", () => {
    const f = sanitizeFilters(
      { ...EMPTY_FILTERS, from: "2026-01-01", to: "2026-01-05", locationIds: ["1", "99"], mealGroups: ["X", "Veggie"] },
      { locationIds: ["1"], mealGroups: ["Veggie"], minDate: "2026-11-02", maxDate: "2026-11-20" },
    );
    expect(f).toMatchObject({ from: null, to: null, locationIds: ["1"], mealGroups: ["Veggie"] });
  });
});

describe("image paths", () => {
  const base = "https://sws2.maxmanager.xyz";
  it("normalizes relative and same-host absolute photo paths", () => {
    expect(normalizeImagePath("assets/fotos/musikhochschule/Speisefotos/2-3/abc_1.jpg?v=1", base))
      .toBe("assets/fotos/musikhochschule/Speisefotos/2-3/abc_1.jpg");
    expect(normalizeImagePath(`${base}/assets/fotos/x/y.png`, base)).toBe("assets/fotos/x/y.png");
  });
  it("rejects foreign hosts, traversal and non-photo paths", () => {
    expect(normalizeImagePath("https://evil.example/assets/fotos/a.jpg", base)).toBeNull();
    expect(normalizeImagePath("assets/fotos/../../secret.jpg", base)).toBeNull();
    expect(normalizeImagePath("assets/icons/V.png", base)).toBeNull();
    expect(isValidImagePath("assets/fotos/a.svg")).toBe(false);
    expect(normalizeImagePath(undefined, base)).toBeNull();
  });
});
