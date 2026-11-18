import { CATEGORY_BY_ID } from "@/lib/allergens";
import type { ContaminationHint } from "@/types/allergens";
import { TriangleAlert } from "lucide-react";

/** Amber warning for possible (undeclared) cross-contamination. */
export function ContaminationBadge({ hints, compact = false }: { hints: ContaminationHint[]; compact?: boolean }) {
  if (hints.length === 0) return null;
  const names = hints.map((h) => CATEGORY_BY_ID[h.category].label).join(", ");
  const reasons = [...new Set(hints.map((h) => h.reason).filter(Boolean))].join(" ");
  return (
    <span role="note" title={reasons || undefined}
      className="inline-flex items-center gap-1 rounded-full border border-amber-400 bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
      <TriangleAlert className="size-3.5" aria-hidden />
      {compact ? `${names}?` : `Possible cross-contamination: ${names}`}
      <span className="sr-only">. Not listed as an ingredient, but contact is possible.</span>
    </span>
  );
}
