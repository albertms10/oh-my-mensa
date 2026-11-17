import { ALLERGEN_CATEGORIES, categoriesForCodes, isAllergenFree, matchesCategory } from "@/lib/allergens";
import { describe, expect, it } from "vitest";

describe("allergen matching", () => {
  it("matches prefix codes for gluten and nuts", () => {
    expect(categoriesForCodes(["GlW"])).toEqual(["gluten"]);
    expect(categoriesForCodes(["Gl"])).toEqual(["gluten"]);
    expect(categoriesForCodes(["NuH", "NuM"])).toEqual(["nuts"]);
  });
  it("matches exact codes only", () => {
    expect(categoriesForCodes(["La", "Ei", "So", "Sl", "Sf", "Se"])).toEqual([
      "milk", "egg", "soy", "celery", "mustard", "sesame",
    ]);
    expect(categoriesForCodes(["Lax", "Eier"])).toEqual([]);
    const milk = ALLERGEN_CATEGORIES.find((c) => c.id === "milk")!;
    expect(matchesCategory(milk, " La ")).toBe(true);
  });
  it("counts duplicates and multiple allergens once per category", () => {
    expect(categoriesForCodes(["GlW", "GlD", "Ei", "Ei"])).toEqual(["gluten", "egg"]);
  });
  it("detects allergen-free dishes", () => {
    expect(isAllergenFree([])).toBe(true);
    expect(isAllergenFree(["", "Xx"])).toBe(true);
    expect(isAllergenFree(["Ei"])).toBe(false);
  });
});
