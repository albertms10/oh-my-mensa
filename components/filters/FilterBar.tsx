"use client";

import { ALLERGEN_CATEGORIES } from "@/lib/allergens";
import { EMPTY_FILTERS, type DashboardFilters } from "@/lib/filters";
import type { AllergenCategoryId } from "@/types/allergens";
import { RotateCcw } from "lucide-react";
import { MultiSelect } from "./MultiSelect";

const dateCls = "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900";

export function FilterBar({
  filters, onChange, locations, mealGroups, minDate, maxDate,
}: {
  filters: DashboardFilters;
  onChange: (f: DashboardFilters) => void;
  locations: { id: string; name: string }[];
  mealGroups: string[];
  minDate?: string;
  maxDate?: string;
}) {
  const set = (patch: Partial<DashboardFilters>) => onChange({ ...filters, ...patch });
  const active = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);
  return (
    <div role="search" aria-label="Global filters" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
      <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
        From
        <input type="date" className={dateCls} value={filters.from ?? ""} min={minDate} max={filters.to ?? maxDate}
          onChange={(e) => set({ from: e.target.value || null })} />
      </label>
      <label className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">
        To
        <input type="date" className={dateCls} value={filters.to ?? ""} min={filters.from ?? minDate} max={maxDate}
          onChange={(e) => set({ to: e.target.value || null })} />
      </label>
      <MultiSelect label="Locations" allLabel="All locations"
        options={locations.map((l) => ({ value: l.id, label: l.name }))}
        selected={filters.locationIds} onChange={(locationIds) => set({ locationIds })} />
      <MultiSelect label="Meal groups" allLabel="All meal groups"
        options={mealGroups.map((g) => ({ value: g, label: g }))}
        selected={filters.mealGroups} onChange={(mealGroups) => set({ mealGroups })} />
      <MultiSelect label="Allergens" allLabel="All allergens"
        options={ALLERGEN_CATEGORIES.map((c) => ({ value: c.id, label: c.label, color: c.color }))}
        selected={filters.allergens} onChange={(a) => set({ allergens: a as AllergenCategoryId[] })} />
      <button type="button" disabled={!active} onClick={() => onChange(EMPTY_FILTERS)}
        className="inline-flex h-10 items-center justify-center gap-2 self-end rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50">
        <RotateCcw className="size-4" aria-hidden /> Reset filters
      </button>
    </div>
  );
}
