"use client";

import { SiteNav } from "@/components/ui/SiteNav";
import { CATEGORY_BY_ID } from "@/lib/allergens";
import { loadMenu } from "@/lib/client/api";
import { flattenEntries } from "@/lib/filters";
import { formatDateLong } from "@/lib/formatters";
import { buildTodayOverview } from "@/lib/suitability";
import { usePreferences } from "@/lib/use-preferences";
import { useToday } from "@/lib/use-today";
import type { MenuResponse } from "@/types/menu";
import { AlertTriangle, ExternalLink, Pencil, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Questionnaire } from "./Questionnaire";
import { MensaBlock, OverviewSkeleton } from "./Sections";

interface DataState { data: MenuResponse | null; error: string | null; loading: boolean }

export function OverviewApp() {
  const { state: prefState, save, reset } = usePreferences();
  // Evaluated in the canteens' timezone (Europe/Berlin), not the server's. null until hydrated.
  const today = useToday();
  const [menu, setMenu] = useState<DataState>({ data: null, error: null, loading: true });
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!today) return;
    let cancelled = false;
    void loadMenu({ date: today }).then((r) => {
      if (!cancelled) setMenu({ data: r.data ?? null, error: r.error ?? null, loading: false });
    });
    return () => { cancelled = true; };
  }, [today]);

  const retry = () => {
    if (!today) return;
    setMenu((m) => ({ ...m, loading: true, error: null }));
    void loadMenu({ date: today, refresh: true }).then((r) =>
      setMenu((m) => ({ data: r.data ?? m.data, error: r.error ?? null, loading: false })),
    );
  };

  const prefs = prefState.status === "ready" ? prefState.preferences : null;
  const dishes = useMemo(() => flattenEntries(menu.data?.entries ?? []), [menu.data]);
  const overview = useMemo(
    () => buildTodayOverview({
      dishes, locations: menu.data?.locations ?? [], date: today ?? "",
      selectedLocationIds: prefs?.locationIds ?? [], avoid: prefs?.allergens ?? [],
    }),
    [dishes, menu.data, today, prefs],
  );

  // Never flash the questionnaire for returning users: wait for localStorage first.
  if (prefState.status === "loading" || today === null) return <OverviewSkeleton />;

  if (!prefs || editing || confirming) {
    const locations = menu.data?.locations ?? overview.locations;
    return (
      <Questionnaire
        key={editing ? "edit" : "first"}
        initial={prefs ?? undefined}
        locations={locations}
        locationsLoading={menu.loading}
        onSave={(p) => { save(p); setConfirming(true); }}
        onDone={() => { setConfirming(false); setEditing(false); }}
        onCancel={prefs && !confirming ? () => setEditing(false) : undefined}
      />
    );
  }

  const avoidNames = prefs.allergens.map((a) => CATEGORY_BY_ID[a].label);
  const { counts } = overview;
  const btn = "inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-50";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-6">
        <header className="rounded-3xl border border-amber-100 bg-amber-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-amber-900">{formatDateLong(today)}</p>
              <h1 className="mt-1 text-2xl font-semibold">Your menu overview</h1>
              <p className="mt-1 text-sm text-stone-700">Today&rsquo;s food at your mensas, matched to what you want to avoid.</p>
            </div>
            <SiteNav />
          </div>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-600">Your allergens</dt>
              <dd className="mt-0.5">{avoidNames.length ? avoidNames.join(", ") : "None excluded"}</dd>
            </div>
            <div className="rounded-2xl bg-white/70 p-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-600">Available at your selected mensas</dt>
              <dd className="mt-0.5">
                {overview.showingAll ? "All mensas" : overview.locations.map((l) => l.name).join(", ")}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => setEditing(true)}><Pencil className="size-4" aria-hidden />Edit preferences</button>
            <button type="button" className={btn} onClick={reset}><RotateCcw className="size-4" aria-hidden />Reset</button>
          </div>
        </header>

        {menu.error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <span className="flex items-center gap-2"><AlertTriangle className="size-4" aria-hidden />We couldn&rsquo;t load today&rsquo;s menu. {menu.error}</span>
            <button type="button" onClick={retry} className="rounded-full border border-red-300 bg-white px-3 py-1 font-medium">Try again</button>
          </div>
        )}

        {menu.loading && !menu.data ? (
          <OverviewSkeleton withHeader={false} />
        ) : menu.data && (
          <>
            <section aria-labelledby="suitable-title" className="space-y-4">
              <div>
                <h2 id="suitable-title" className="text-xl font-semibold">Suitable dishes</h2>
                {counts.total > 0 && (
                  <p className="text-sm text-stone-700">
                    {counts.suitable} of {counts.total} dishes today {prefs.allergens.length ? "don\u2019t list any of your allergens" : "have allergen information"}.
                  </p>
                )}
                {prefs.allergens.length === 0 && counts.total > 0 && (
                  <p className="mt-1 text-sm text-stone-600">You haven&rsquo;t excluded any allergens, so every dish with allergen information is included.</p>
                )}
                {counts.warned > 0 && (
                  <p className="mt-1 text-sm text-amber-950">⚠ {counts.warned} dish{counts.warned > 1 ? "es are" : " is"} not listed here because of possible cross-contamination (e.g. shared fryer oil). {counts.warned > 1 ? "They are" : "It is"} shown in the full menu below.</p>
                )}
                {counts.unknown > 0 && (
                  <p className="mt-1 text-sm text-amber-900">{counts.unknown} dish{counts.unknown > 1 ? "es have" : " has"} no allergen information and {counts.unknown > 1 ? "are" : "is"} not listed here.</p>
                )}
              </div>

              {counts.total === 0 ? (
                <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-700">
                  No menus are available for today. Menus are usually published on weekdays. You can check the{" "}
                  <a className="underline" href="https://www.studierendenwerk-stuttgart.de/essen/speiseplan" target="_blank" rel="noopener noreferrer">original menu</a>{" "}
                  or another mensa.
                </p>
              ) : overview.suitable.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-700">
                  No dishes match your current allergen preferences today. You can change your preferences or check another mensa.
                </p>
              ) : (
                <div className="space-y-6">
                  {overview.suitable.map((s) => (
                    <MensaBlock key={s.locationId} section={s} avoid={prefs.allergens} emptyText="" />
                  ))}
                </div>
              )}
            </section>

            <section aria-labelledby="menu-title" className="space-y-4">
              <h2 id="menu-title" className="text-xl font-semibold">Today&rsquo;s menu by mensa</h2>
              <p className="text-sm text-stone-600">The full menu, including dishes with your allergens or missing allergen information.</p>
              <div className="space-y-4">
                {overview.menus.map((s) => (
                  <details key={s.locationId} open className="rounded-3xl border border-stone-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-medium text-stone-700">{s.locationName} · {s.dishCount} dishes</summary>
                    <div className="mt-3">
                      <MensaBlock section={s} avoid={prefs.allergens} emptyText={`No menu published for ${s.locationName} today.`} />
                    </div>
                  </details>
                ))}
              </div>
            </section>
          </>
        )}

        <footer className="space-y-2 border-t border-stone-200 pt-4 text-xs text-stone-600">
          <p>
            Allergen information comes from the canteen&rsquo;s data and may be incomplete or change. It is not a safety guarantee.
            If you have a serious allergy, please ask the canteen staff.
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a className="underline" href="/details">Details and statistics</a>
            <a className="inline-flex items-center gap-1 underline" href="https://www.studierendenwerk-stuttgart.de/essen/speiseplan" target="_blank" rel="noopener noreferrer">
              Original menu <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
