# Allergen Analytics

Internal dashboard that visualizes menu and allergen data from MaxManager: allergen trends, location and meal-group comparisons, a searchable dish explorer and a list of dishes without any of the eight configured allergen categories.

## Setup

```bash
bun add recharts zod lucide-react cheerio
bun add -d vitest
bun run dev          # http://localhost:3000, mock mode by default
```

Checks: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`.

## Data flow (no browser CORS issues)

```
Browser → Next.js UI → GET /api/allergenen → data provider → MaxManager
```

The browser only talks to our own `/api/allergenen` Route Handler. MaxManager is requested exclusively from server modules in `lib/server/`, so CORS does not apply and nothing from MaxManager is exposed to client code. Upstream data is validated with Zod; errors are mapped to safe messages (no URLs, cookies or stack traces). If the real provider fails, the UI shows the error and the active data source. It never falls back to mock data.

## Configuration

Copy `.env.example` to `.env.local`.

| Variable | Default | Purpose |
|---|---|---|
| `DATA_PROVIDER` | `mock` | `mock` or `maxmanager` |
| `CACHE_TTL_SECONDS` | `900` | Server-side in-memory cache duration; `0` disables it |
| `REQUEST_TIMEOUT_MS` | `10000` | Timeout per upstream request |
| `MAXMANAGER_BASE_URL` | `https://sws2.maxmanager.xyz` | MaxManager host |
| `MAXMANAGER_WEEKS` | `2` | Weeks (Mon–Fri) to fetch, from the current week |
| `MAXMANAGER_LOCATION_IDS` | empty | Optional `id:Name,id:Name`; otherwise read from `#listbox-locations` |

**Mock mode** serves a deterministic dataset (3 locations, 3 meal groups, 15 weekdays from 2026-11-02, two days without menu, one location closed on Fridays). No credentials are needed.

## MaxManager provider: what is known and what is assumed

Taken from the existing browser script (`allergenen.js`): `POST {base}/inc/ajax-php_konnektor.inc.php` with form fields `func=make_spl`, `locId`, `date`, `lang=de`, `startThisWeek`, `startNextWeek`; the response is an HTML fragment. Dishes are `.row.splMeal` elements, the name is in `.col-xs-12.visible-xs-block span`, and the allergen codes are the comma-separated `lang` attribute. Locations come from the `#listbox-locations` select on `index.php?mode=bed`.

Assumptions and open points:
- No API credentials are used. Only the session cookie issued by the public page is forwarded. If authentication is required, document and add it in `lib/server/maxmanager.ts` and `config.ts`.
- `startNextWeek` is set to the Monday of the following week. The script computed it as `startThisWeek + 7 days` from the first visible date; verify against real traffic.
- Meal groups follow `allergenen.js`: `.row.gruppenkopf .gruppenname` headers precede their `.row.splMeal` dishes in document order; dishes before any header get "Ohne Gruppe".
- The upstream HTML structure is unofficial and may change; the parser fails safe on missing elements.

## Allergen categories and counting

Mapping lives only in `lib/allergens.ts`:

| Category | Source codes |
|---|---|
| Gluten | `Gl*` |
| Nuts | `Nu*` |
| Milk | `La` |
| Egg | `Ei` |
| Soy | `So` |
| Celery | `Sl` |
| Mustard | `Sf` |
| Sesame | `Se` |

- Original codes are preserved (deduplicated) on every dish.
- A dish counts at most once per category and may count toward several; category counts overlap and are never summed into dish totals.
- A dish is "allergen-free" only if none of the eight categories match. This is not a statement of medical safety.
- Filters: date range, locations and meal groups apply to everything. The allergen filter narrows the allergen charts and the dish explorer (dishes *containing* a selected category) and turns the allergen-free chart and section into dishes *without* the selected categories (e.g. select Gluten → gluten-free dishes). With no selection the section lists dishes free of all eight categories. KPIs are not narrowed by the allergen filter (otherwise allergen-free counts would always be zero).

## Structure

`app/api/allergenen/route.ts` (Route Handler) · `lib/server/` (config, provider abstraction, MaxManager client, schema) · `lib/` (allergens, filters, aggregations, formatters; unit-tested in `lib/__tests__`) · `components/` (dashboard, charts, filters, tables, ui) · `data/mock-data.ts` · `types/`.

## Chart visibility

Charts that carry no information for the filtered data are hidden (`lib/chart-visibility.ts`), and a note lists what was hidden and why: location comparison needs ≥2 locations, meal-group chart ≥2 meal groups, both time charts ≥2 days, allergen distribution ≥2 allergen categories.

## Persistent filters

Selected filters are mirrored into the URL (`?from=…&to=…&loc=1&loc=4&group=…&allergen=gluten`) without adding history entries, so a filtered view can be shared or bookmarked. On load the URL wins; if it has no filter parameters, the last filters are restored from `localStorage`. Values that do not exist in the loaded data (e.g. a date range from weeks ago) are dropped. See `lib/filter-url.ts`.

## Dish photos

The menu HTML contains a photo per dish (`.contains-foto img.smallFoto`, path below `assets/fotos/`). The provider stores the validated relative path in `Dish.image`; the browser loads it through `/api/dish-image?p=…`, a server-side proxy that only accepts `assets/fotos/…` image paths on the configured MaxManager host and caches for 24 h. Photos appear in the dish details dialog, the dish explorer and the allergen-free list. Mock data has no photos, so a placeholder icon is shown. Photos are only shown for dishes where MaxManager provides one.

## Overview (`/`) and Details (`/details`)

- `/` is a mobile-first, non-technical overview of **today's** menu for the user's mensas. `/details` is the original analytics dashboard. Both share the data provider, allergen mapping, models, aggregation and filter functions. The overview adds `lib/suitability.ts` (evaluation, grouping) and `lib/dates.ts`.
- **Questionnaire:** shown when no valid preferences are stored. Step 1: allergens to exclude (optional). Step 2: mensas (optional; none = all; "select all"; works without a location list). Then a confirmation. Preferences are saved when finishing step 2. "Edit preferences" reopens it prefilled; "Reset" clears the preferences and restarts it.
- **Storage:** `localStorage["allergen-analytics:preferences"]` = `{version: 1, allergens: [...], locationIds: [...]}`, validated on read (malformed JSON, other versions, unknown allergens or incomplete data → questionnaire). `usePreferences()` uses `useSyncExternalStore`: it reports `loading` on the server and during hydration (no questionnaire flash, no hydration mismatch) and falls back to memory if storage is unavailable.
- **Filters in `/details`** keep their own URL/localStorage state. On a first visit without stored filters they are seeded from the overview preferences; changing them never writes back to the overview preferences.
- **Suitability:** `match` = allergen info available and none of the avoided categories; `contains` = at least one avoided category; `unknown` = allergen info missing (never treated as safe, never "allergen-free", never listed as suitable). "Allergen-free" is shown only for dishes with none of the 8 categories. With no avoided allergens, every dish with allergen info is suitable.
- **Missing allergen info:** MaxManager dishes whose row has no `lang` attribute (or whose data has no `allergens` field) are `allergensKnown: false`. An empty `lang=""` means "no allergens listed" (known). This heuristic is an assumption about the source; MaxManager may also use an empty attribute when information is missing.
- **Today:** the client computes today in `Europe/Berlin` (`MENSA_TIMEZONE`) and requests `/api/allergenen?date=YYYY-MM-DD`; the server fetches only that day and caches per provider and date. The response also lists all locations, so mensas without a menu can still be shown. In mock mode data is anchored to the current week, so weekdays have a menu today.
