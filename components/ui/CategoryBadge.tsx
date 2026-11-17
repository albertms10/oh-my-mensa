import { CATEGORY_BY_ID } from "@/lib/allergens";
import type { AllergenCategoryId } from "@/types/allergens";

export function CategoryBadge({ id }: { id: AllergenCategoryId }) {
  const c = CATEGORY_BY_ID[id];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-800">
      <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
      {c.label}
    </span>
  );
}
