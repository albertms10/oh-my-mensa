import type {
  AllergenCategory,
  AllergenCategoryId,
  CategoryCounts,
} from "@/types/allergens";

/** Single source of truth for allergen matching. */
export const ALLERGEN_CATEGORIES: readonly AllergenCategory[] = [
  { id: "gluten", label: "Gluten", rule: { kind: "prefix", value: "Gl" }, color: "#b45309" },
  { id: "nuts", label: "Nuts", rule: { kind: "prefix", value: "Nu" }, color: "#7c2d12" },
  { id: "milk", label: "Milk", rule: { kind: "exact", value: "La" }, color: "#2563eb" },
  { id: "egg", label: "Egg", rule: { kind: "exact", value: "Ei" }, color: "#ca8a04" },
  { id: "soy", label: "Soy", rule: { kind: "exact", value: "So" }, color: "#15803d" },
  { id: "celery", label: "Celery", rule: { kind: "exact", value: "Sl" }, color: "#0d9488" },
  { id: "mustard", label: "Mustard", rule: { kind: "exact", value: "Sf" }, color: "#a16207" },
  { id: "sesame", label: "Sesame", rule: { kind: "exact", value: "Se" }, color: "#9333ea" },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  ALLERGEN_CATEGORIES.map((c) => [c.id, c]),
) as Record<AllergenCategoryId, AllergenCategory>;

export function matchesCategory(category: AllergenCategory, code: string): boolean {
  const c = code.trim();
  if (!c) return false;
  return category.rule.kind === "prefix"
    ? c.startsWith(category.rule.value)
    : c === category.rule.value;
}

/** Categories present in a list of codes: deduplicated, in canonical order. */
export function categoriesForCodes(codes: readonly string[]): AllergenCategoryId[] {
  return ALLERGEN_CATEGORIES.filter((cat) =>
    codes.some((code) => matchesCategory(cat, code)),
  ).map((cat) => cat.id);
}

/** True only if none of the eight configured categories match. */
export function isAllergenFree(codes: readonly string[]): boolean {
  return categoriesForCodes(codes).length === 0;
}

export function emptyCounts(): CategoryCounts {
  return Object.fromEntries(
    ALLERGEN_CATEGORIES.map((c) => [c.id, 0]),
  ) as CategoryCounts;
}

/** Labels for "dishes without the selected categories" views; empty = all eight. */
export function exclusionLabel(ids: readonly AllergenCategoryId[]) {
  const names = ids.map((id) => CATEGORY_BY_ID[id].label);
  if (names.length === 0)
    return { title: "Allergen-free dishes", short: "Allergen-free", scope: "none of the 8 configured allergen categories" };
  return {
    title: names.length === 1 ? `${names[0]}-free dishes` : `Dishes without ${names.join(", ")}`,
    short: names.length === 1 ? `${names[0]}-free` : `Without ${names.join(", ")}`,
    scope: `no ${names.join(" or ")} code`,
  };
}
