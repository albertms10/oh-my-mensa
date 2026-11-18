import type { AllergenCategoryId, ContaminationHint } from "./allergens";

export interface Dish {
  id: string;
  name: string;
  /** Original source allergen codes. */
  allergens: string[];
  /** Relative MaxManager photo path (e.g. assets/fotos/…/x.jpg), served via /api/dish-image. */
  image?: string;
  /** false = allergen information is missing in the source (distinct from "no allergens listed"). Default: true. */
  allergensKnown?: boolean;
}

export interface MenuEntry {
  locationId: string;
  locationName: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  mealGroup: string;
  dishes: Dish[];
}

export type DataSource = "mock" | "maxmanager";

export interface Location {
  id: string;
  name: string;
}

export interface MenuResponse {
  source: DataSource;
  /** All known locations, including those without a menu in the returned range. */
  locations: Location[];
  fetchedAt: string;
  entries: MenuEntry[];
}

/** A dish joined with its menu context and derived allergen info. */
export interface FlatDish {
  key: string;
  dishId: string;
  name: string;
  locationId: string;
  locationName: string;
  date: string;
  mealGroup: string;
  /** Deduplicated original codes. */
  codes: string[];
  /** Declared categories only (from the source codes). */
  categories: AllergenCategoryId[];
  /** Declared categories plus possible cross-contamination. All filtering, counting and "allergen-free" logic uses this. */
  effectiveCategories: AllergenCategoryId[];
  /** Possible cross-contamination from name-based rules; treated like contained allergens in logic, shown separately. */
  crossContamination: ContaminationHint[];
  /** False when the source has no allergen information for this dish. */
  allergensKnown: boolean;
  /** Known AND none of the 8 configured categories. */
  allergenFree: boolean;
  image?: string;
}
