"use client";

import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { DishImage } from "@/components/ui/DishImage";
import { formatDateLong } from "@/lib/formatters";
import type { FlatDish } from "@/types/menu";
import { X } from "lucide-react";
import { useEffect } from "react";

export function DishDetails({ dish, onClose }: { dish: FlatDish; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="dish-title" onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <h3 id="dish-title" className="text-lg font-semibold text-zinc-900">{dish.name}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-zinc-600 hover:bg-zinc-100">
            <X className="size-5" />
          </button>
        </div>
        {dish.image && <DishImage image={dish.image} alt={dish.name} className="mt-4 h-48 w-full" />}
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-zinc-600">Location</dt><dd>{dish.locationName}</dd>
          <dt className="text-zinc-600">Date</dt><dd>{formatDateLong(dish.date)}</dd>
          <dt className="text-zinc-600">Meal group</dt><dd>{dish.mealGroup}</dd>
          <dt className="text-zinc-600">Categories</dt>
          <dd className="flex flex-wrap gap-1">
            {dish.categories.length ? dish.categories.map((c) => <CategoryBadge key={c} id={c} />) : "None of the 8 configured categories"}
          </dd>
          <dt className="text-zinc-600">Source codes</dt>
          <dd className="font-mono">{dish.codes.length ? dish.codes.join(", ") : "–"}</dd>
        </dl>
        {dish.allergenFree && (
          <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-700">
            No configured allergen codes in the source data. This is not a guarantee of safety; other allergens or
            incomplete source data are not covered.
          </p>
        )}
      </div>
    </div>
  );
}
