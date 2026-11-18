import type { AllergenCategoryId } from "@/types/allergens";
import { createPreferences, type Preferences } from "./preferences";

/** 0 = allergens, 1 = mensas, 2 = confirmation. */
export interface QuestionnaireState {
  step: 0 | 1 | 2;
  allergens: AllergenCategoryId[];
  locationIds: string[];
}

export type QuestionnaireAction =
  | { type: "toggleAllergen"; id: AllergenCategoryId }
  | { type: "toggleLocation"; id: string }
  | { type: "selectAllLocations"; ids: string[] }
  | { type: "clearLocations" }
  | { type: "next" }
  | { type: "back" };

export function initQuestionnaire(initial?: Pick<Preferences, "allergens" | "locationIds">): QuestionnaireState {
  return { step: 0, allergens: [...(initial?.allergens ?? [])], locationIds: [...(initial?.locationIds ?? [])] };
}

const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

export function questionnaireReducer(s: QuestionnaireState, a: QuestionnaireAction): QuestionnaireState {
  switch (a.type) {
    case "toggleAllergen": return { ...s, allergens: toggle(s.allergens, a.id) };
    case "toggleLocation": return { ...s, locationIds: toggle(s.locationIds, a.id) };
    case "selectAllLocations": return { ...s, locationIds: [...a.ids] };
    case "clearLocations": return { ...s, locationIds: [] };
    case "next": return { ...s, step: Math.min(2, s.step + 1) as QuestionnaireState["step"] };
    case "back": return { ...s, step: Math.max(0, s.step - 1) as QuestionnaireState["step"] };
  }
}

export function toPreferences(s: QuestionnaireState): Preferences {
  return createPreferences(s.allergens, s.locationIds);
}
