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

/** Possible (not declared) contact with an allergen, e.g. through a shared fryer. */
export interface ContaminationHint {
  category: AllergenCategoryId;
  reason?: string;
}

/** A rule is a pattern string or `{ pattern, reason }`. See data/cross-contamination.ts. */
export type ContaminationRule = string | { pattern: string; reason?: string };
export type ContaminationRules = Partial<Record<AllergenCategoryId, readonly ContaminationRule[]>>;
