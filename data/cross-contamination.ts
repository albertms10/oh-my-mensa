import type { ContaminationRules } from "@/types/allergens";

/**
 * Possible cross-contamination rules. EDIT THIS FILE to adapt them.
 *
 * Per allergen category, list patterns that are matched against the dish NAME:
 *  - case-insensitive and diacritic-insensitive ("müsli" matches "Musli")
 *  - matched anywhere in the name (a plain "pommes" matches "Currywurst mit Pommes frites")
 *  - "*" is a wildcard for any characters, e.g. "*frittiert*" or "kartoffel*puffer"
 *  - use { pattern, reason } to show a short explanation next to the warning
 *
 * A hint is only added for categories the dish does not already declare. A hint is treated like a
 * contained allergen everywhere: filters, counts, charts, the overview's suitable dishes and the
 * "allergen-free" logic (the declared allergen codes themselves stay unchanged and are shown separately).
 * The rules below are illustrative examples; review them with the canteen before relying on them.
 */
export const CONTAMINATION_RULES: ContaminationRules = {
  gluten: [
    { pattern: "pommes*", reason: "May be fried in the same oil as breaded items." },
  ],
  nuts: [],
  milk: [],
  egg: [],
  soy: [],
  celery: [],
  mustard: [],
  sesame: [],
};
