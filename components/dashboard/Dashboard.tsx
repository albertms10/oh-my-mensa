"use client";

import {
  AllergenDistribution, AllergenFreeOverTime, AllergensByMealGroup, AllergensOverTime, LocationComparison,
} from "@/components/charts/Charts";
import { FilterBar } from "@/components/filters/FilterBar";
import { AllergenFreeList } from "@/components/tables/AllergenFreeList";
import { DishExplorer } from "@/components/tables/DishExplorer";
import { Card, EmptyState } from "@/components/ui/Card";
import { SiteNav } from "@/components/ui/SiteNav";
import { computeKpis } from "@/lib/aggregations";
import { ALLERGEN_CATEGORIES } from "@/lib/allergens";
import { chartVisibility } from "@/lib/chart-visibility";
import { loadMenu } from "@/lib/client/api";
import { persistFilters, readInitialFilters, sanitizeFilters } from "@/lib/filter-url";
import { EMPTY_FILTERS, applyBaseFilters, filterByAllergens, flattenEntries, type DashboardFilters } from "@/lib/filters";
import { formatDateLong, formatDateTime } from "@/lib/formatters";
import { createPreferences, preferencesToFilters, readStoredPreferences } from "@/lib/preferences";
import { usePreferences } from "@/lib/use-preferences";
import type { AllergenCategoryId } from "@/types/allergens";
import type { FlatDish, MenuResponse } from "@/types/menu";
import { AlertTriangle, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DishDetails } from "./DishDetails";
import { KpiCards } from "./KpiCards";

interface State { data: MenuResponse | null; error: string | null; loading: boolean }

const NO_ALLERGENS: AllergenCategoryId[] = [];
const NAV = [["#overview", "Overview"], ["#charts", "Charts"], ["#explorer", "Explorer"], ["#allergen-free", "Allergen-free"]];

export function Dashboard() {
  const [state, setState] = useState<State>({ data: null, error: null, loading: true });
  // Date, location and meal-group filters: URL, else stored, else seeded from the preferences. Safe for SSR/hydration: nothing filter-dependent renders before data loads.
  const [localFilters, setLocalFilters] = useState<DashboardFilters>(() =>
    typeof window === "undefined" ? EMPTY_FILTERS : readInitialFilters(preferencesToFilters(readStoredPreferences())),
  );
  const [selected, setSelected] = useState<FlatDish | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMenu().then((r) => {
      if (cancelled) return;
      setState({ data: r.data ?? null, error: r.error ?? null, loading: false });
      if (r.data) {
        const flat = flattenEntries(r.data.entries);
        const days = flat.map((d) => d.date).sort();
        setLocalFilters((f) =>
          sanitizeFilters(f, {
            locationIds: flat.map((d) => d.locationId),
            mealGroups: flat.map((d) => d.mealGroup),
            minDate: days.at(0),
            maxDate: days.at(-1),
          }),
        );
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { persistFilters(localFilters); }, [localFilters]);

  // The allergen filter IS the overview preference: one shared state, persisted in localStorage.
  const { state: prefState, save } = usePreferences();
  const prefs = prefState.status === "ready" ? prefState.preferences : null;
  const allergens = prefs?.allergens ?? NO_ALLERGENS;
  const filters = useMemo<DashboardFilters>(() => ({ ...localFilters, allergens }), [localFilters, allergens]);
  const setFilters = (f: DashboardFilters) => {
    setLocalFilters({ ...f, allergens: [] });
    if (f.allergens.join() !== allergens.join()) save(createPreferences(f.allergens, prefs?.locationIds ?? []));
  };

  const reload = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    void loadMenu({ refresh: true }).then((r) =>
      setState((s) => ({ data: r.data ?? s.data, error: r.error ?? null, loading: false })),
    );
  };

  const all = useMemo(() => flattenEntries(state.data?.entries ?? []), [state.data]);
  const locations = useMemo(
    () => [...new Map(all.map((d) => [d.locationId, d.locationName]))].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)),
    [all],
  );
  const mealGroups = useMemo(() => [...new Set(all.map((d) => d.mealGroup))].sort(), [all]);
  const dates = useMemo(() => all.map((d) => d.date).sort(), [all]);

  const dishes = useMemo(() => applyBaseFilters(all, filters), [all, filters]);
  const explorerDishes = useMemo(() => filterByAllergens(dishes, filters.allergens), [dishes, filters.allergens]);
  const categories = useMemo(
    () => (filters.allergens.length ? ALLERGEN_CATEGORIES.filter((c) => filters.allergens.includes(c.id)) : [...ALLERGEN_CATEGORIES]),
    [filters.allergens],
  );
  const vis = useMemo(() => chartVisibility(dishes, categories.length), [dishes, categories.length]);
  const kpis = useMemo(() => computeKpis(dishes, categories.map((c) => c.id)), [dishes, categories]);

  const periodFrom = filters.from ?? dates.at(0);
  const periodTo = filters.to ?? dates.at(-1);
  const source = state.data?.source;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <div>
            <h1 className="text-lg font-semibold">Allergen Analytics</h1>
            <p className="text-xs text-zinc-600">
              Allergen patterns in canteen menus from MaxManager.{" "}
              <a href="https://www.studierendenwerk-stuttgart.de/essen/speiseplan" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-700 underline-offset-2 hover:underline">
                Original menu <ExternalLink className="size-3" aria-hidden /><span className="sr-only">(opens in a new tab)</span>
              </a>
            </p>
          </div>
          <SiteNav />
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-700">
            {source && (
              <span className={`rounded-full px-2 py-0.5 font-medium ${source === "mock" ? "bg-amber-100 text-amber-900" : "bg-green-100 text-green-900"}`}>
                {source === "mock" ? "Mock data" : "MaxManager (live)"}
              </span>
            )}
            {state.data && periodFrom && periodTo && <span>Period: {formatDateLong(periodFrom)} – {formatDateLong(periodTo)}</span>}
            {state.data && <span>Updated: {formatDateTime(state.data.fetchedAt)}</span>}
            <button type="button" onClick={reload} disabled={state.loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60">
              {state.loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
              Refresh
            </button>
          </div>
        </div>
        <nav aria-label="Sections" className="mx-auto max-w-7xl overflow-x-auto px-4">
          <ul className="flex gap-4 text-sm">
            {NAV.map(([href, label]) => (
              <li key={href}><a href={href} className="inline-block whitespace-nowrap border-b-2 border-transparent py-2 text-zinc-700 hover:border-zinc-400 hover:text-zinc-900">{label}</a></li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6" aria-busy={state.loading}>
        {state.error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <span className="flex items-center gap-2"><AlertTriangle className="size-4" aria-hidden />{state.error}</span>
            <button type="button" onClick={reload} className="rounded-lg border border-red-300 bg-white px-3 py-1 font-medium">Retry</button>
          </div>
        )}

        {!state.data && state.loading && (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-zinc-700"><Loader2 className="size-5 animate-spin" aria-hidden />Loading menu data…</div>
        )}

        {!state.data && !state.loading && !state.error && <p className="text-sm text-zinc-700">No data available.</p>}

        {state.data && (
          <>
            <section id="overview" aria-label="Filters and key figures" className="scroll-mt-24 space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <FilterBar filters={filters} onChange={setFilters} locations={locations} mealGroups={mealGroups}
                  minDate={dates.at(0)} maxDate={dates.at(-1)} />
                {filters.allergens.length > 0 && (
                  <p className="mt-3 text-xs text-zinc-600">
                    The allergen selection is shared with the overview. It narrows the allergen charts and the dish explorer (dishes containing them), and turn the allergen-free chart and list into dishes without them. KPIs still cover all dishes in the selected period, locations and meal groups.
                  </p>
                )}
              </div>
              <KpiCards kpis={kpis} />
              <p className="text-xs text-zinc-600">Category counts overlap: a dish with several allergens is counted once in each category, so they must not be summed into a dish total.</p>
            </section>

            <div id="charts" className="grid scroll-mt-24 grid-cols-1 gap-6 xl:grid-cols-2">
              {dishes.length === 0 && <div className="xl:col-span-2"><Card><EmptyState /></Card></div>}
              {vis.visible.overTime && <div className="xl:col-span-2"><AllergensOverTime dishes={dishes} categories={categories} /></div>}
              {vis.visible.distribution && <AllergenDistribution dishes={dishes} categories={categories} />}
              {vis.visible.byMealGroup && <AllergensByMealGroup dishes={dishes} categories={categories} />}
              {vis.visible.freeOverTime && <AllergenFreeOverTime dishes={dishes} excluded={filters.allergens} />}
              {vis.visible.locations && <LocationComparison dishes={dishes} categories={categories} excluded={filters.allergens} />}
              {vis.hidden.length > 0 && (
                <p className="text-xs text-zinc-600 xl:col-span-2">
                  Hidden for the current filters: {vis.hidden.map((h) => `${h.chart} (${h.reason})`).join("; ")}.
                </p>
              )}
            </div>

            <DishExplorer dishes={explorerDishes} onSelect={setSelected} />
            <AllergenFreeList dishes={dishes} excluded={filters.allergens} onSelect={setSelected} />
          </>
        )}
      </main>

      {selected && <DishDetails dish={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
