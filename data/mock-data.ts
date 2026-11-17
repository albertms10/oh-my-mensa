import type { Dish, MenuEntry } from "@/types/menu";

/** Deterministic PRNG so the mock dataset is identical on every reload. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LOCATIONS = [
  { id: "1", name: "Mensa Central" },
  { id: "2", name: "Mensa Vaihingen" },
  { id: "3", name: "Mensa Hohenheim" },
];

const POOLS: Record<string, [string, string[]][]> = {
  "Menü 1": [
    ["Käsespätzle mit Röstzwiebeln", ["GlW", "Ei", "La"]],
    ["Schnitzel mit Pommes", ["GlW", "Ei"]],
    ["Hähnchen-Geschnetzeltes mit Reis", ["La", "Sl"]],
    ["Gebratener Lachs mit Kartoffeln", []],
    ["Rinderbraten mit Rotkohl", ["Sf", "Sl"]],
    ["Linseneintopf mit Würstchen", ["Sl", "Sf"]],
    ["Hackbällchen in Tomatensauce", ["GlW", "Ei", "Sl"]],
    ["Gemüsepfanne mit Reis", []],
  ],
  "Menü 2": [
    ["Pasta Bolognese", ["GlW", "Sl"]],
    ["Pizza Margherita", ["GlW", "La"]],
    ["Currywurst mit Brötchen", ["GlW", "Sf", "Sl"]],
    ["Nudelauflauf Schinken-Sahne", ["GlW", "La", "Ei"]],
    ["Kartoffelsuppe", ["Sl", "La"]],
    ["Reispfanne mit Hähnchen", ["So"]],
    ["Fischstäbchen mit Kartoffelpüree", ["GlW", "La", "Ei"]],
  ],
  Veggie: [
    ["Tofu-Curry mit Basmatireis", ["So", "Se", "Sl"]],
    ["Falafel-Bowl mit Hummus", ["Se", "Sl"]],
    ["Gemüse-Lasagne", ["GlW", "La", "Ei"]],
    ["Ofenkartoffel mit Kräuterquark", ["La"]],
    ["Gebackener Blumenkohl mit Reis", []],
    ["Kichererbsen-Spinat-Eintopf", ["Sl"]],
    ["Walnuss-Linsen-Bratling", ["NuW", "GlW", "Ei"]],
    ["Veganes Gemüse-Chili", []],
    ["Quinoa-Salat mit Mandeln", ["NuM"]],
  ],
};

const START = Date.UTC(2026, 10, 2); // Mon 2026-11-02
const WEEKDAYS = 15;
/** Whole days without menu data. */
const NO_MENU_DAYS = new Set(["2026-11-11", "2026-11-18"]);

export function generateMockEntries(): MenuEntry[] {
  const rand = mulberry32(20261102);
  const entries: MenuEntry[] = [];
  for (let n = 0; n < WEEKDAYS; n++) {
    const d = new Date(START);
    d.setUTCDate(d.getUTCDate() + Math.floor(n / 5) * 7 + (n % 5));
    const date = d.toISOString().slice(0, 10);
    if (NO_MENU_DAYS.has(date)) continue;
    for (const loc of LOCATIONS) {
      // Hohenheim is closed on Fridays.
      if (loc.id === "3" && d.getUTCDay() === 5) continue;
      for (const [group, pool] of Object.entries(POOLS)) {
        const count = 2 + Math.floor(rand() * 3);
        const picked = [...pool].sort(() => rand() - 0.5).slice(0, count);
        const dishes: Dish[] = picked.map(([name, allergens], i) => ({
          id: `${loc.id}-${date}-${group}-${i}`.replace(/\s/g, ""),
          name,
          allergens,
        }));
        entries.push({ locationId: loc.id, locationName: loc.name, date, mealGroup: group, dishes });
      }
    }
  }
  return entries;
}
