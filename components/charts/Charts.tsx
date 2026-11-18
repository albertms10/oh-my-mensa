"use client";

import { Card, EmptyState } from "@/components/ui/Card";
import {
  aggregateByDay, aggregateByLocation, aggregateByMealGroup, aggregateWithoutByDay, countByCategory, countWithoutBy,
  percentOf,
  sharePercent,
  shareWithAny,
} from "@/lib/aggregations";
import { ALLERGEN_CATEGORIES, exclusionLabel } from "@/lib/allergens";
import { formatDate, formatDateLong } from "@/lib/formatters";
import type { AllergenCategory, AllergenCategoryId } from "@/types/allergens";
import type { FlatDish } from "@/types/menu";
import { useState, type ReactNode } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface Props { dishes: FlatDish[]; categories: AllergenCategory[] }

const GRID = "#e4e4e7";
const AXIS = { fontSize: 12, fill: "#52525b" };

function Chart({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div role="img" aria-label={label} className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height={300}>{children as never}</ResponsiveContainer>
    </div>
  );
}

type Row = Record<string, unknown>;
type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: ReadonlyArray<{ name?: string | number; value?: number | string; color?: string; payload?: Row }>;
  title?: (label: string) => string;
  footer?: (row: Row) => string;
  unit?: string;
};

function Tip({ active, payload, label, title, footer, unit = "dishes" }: TipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload ?? {};
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-zinc-900">{title ? title(String(label)) : String(label)}</p>
      {payload.map((p) => (
        <p key={String(p.name)} className="flex items-center gap-2 text-zinc-800">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name}: <b>{p.value}</b> {unit}
        </p>
      ))}
      {footer && <p className="mt-1 border-t border-zinc-100 pt-1 text-zinc-600">{footer(row)}</p>}
    </div>
  );
}

function SeriesToggle({ categories, hidden, onToggle }: { categories: AllergenCategory[]; hidden: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Show or hide allergen series">
      {categories.map((c) => {
        const off = hidden.includes(c.id);
        return (
          <button key={c.id} type="button" aria-pressed={!off} onClick={() => onToggle(c.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${off ? "border-zinc-200 text-zinc-500 line-through" : "border-zinc-300 text-zinc-900"}`}>
            <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: off ? "#d4d4d8" : c.color }} />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

const yLabel = (value: string) => ({
  value, angle: -90, position: "insideLeft" as const,
  style: { fontSize: 12, fill: "#52525b", textAnchor: "middle" as const },
});

function MetricToggle<T extends string>({ label, options, value, onChange }: {
  label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-300 p-0.5 text-xs" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}
          className={`rounded-md px-2.5 py-1 font-medium ${value === o.value ? "bg-zinc-900 text-white" : "text-zinc-800"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

type Metric = "counts" | "share";
const METRICS: readonly { value: Metric; label: string }[] = [
  { value: "counts", label: "Dishes" },
  { value: "share", label: "% of dishes" },
];
const pctAxis = { domain: [0, 100] as [number, number], unit: "%" };

export function AllergensOverTime({ dishes, categories }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [metric, setMetric] = useState<Metric>("counts");
  const rows = aggregateByDay(dishes).map((d) => ({
    date: d.key, total: d.total, ...(metric === "share" ? sharePercent(d.counts, d.total) : d.counts),
  }));
  return (
    <Card title="Allergens over time"
      subtitle={metric === "counts" ? "Dishes containing each allergen category per day" : "Share of that day's dishes containing each category"}
      action={<MetricToggle label="Metric" options={METRICS} value={metric} onChange={setMetric} />}>
      {rows.length === 0 ? <EmptyState /> : (
        <>
          <SeriesToggle categories={categories} hidden={hidden}
            onToggle={(id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))} />
          <Chart label={`Line chart: ${metric === "share" ? "share of dishes" : "dishes"} per allergen category over time`}>
            <LineChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS} />
              {metric === "counts"
                ? <YAxis allowDecimals={false} tick={AXIS} label={yLabel("Dishes")} />
                : <YAxis {...pctAxis} tick={AXIS} label={yLabel("Share of dishes (%)")} />}
              <Tooltip content={<Tip title={formatDateLong} unit={metric === "counts" ? "dishes" : "%"} footer={(r) => `${r.total} dishes that day`} />} />
              {categories.filter((c) => !hidden.includes(c.id)).map((c) => (
                <Line key={c.id} type="monotone" dataKey={c.id} name={c.label} stroke={c.color} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </Chart>
        </>
      )}
    </Card>
  );
}

type DistRow = { label: string; count: number; rest: number; pct: number; total: number };
function DistTip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: DistRow }> }) {
  const r = active ? payload?.[0]?.payload : undefined;
  if (!r) return null;
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-2 text-xs shadow-md">
      <p className="font-semibold text-zinc-900">{r.label}</p>
      <p className="text-zinc-800"><b>{r.count}</b> of {r.total} dishes ({r.pct}%)</p>
    </div>
  );
}

export function AllergenDistribution({ dishes, categories }: Props) {
  const total = dishes.length;
  const counts = countByCategory(dishes);
  const filtered = categories.length < ALLERGEN_CATEGORIES.length;
  const any = shareWithAny(dishes, categories.map((c) => c.id));
  const rows = categories
    .map((c) => ({
      id: c.id, label: c.label, color: c.color, count: counts[c.id], rest: total - counts[c.id],
      pct: percentOf(counts[c.id], total), total,
    }))
    .sort((a, b) => b.count - a.count)
    .map((r) => ({ ...r, pctLabel: `${r.pct}%` }));
  return (
    <Card title="Allergen distribution" subtitle="Share of all dishes containing each category, incl. possible cross-contamination (a dish can appear in several)">
      {total === 0 ? <EmptyState /> : (
        <>
          <div className="mb-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm text-zinc-800">
              <span>Dishes with {filtered ? "any selected allergen" : "at least one allergen"}</span>
              <span><b>{any.count}</b> of {any.total} dishes · <b>{any.percent}%</b></span>
            </div>
            <div role="progressbar" aria-label="Share of dishes with allergens" aria-valuemin={0} aria-valuemax={100} aria-valuenow={any.percent}
              className="mt-1 h-3 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full rounded-full bg-zinc-800" style={{ width: `${any.percent}%` }} />
            </div>
          </div>
          <Chart label="Horizontal bar chart: share of all dishes containing each allergen category">
            <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 48 }}>
              <CartesianGrid stroke={GRID} horizontal={false} />
              <XAxis type="number" domain={[0, total]} allowDecimals={false} tick={AXIS}
                label={{ value: `Dishes (bar = all ${total} dishes)`, position: "insideBottom", offset: -2, style: { fontSize: 12, fill: "#52525b" } }} />
              <YAxis type="category" dataKey="label" width={70} tick={AXIS} />
              <Tooltip content={<DistTip />} />
              <Bar dataKey="count" stackId="s" name="Dishes with allergen">
                {rows.map((r) => <Cell key={r.id} fill={r.color} />)}
              </Bar>
              <Bar dataKey="rest" stackId="s" name="Other dishes" fill="#e4e4e7" radius={[0, 4, 4, 0]}>
                <LabelList dataKey="pctLabel" position="right" style={{ fontSize: 12, fill: "#3f3f46" }} />
              </Bar>
            </BarChart>
          </Chart>
        </>
      )}
    </Card>
  );
}

export function AllergensByMealGroup({ dishes, categories }: Props) {
  const [metric, setMetric] = useState<Metric>("counts");
  const rows = aggregateByMealGroup(dishes).map((g) => ({
    group: g.label, total: g.total, ...(metric === "share" ? sharePercent(g.counts, g.total) : g.counts),
  }));
  return (
    <Card title="Allergens by meal group"
      subtitle={metric === "counts" ? "Dishes containing each category, per meal group" : "Share of each meal group's dishes containing each category"}
      action={<MetricToggle label="Metric" options={METRICS} value={metric} onChange={setMetric} />}>
      {rows.length === 0 ? <EmptyState /> : (
        <Chart label={`Grouped bar chart: ${metric === "share" ? "share of dishes" : "dishes"} per allergen category by meal group`}>
          <BarChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="group" tick={AXIS} />
            {metric === "counts"
              ? <YAxis allowDecimals={false} tick={AXIS} label={yLabel("Dishes")} />
              : <YAxis {...pctAxis} tick={AXIS} label={yLabel("Share of dishes (%)")} />}
            <Tooltip content={<Tip unit={metric === "counts" ? "dishes" : "%"} footer={(r) => `${r.total} dishes in this meal group (categories overlap)`} />} />
            {categories.map((c) => <Bar key={c.id} dataKey={c.id} name={c.label} fill={c.color} radius={[3, 3, 0, 0]} />)}
          </BarChart>
        </Chart>
      )}
    </Card>
  );
}

export function AllergenFreeOverTime({ dishes, excluded }: { dishes: FlatDish[]; excluded: AllergenCategoryId[] }) {
  const { title, short, scope } = exclusionLabel(excluded);
  const rows = aggregateWithoutByDay(dishes, excluded).map((d) => ({ date: d.key, free: d.free, total: d.total }));
  return (
    <Card title={`${title} over time`} subtitle={`Daily dishes with ${scope}, shown against all dishes of that day`}>
      {rows.length === 0 ? <EmptyState /> : (
        <Chart label={`Area chart: ${short} dishes per day compared with all dishes`}>
          <AreaChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS} />
            <YAxis allowDecimals={false} tick={AXIS} label={yLabel("Dishes")} />
            <Tooltip content={<Tip title={formatDateLong} footer={(r) => `${percentOf(Number(r.free), Number(r.total))}% of all dishes that day`} />} />
            <Area type="monotone" dataKey="total" name="All dishes" stroke="#a1a1aa" fill="#a1a1aa" fillOpacity={0.2} strokeWidth={1.5} />
            <Area type="monotone" dataKey="free" name={short} stroke="#15803d" fill="#15803d" fillOpacity={0.45} strokeWidth={2} />
          </AreaChart>
        </Chart>
      )}
    </Card>
  );
}

type LocMetric = "counts" | "share" | "free";

export function LocationComparison({ dishes, categories, excluded }: Props & { excluded: AllergenCategoryId[] }) {
  const { short } = exclusionLabel(excluded);
  const [metric, setMetric] = useState<LocMetric>("counts");
  const freeBy = countWithoutBy(dishes, excluded, (d) => d.locationId);
  const rows = aggregateByLocation(dishes).map((l) => ({
    location: l.label, total: l.total,
    ...(metric === "share" ? sharePercent(l.counts, l.total) : l.counts),
    percentFree: percentOf(freeBy.get(l.key) ?? 0, l.total),
  }));
  const options: readonly { value: LocMetric; label: string }[] = [
    { value: "counts", label: "Dishes" }, { value: "share", label: "% of dishes" }, { value: "free", label: `% ${short}` },
  ];
  const subtitle = {
    counts: "Metric: number of dishes containing each category",
    share: "Metric: share of each location's dishes containing each category",
    free: `Metric: share of dishes that are ${short.toLowerCase()} (source codes only)`,
  }[metric];
  return (
    <Card title="Location comparison" subtitle={subtitle}
      action={<MetricToggle label="Metric" options={options} value={metric} onChange={setMetric} />}>
      {rows.length === 0 ? <EmptyState /> : (
        <Chart label={`Bar chart comparing locations by ${subtitle.replace("Metric: ", "")}`}>
          <BarChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="location" tick={AXIS} />
            {metric === "counts"
              ? <YAxis allowDecimals={false} tick={AXIS} label={yLabel("Dishes")} />
              : <YAxis {...pctAxis} tick={AXIS} label={yLabel(metric === "share" ? "Share of dishes (%)" : `${short} dishes (%)`)} />}
            <Tooltip content={<Tip unit={metric === "counts" ? "dishes" : "%"} footer={(r) => `${r.total} dishes at this location`} />} />
            {metric === "free"
              ? <Bar dataKey="percentFree" name={short} fill="#15803d" radius={[4, 4, 0, 0]} />
              : categories.map((c) => <Bar key={c.id} dataKey={c.id} name={c.label} fill={c.color} radius={[3, 3, 0, 0]} />)}
          </BarChart>
        </Chart>
      )}
    </Card>
  );
}
