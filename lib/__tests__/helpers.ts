import { flattenEntries } from "@/lib/filters";
import type { MenuEntry } from "@/types/menu";

export const ENTRIES: MenuEntry[] = [
  {
    locationId: "1", locationName: "Central", date: "2026-11-03", mealGroup: "Menü 1",
    dishes: [
      { id: "a", name: "Spaetzle", allergens: ["GlW", "Ei", "La", "Ei"] },
      { id: "b", name: "Rice bowl", allergens: [] },
    ],
  },
  {
    locationId: "2", locationName: "Vaihingen", date: "2026-11-02", mealGroup: "Veggie",
    dishes: [
      { id: "c", name: "Tofu curry", allergens: ["So", "Se", "Sl"] },
      { id: "d", name: "Salad", allergens: ["Xx"] },
    ],
  },
  {
    locationId: "1", locationName: "Central", date: "2026-11-10", mealGroup: "Veggie",
    dishes: [{ id: "e", name: "Nut roast", allergens: ["NuH", "Gl", "Sf"] }],
  },
];

export const DISHES = flattenEntries(ENTRIES);
