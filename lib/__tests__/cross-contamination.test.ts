import { CONTAMINATION_RULES } from "@/data/cross-contamination";
import { countByCategory, shareWithAny } from "@/lib/aggregations";
import { findCrossContamination } from "@/lib/cross-contamination";
import { filterByAllergens, filterWithout, flattenEntries } from "@/lib/filters";
import { buildTodayOverview, evaluateDish } from "@/lib/suitability";
import { describe, expect, it } from "vitest";

const rules = {
  gluten: [{ pattern: "pommes*", reason: "Shared fryer" }, "kartoffel*puffer", "mü*sli"],
  soy: ["tofu"],
};

describe("findCrossContamination", () => {
  it("matches anywhere in the name, case- and diacritic-insensitively", () => {
    expect(findCrossContamination("Currywurst mit POMMES frites", [], rules)).toEqual([{ category: "gluten", reason: "Shared fryer" }]);
    expect(findCrossContamination("Frisches Musli", [], rules)).toEqual([{ category: "gluten" }]);
  });
  it("supports * wildcards in the middle", () => {
    expect(findCrossContamination("Kartoffelpuffer", [], rules)).toHaveLength(1);
    expect(findCrossContamination("Kartoffel-Gemüse-Puffer", [], rules)).toHaveLength(1);
    expect(findCrossContamination("Gemüse", [], rules)).toEqual([]);
  });
  it("skips categories the dish already declares and returns one hint per category", () => {
    expect(findCrossContamination("Pommes mit Kartoffelpuffer", ["gluten"], rules)).toEqual([]);
    expect(findCrossContamination("Pommes mit Kartoffelpuffer", [], rules)).toHaveLength(1);
  });
  it("treats regex characters literally and ignores empty or wildcard-only patterns", () => {
    expect(findCrossContamination("a(b)", [], { egg: ["(b)"] })).toHaveLength(1);
    expect(findCrossContamination("anything", [], { egg: ["", "*", "**"] })).toEqual([]);
    expect(findCrossContamination("anything", [], {})).toEqual([]);
  });
  it("ships editable default rules", () => {
    expect(findCrossContamination("Pommes frites", [], CONTAMINATION_RULES)[0]?.category).toBe("gluten");
  });
});

describe("cross-contamination is treated like a contained allergen", () => {
  const entries = [{
    locationId: "1", locationName: "Central", date: "2026-11-17", mealGroup: "Sides",
    dishes: [{ id: "p", name: "Pommes frites", allergens: [] }, { id: "r", name: "Reis", allergens: [] }],
  }];
  const dishes = flattenEntries(entries, rules);
  it("keeps declared categories separate from effective ones", () => {
    expect(dishes[0].categories).toEqual([]);
    expect(dishes[0].effectiveCategories).toEqual(["gluten"]);
    expect(dishes[1].effectiveCategories).toEqual([]);
  });
  it("excludes the dish from suitable results for an avoided allergen", () => {
    const e = evaluateDish(dishes[0], ["gluten"]);
    expect(e.status).toBe("contains");
    expect(e.conflicts).toEqual([]);
    expect(e.warnings).toEqual([{ category: "gluten", reason: "Shared fryer" }]);
    expect(evaluateDish(dishes[1], ["gluten"]).status).toBe("match");
  });
  it("only matters for categories the user avoids", () => {
    expect(evaluateDish(dishes[0], ["milk"]).status).toBe("match");
    expect(evaluateDish(dishes[0], []).status).toBe("match");
  });
  it("counts the dish as not suitable and as excluded because of cross-contamination", () => {
    const o = buildTodayOverview({ dishes, locations: [], selectedLocationIds: [], avoid: ["gluten"], date: "2026-11-17" });
    expect(o.counts).toMatchObject({ suitable: 1, containing: 1, warned: 1 });
    expect(o.suitable[0].groups[0].dishes.map((d) => d.dishId)).toEqual(["r"]);
  });
  it("is not allergen-free, is not 'without' the allergen, and is counted in category counts", () => {
    expect(dishes[0].allergenFree).toBe(false);
    expect(filterWithout(dishes, ["gluten"]).map((d) => d.dishId)).toEqual(["r"]);
    expect(filterWithout(dishes, []).map((d) => d.dishId)).toEqual(["r"]);
    expect(filterByAllergens(dishes, ["gluten"]).map((d) => d.dishId)).toEqual(["p"]);
    expect(countByCategory(dishes).gluten).toBe(1);
    expect(shareWithAny(dishes, ["gluten"]).count).toBe(1);
  });
});
