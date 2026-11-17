export type AllergenCategoryId =
  | "gluten"
  | "nuts"
  | "milk"
  | "egg"
  | "soy"
  | "celery"
  | "mustard"
  | "sesame";

export interface AllergenCategory {
  id: AllergenCategoryId;
  label: string;
  /** Source-code rule: `prefix` matches `Gl*`, `exact` matches `La`. */
  rule: { kind: "prefix" | "exact"; value: string };
  /** Chart color, consistent across all visualizations. */
  color: string;
}

export type CategoryCounts = Record<AllergenCategoryId, number>;
