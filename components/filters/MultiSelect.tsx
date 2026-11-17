"use client";

import { ChevronDown } from "lucide-react";

export interface Option { value: string; label: string; color?: string }

export function MultiSelect({
  label, options, selected, onChange, allLabel,
}: {
  label: string; options: Option[]; selected: string[]; onChange: (v: string[]) => void; allLabel: string;
}) {
  const summary =
    selected.length === 0 ? allLabel
    : selected.length === 1 ? (options.find((o) => o.value === selected[0])?.label ?? "1 selected")
    : `${selected.length} selected`;
  return (
    <details className="group relative">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 hover:border-zinc-400">
        <span className="flex flex-col leading-tight">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">{label}</span>
          <span>{summary}</span>
        </span>
        <ChevronDown className="size-4 text-zinc-600 transition group-open:rotate-180" aria-hidden />
      </summary>
      <div className="absolute z-20 mt-1 max-h-64 w-full min-w-48 overflow-auto rounded-lg border border-zinc-200 bg-white p-1 shadow-lg">
        {options.length === 0 && <p className="p-2 text-sm text-zinc-600">No options</p>}
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-zinc-100">
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={(e) =>
                onChange(e.target.checked ? [...selected, o.value] : selected.filter((v) => v !== o.value))
              }
            />
            {o.color && <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: o.color }} />}
            {o.label}
          </label>
        ))}
      </div>
    </details>
  );
}
