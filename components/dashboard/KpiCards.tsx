import type { Kpis } from "@/lib/aggregations";
import { CATEGORY_BY_ID } from "@/lib/allergens";
import { formatPercent } from "@/lib/formatters";

export function KpiCards({ kpis }: { kpis: Kpis }) {
  const items = [
    { label: "Total dishes", value: kpis.totalDishes.toLocaleString("en-GB"), hint: "Unique dish entries" },
    { label: "Allergen-free dishes", value: kpis.allergenFreeDishes.toLocaleString("en-GB"), hint: "None of the 8 configured categories" },
    { label: "Allergen-free share", value: formatPercent(kpis.allergenFreePercent), hint: "Of all dishes in view" },
    {
      label: "Most frequent allergen",
      value: kpis.topAllergen ? CATEGORY_BY_ID[kpis.topAllergen.id].label : "–",
      hint: kpis.topAllergen ? `In ${kpis.topAllergen.count} dishes` : "No allergens in view",
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <dt className="text-sm text-zinc-600">{i.label}</dt>
          <dd className="mt-1 text-2xl font-semibold text-zinc-900">{i.value}</dd>
          <p className="mt-1 text-xs text-zinc-600">{i.hint}</p>
        </div>
      ))}
    </dl>
  );
}
