"use client";

import { Card, EmptyState } from "@/components/ui/Card";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ContaminationBadge } from "@/components/ui/ContaminationBadge";
import { DishImage } from "@/components/ui/DishImage";
import { ALLERGEN_CATEGORIES } from "@/lib/allergens";
import { formatDate } from "@/lib/formatters";
import type { FlatDish } from "@/types/menu";
import { ArrowDown, ArrowUp, Check, Search } from "lucide-react";
import { useMemo, useState } from "react";

type SortKey = "name" | "locationName" | "date" | "mealGroup" | "allergenFree";
const PAGE_SIZE = 15;
const COLS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Dish" },
  { key: "locationName", label: "Location" },
  { key: "date", label: "Date" },
  { key: "mealGroup", label: "Meal group" },
];

export function DishExplorer({ dishes, onSelect }: { dishes: FlatDish[]; onSelect: (d: FlatDish) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "date", dir: 1 });
  const [page, setPage] = useState(0);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = dishes.filter(
      (d) =>
        (!q || d.name.toLowerCase().includes(q)) &&
        (!category || (category === "free" ? d.allergenFree : d.effectiveCategories.includes(category as never))),
    );
    return filtered.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      const c = typeof av === "boolean" ? Number(av) - Number(bv as boolean) : String(av).localeCompare(String(bv));
      return (c || a.date.localeCompare(b.date) || a.name.localeCompare(b.name)) * sort.dir;
    });
  }, [dishes, query, category, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const header = (key: SortKey, label: string) => (
    <th key={label} scope="col" aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
      className="whitespace-nowrap px-3 py-2 text-left font-medium text-zinc-700">
      <button type="button" className="inline-flex items-center gap-1 hover:text-zinc-900"
        onClick={() => { setSort((s) => ({ key, dir: s.key === key && s.dir === 1 ? -1 : 1 })); setPage(0); }}>
        {label}
        {sort.key === key && (sort.dir === 1 ? <ArrowUp className="size-3" aria-hidden /> : <ArrowDown className="size-3" aria-hidden />)}
      </button>
    </th>
  );

  return (
    <Card id="explorer" title="Dish explorer" subtitle={`${rows.length} dishes. Click a row for details.`}
      action={
        <div className="flex flex-wrap gap-2">
          <label className="relative">
            <span className="sr-only">Search dishes</span>
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-zinc-500" aria-hidden />
            <input type="search" value={query} placeholder="Search dish name"
              onChange={(e) => { setQuery(e.target.value); setPage(0); }}
              className="h-9 w-48 rounded-lg border border-zinc-300 pl-8 pr-2 text-sm" />
          </label>
          <label>
            <span className="sr-only">Filter by allergen</span>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }}
              className="h-9 rounded-lg border border-zinc-300 bg-white px-2 text-sm">
              <option value="">Any allergen status</option>
              <option value="free">Allergen-free only</option>
              {ALLERGEN_CATEGORIES.map((c) => <option key={c.id} value={c.id}>Contains {c.label}</option>)}
            </select>
          </label>
        </div>
      }>
      {rows.length === 0 ? <EmptyState /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  {COLS.map((c) => header(c.key, c.label))}
                  <th scope="col" className="px-3 py-2 text-left font-medium text-zinc-700">Categories</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-zinc-700">Source codes</th>
                  {header("allergenFree", "Allergen-free")}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {visible.map((d) => (
                  <tr key={d.key} tabIndex={0} onClick={() => onSelect(d)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(d))}
                    className="cursor-pointer hover:bg-zinc-50 focus:bg-zinc-50 focus:outline-2 focus:outline-blue-600">
                    <td className="px-3 py-2 font-medium text-zinc-900"><div className="flex items-center gap-3"><DishImage image={d.image} alt="" className="size-10" />{d.name}</div></td>
                    <td className="px-3 py-2">{d.locationName}</td>
                    <td className="whitespace-nowrap px-3 py-2">{formatDate(d.date)}</td>
                    <td className="px-3 py-2">{d.mealGroup}</td>
                    <td className="px-3 py-2"><div className="flex flex-wrap gap-1">{d.categories.map((c) => <CategoryBadge key={c} id={c} />)}<ContaminationBadge hints={d.crossContamination} compact /></div></td>
                    <td className="px-3 py-2 font-mono text-xs">{d.codes.join(", ") || "–"}</td>
                    <td className="px-3 py-2">{d.allergenFree ? <span className="inline-flex items-center gap-1 text-green-800"><Check className="size-4" aria-hidden />Yes</span> : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav aria-label="Pagination" className="mt-3 flex items-center justify-between text-sm text-zinc-700">
            <span>Page {current + 1} of {pages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1 disabled:opacity-50">Previous</button>
              <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}
                className="rounded-lg border border-zinc-300 px-3 py-1 disabled:opacity-50">Next</button>
            </div>
          </nav>
        </>
      )}
    </Card>
  );
}
