import {
  PREFERENCES_VERSION, createPreferences, parsePreferences, preferencesToFilters, serializePreferences,
} from "@/lib/preferences";
import { initQuestionnaire, questionnaireReducer, toPreferences } from "@/lib/questionnaire";
import { describe, expect, it } from "vitest";

describe("preferences persistence", () => {
  it("round-trips valid preferences", () => {
    const p = createPreferences(["milk", "gluten"], ["4", "16"]);
    expect(p.allergens).toEqual(["gluten", "milk"]); // canonical order
    expect(parsePreferences(serializePreferences(p))).toEqual(p);
  });
  it("accepts an empty selection (no allergens, all mensas)", () => {
    expect(parsePreferences(serializePreferences(createPreferences([], [])))).toEqual({
      version: PREFERENCES_VERSION, allergens: [], locationIds: [],
    });
  });
  it("rejects missing, malformed, outdated or incomplete data", () => {
    expect(parsePreferences(null)).toBeNull();
    expect(parsePreferences("")).toBeNull();
    expect(parsePreferences("{not json")).toBeNull();
    expect(parsePreferences("[]")).toBeNull();
    expect(parsePreferences(JSON.stringify({ version: 0, allergens: [], locationIds: [] }))).toBeNull();
    expect(parsePreferences(JSON.stringify({ allergens: [], locationIds: [] }))).toBeNull();
    expect(parsePreferences(JSON.stringify({ version: 1, allergens: [] }))).toBeNull();
    expect(parsePreferences(JSON.stringify({ version: 1, allergens: ["bogus"], locationIds: [] }))).toBeNull();
    expect(parsePreferences(JSON.stringify({ version: 1, allergens: [], locationIds: [1] }))).toBeNull();
  });
  it("seeds details filters without touching other filters", () => {
    const f = preferencesToFilters(createPreferences(["egg"], ["2"]));
    expect(f).toMatchObject({ allergens: ["egg"], locationIds: ["2"], from: null, mealGroups: [] });
    expect(preferencesToFilters(null).allergens).toEqual([]);
  });
});

describe("questionnaire", () => {
  it("collects multiple allergens and mensas and completes", () => {
    let s = initQuestionnaire();
    s = questionnaireReducer(s, { type: "toggleAllergen", id: "gluten" });
    s = questionnaireReducer(s, { type: "toggleAllergen", id: "nuts" });
    s = questionnaireReducer(s, { type: "toggleAllergen", id: "nuts" }); // untoggle
    s = questionnaireReducer(s, { type: "next" });
    s = questionnaireReducer(s, { type: "toggleLocation", id: "4" });
    s = questionnaireReducer(s, { type: "toggleLocation", id: "16" });
    expect(s.step).toBe(1);
    expect(toPreferences(s)).toEqual({ version: 1, allergens: ["gluten"], locationIds: ["4", "16"] });
    s = questionnaireReducer(s, { type: "next" });
    expect(s.step).toBe(2);
    expect(questionnaireReducer(s, { type: "next" }).step).toBe(2);
  });
  it("supports select all, clear, back and continuing with nothing selected", () => {
    let s = initQuestionnaire();
    s = questionnaireReducer(s, { type: "selectAllLocations", ids: ["1", "2", "3"] });
    expect(s.locationIds).toEqual(["1", "2", "3"]);
    s = questionnaireReducer(s, { type: "clearLocations" });
    expect(toPreferences(s)).toEqual({ version: 1, allergens: [], locationIds: [] });
    expect(questionnaireReducer(s, { type: "back" }).step).toBe(0);
  });
  it("prefills when editing", () => {
    expect(initQuestionnaire({ allergens: ["soy"], locationIds: ["2"] })).toMatchObject({ step: 0, allergens: ["soy"], locationIds: ["2"] });
  });
});
