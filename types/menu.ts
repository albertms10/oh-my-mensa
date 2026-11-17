import type { AllergenCategoryId } from "./allergens";

export interface Dish {
  id: string;
  name: string;
  /** Original source allergen codes. */
  allergens: string[];
  /** Relative MaxManager photo path (e.g. assets/fotos/…/x.jpg), served via /api/dish-image. */
  image?: string;
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

export interface MenuResponse {
  source: DataSource;
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
  categories: AllergenCategoryId[];
  allergenFree: boolean;
  image?: string;
}
