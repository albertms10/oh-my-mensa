import type { MensaSection } from "@/lib/suitability";
import type { AllergenCategoryId } from "@/types/allergens";
import { DishCard } from "./DishCard";

export function MensaBlock({ section, avoid, emptyText }: { section: MensaSection; avoid: AllergenCategoryId[]; emptyText: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-stone-900">{section.locationName}</h3>
      {section.dishCount === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-stone-300 bg-white/60 p-3 text-sm text-stone-700">{emptyText}</p>
      ) : (
        section.groups.map((g) => (
          <div key={g.mealGroup} className="mt-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-600">{g.mealGroup}</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.dishes.map((d) => <DishCard key={d.key} dish={d} avoid={avoid} />)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function OverviewSkeleton({ withHeader = true }: { withHeader?: boolean }) {
  return (
    <div aria-busy="true" aria-label="Loading" className={`space-y-6 ${withHeader ? "mx-auto max-w-5xl px-4 py-6" : ""}`}>
      {withHeader && <div className="h-28 animate-pulse rounded-3xl bg-stone-200" />}
      <div className="h-6 w-48 animate-pulse rounded bg-stone-200" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-stone-200" />)}
      </div>
    </div>
  );
}
