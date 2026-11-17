"use client";

import { Card, EmptyState } from "@/components/ui/Card";
import {
  aggregateByDay, aggregateByLocation, aggregateByMealGroup, aggregateWithoutByDay, countByCategory, countWithoutBy,
} from "@/lib/aggregations";
import { exclusionLabel } from "@/lib/allergens";
import { formatDate, formatDateLong } from "@/lib/formatters";
import type { AllergenCategory, AllergenCategoryId } from "@/types/allergens";
import type { FlatDish } from "@/types/menu";
import { useState, type ReactNode } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
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

export function AllergensOverTime({ dishes, categories }: Props) {
  const [hidden, setHidden] = useState<string[]>([]);
  const rows = aggregateByDay(dishes).map((d) => ({ date: d.key, ...d.counts }));
  return (
    <Card title="Allergens over time" subtitle="Dishes containing each allergen category per day">
      {rows.length === 0 ? <EmptyState /> : (
        <>
          <SeriesToggle categories={categories} hidden={hidden}
            onToggle={(id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]))} />
          <Chart label="Line chart: dishes per allergen category over time">
            <LineChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS} />
              <YAxis allowDecimals={false} tick={AXIS} label={yLabel("Dishes")} />
              <Tooltip content={<Tip title={formatDateLong} />} />
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

export function AllergenDistribution({ dishes, categories }: Props) {
  const counts = countByCategory(dishes);
  const rows = categories.map((c) => ({ id: c.id, label: c.label, color: c.color, count: counts[c.id] }))
    .sort((a, b) => b.count - a.count);
  return (
    <Card title="Allergen distribution" subtitle="Dishes per category (a dish can appear in several)">
      {dishes.length === 0 ? <EmptyState /> : (
        <Chart label="Horizontal bar chart: dishes per allergen category">
          <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 24 }}>
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={AXIS}
              label={{ value: "Dishes", position: "insideBottom", offset: -2, style: { fontSize: 12, fill: "#52525b" } }} />
            <YAxis type="category" dataKey="label" width={70} tick={AXIS} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="count" name="Dishes" radius={[0, 4, 4, 0]}>
              {rows.map((r) => <Cell key={r.id} fill={r.color} />)}
            </Bar>
          </BarChart>
        </Chart>
      )}
    </Card>
  );
}

export function AllergensByMealGroup({ dishes, categories }: Props) {
  const rows = aggregateByMealGroup(dishes).map((g) => ({ group: g.label, total: g.total, ...g.counts }));
  return (
    <Card title="Allergens by meal group" subtitle="Dishes containing each category, per meal group">
      {rows.length === 0 ? <EmptyState /> : (
        <Chart label="Grouped bar chart: allergen categories by meal group">
          <BarChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="group" tick={AXIS} />
            <YAxis allowDecimals={false} tick={AXIS} label={yLabel("Dishes")} />
            <Tooltip content={<Tip footer={(r) => `${r.total} dishes in this meal group (categories overlap)`} />} />
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
    <Card title={`${title} over time`} subtitle={`Daily dishes with ${scope}`}>
      {rows.length === 0 ? <EmptyState /> : (
        <Chart label={`Area chart: ${short} dishes per day`}>
          <AreaChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS} />
            <YAxis allowDecimals={false} tick={AXIS} label={yLabel("Dishes")} />
            <Tooltip content={<Tip title={formatDateLong} footer={(r) => `${r.total} dishes in total that day`} />} />
            <Area type="monotone" dataKey="free" name={short} stroke="#15803d" fill="#15803d" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </Chart>
      )}
    </Card>
  );
}

export function LocationComparison({ dishes, categories, excluded }: Props & { excluded: AllergenCategoryId[] }) {
  const { short } = exclusionLabel(excluded);
  const freeBy = countWithoutBy(dishes, excluded, (d) => d.locationId);
  const [metric, setMetric] = useState<"counts" | "percent">("counts");
  const rows = aggregateByLocation(dishes).map((l) => ({
    location: l.label, total: l.total, ...l.counts,
    percentFree: l.total ? Math.round(((freeBy.get(l.key) ?? 0) / l.total) * 1000) / 10 : 0,
  }));
  const toggle = (
    <div className="inline-flex rounded-lg border border-zinc-300 p-0.5 text-xs" role="group" aria-label="Metric">
      {([["counts", "Dishes per allergen"], ["percent", `% ${short}`]] as const).map(([m, l]) => (
        <button key={m} type="button" aria-pressed={metric === m} onClick={() => setMetric(m)}
          className={`rounded-md px-2.5 py-1 font-medium ${metric === m ? "bg-zinc-900 text-white" : "text-zinc-800"}`}>
          {l}
        </button>
      ))}
    </div>
  );
  return (
    <Card title="Location comparison"
      subtitle={metric === "counts" ? "Metric: number of dishes containing each category" : `Metric: share of dishes that are ${short.toLowerCase()} (source codes only)`}
      action={toggle}>
      {rows.length === 0 ? <EmptyState /> : (
        <Chart label={`Bar chart comparing locations by ${metric === "counts" ? "allergen counts" : `${short} percentage`}`}>
          <BarChart data={rows} margin={{ left: 8, right: 16, top: 8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="location" tick={AXIS} />
            {metric === "counts"
              ? <YAxis allowDecimals={false} tick={AXIS} label={yLabel("Dishes")} />
              : <YAxis domain={[0, 100]} unit="%" tick={AXIS} label={yLabel(`${short} dishes (%)`)} />}
            <Tooltip content={<Tip unit={metric === "counts" ? "dishes" : "%"} footer={(r) => `${r.total} dishes at this location`} />} />
            {metric === "counts"
              ? categories.map((c) => <Bar key={c.id} dataKey={c.id} name={c.label} fill={c.color} radius={[3, 3, 0, 0]} />)
              : <Bar dataKey="percentFree" name={short} fill="#15803d" radius={[4, 4, 0, 0]} />}
          </BarChart>
        </Chart>
      )}
    </Card>
  );
}
