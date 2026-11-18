import { CONTAMINATION_RULES } from "@/data/cross-contamination";
import type { AllergenCategoryId, ContaminationHint, ContaminationRules } from "@/types/allergens";
import { ALLERGEN_CATEGORIES } from "./allergens";

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

function toRegExp(pattern: string): RegExp | null {
  const p = normalize(pattern);
  if (!p.replace(/\*/g, "")) return null; // empty or only wildcards
  const body = p.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(body);
}

/**
 * Possible cross-contamination hints for a dish name. Categories the dish already
 * declares are skipped. At most one hint per category (first matching rule wins).
 */
export function findCrossContamination(
  dishName: string,
  declared: readonly AllergenCategoryId[] = [],
  rules: ContaminationRules = CONTAMINATION_RULES,
): ContaminationHint[] {
  const name = normalize(dishName);
  const hints: ContaminationHint[] = [];
  for (const { id } of ALLERGEN_CATEGORIES) {
    if (declared.includes(id)) continue;
    for (const rule of rules[id] ?? []) {
      const pattern = typeof rule === "string" ? rule : rule.pattern;
      const re = toRegExp(pattern);
      if (re?.test(name)) {
        hints.push({ category: id, ...(typeof rule === "object" && rule.reason ? { reason: rule.reason } : {}) });
        break;
      }
    }
  }
  return hints;
}
