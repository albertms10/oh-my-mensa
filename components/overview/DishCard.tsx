import { ContaminationBadge } from "@/components/ui/ContaminationBadge";
import { DishImage } from "@/components/ui/DishImage";
import { CATEGORY_BY_ID } from "@/lib/allergens";
import type { EvaluatedDish } from "@/lib/suitability";
import type { AllergenCategoryId } from "@/types/allergens";

const BADGE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

/** Friendly allergen presentation. Original codes are only inside a collapsed "inspect" block. */
export function DishCard({ dish, avoid, showMensa = false }: { dish: EvaluatedDish; avoid: AllergenCategoryId[]; showMensa?: boolean }) {
  const { status, conflicts, warnings } = dish.evaluation;
  const possibleOnly = status === "contains" && conflicts.length === 0;
  const border = conflicts.length ? "border-red-200" : possibleOnly || status === "unknown" ? "border-amber-400" : "border-emerald-200";
  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${border} ${status === "contains" ? "opacity-85" : ""}`}>
      <DishImage image={dish.image} alt={dish.name} className="h-32 w-full" />
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h4 className="text-base font-semibold leading-snug text-stone-900">{dish.name}</h4>
        <p className="text-xs text-stone-600">{showMensa ? `${dish.locationName} · ` : ""}{dish.mealGroup}</p>

        <div className="flex flex-wrap gap-1.5">
          {status === "match" && avoid.length > 0 && <span className={`${BADGE} bg-emerald-100 text-emerald-900`}>Matches your preferences</span>}
          {conflicts.length > 0 && <span className={`${BADGE} bg-red-100 text-red-900`}>Contains {conflicts.map((c) => CATEGORY_BY_ID[c].label).join(", ")}</span>}
          {status === "unknown" && <span className={`${BADGE} bg-amber-100 text-amber-900`}>Allergen info missing</span>}
          {warnings.length > 0 && <ContaminationBadge hints={warnings} />}
          {dish.allergenFree && <span className={`${BADGE} bg-sky-100 text-sky-900`}>Allergen-free</span>}
        </div>

        {warnings.length > 0 && (
          <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-950">
            Not listed as an ingredient, but this dish may come into contact with {warnings.map((w) => CATEGORY_BY_ID[w.category].label).join(", ")}.
            {" "}{[...new Set(warnings.map((w) => w.reason).filter(Boolean))].join(" ")} It is treated like a dish containing {warnings.length > 1 ? "them" : "it"}.
          </p>
        )}

        {status === "unknown" ? (
          <p className="text-xs text-stone-700">No allergen information is available for this dish. Please ask the canteen.</p>
        ) : dish.categories.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Allergens listed for this dish">
            {dish.categories.map((c) => {
              const hit = conflicts.includes(c);
              return (
                <li key={c} className={`${BADGE} border ${hit ? "border-red-300 bg-red-50 font-semibold text-red-900" : "border-stone-200 bg-stone-50 text-stone-800"}`}>
                  {CATEGORY_BY_ID[c].label}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-stone-700">None of the 8 tracked allergen groups are listed.</p>
        )}

        <details className="mt-auto pt-1 text-xs text-stone-600">
          <summary className="cursor-pointer select-none underline-offset-2 hover:underline">Original allergen information</summary>
          <p className="mt-1 font-mono">{dish.allergensKnown ? (dish.codes.join(", ") || "none listed") : "not provided"}</p>
        </details>
      </div>
    </article>
  );
}
