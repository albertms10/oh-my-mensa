"use client";

import { Card, EmptyState } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { DishImage } from "@/components/ui/DishImage";
import { exclusionLabel } from "@/lib/allergens";
import { filterWithout } from "@/lib/filters";
import { formatDateLong } from "@/lib/formatters";
import type { AllergenCategoryId } from "@/types/allergens";
import type { FlatDish } from "@/types/menu";
import { useMemo, useState } from "react";

const sel = "h-9 rounded-lg border border-zinc-300 bg-white px-2 text-sm";

/**
 * Receives dishes already narrowed by the global date/location/meal-group filters.
 * `excluded` = categories chosen in the global allergen dropdown; empty = all eight.
 */
export function AllergenFreeList({
  dishes, excluded, onSelect,
}: { dishes: FlatDish[]; excluded: AllergenCategoryId[]; onSelect: (d: FlatDish) => void }) {
  const free = useMemo(() => filterWithout(dishes, excluded), [dishes, excluded]);
  const { title, scope } = exclusionLabel(excluded);
  const [loc, setLoc] = useState("");
  const [date, setDate] = useState("");
  const [group, setGroup] = useState("");

  const uniq = (f: (d: FlatDish) => string) => [...new Set(free.map(f))].sort();
  const locations = [...new Map(free.map((d) => [d.locationId, d.locationName]))];
  const shown = free
    .filter((d) => (!loc || d.locationId === loc) && (!date || d.date === date) && (!group || d.mealGroup === group))
    .sort((a, b) => a.date.localeCompare(b.date) || a.locationName.localeCompare(b.locationName) || a.name.localeCompare(b.name));

  const byDate = Map.groupBy(shown, (d) => d.date);

  return (
    <Card id="allergen-free" title={title}
      subtitle={`Dishes with ${scope} in the source data. Other allergens may be present; not a statement of medical suitability.`}
      action={
        <div className="flex flex-wrap gap-2">
          <select aria-label="Location" className={sel} value={loc} onChange={(e) => setLoc(e.target.value)}>
            <option value="">All locations</option>
            {locations.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
          <select aria-label="Date" className={sel} value={date} onChange={(e) => setDate(e.target.value)}>
            <option value="">All dates</option>
            {uniq((d) => d.date).map((d) => <option key={d} value={d}>{formatDateLong(d)}</option>)}
          </select>
          <select aria-label="Meal group" className={sel} value={group} onChange={(e) => setGroup(e.target.value)}>
            <option value="">All meal groups</option>
            {uniq((d) => d.mealGroup).map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      }>
      {shown.length === 0 ? <EmptyState message="No matching dishes for the current selection." /> : (
        <div className="space-y-4">
          {[...byDate].map(([d, list]) => (
            <div key={d}>
              <h3 className="mb-1 text-sm font-semibold text-zinc-800">{formatDateLong(d)}</h3>
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
                {list.map((dish) => (
                  <li key={dish.key}>
                    <button type="button" onClick={() => onSelect(dish)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50">
                      <span className="flex items-center gap-3 font-medium text-zinc-900"><DishImage image={dish.image} alt="" className="size-12" />{dish.name}</span>
                      <span className="flex flex-wrap items-center gap-1 text-xs text-zinc-600">
                        {dish.categories.map((c) => <CategoryBadge key={c} id={c} />)}
                        <span>{dish.locationName} · {dish.mealGroup}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
