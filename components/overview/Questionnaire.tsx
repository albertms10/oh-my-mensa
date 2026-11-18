"use client";

import { ALLERGEN_CATEGORIES } from "@/lib/allergens";
import type { Preferences } from "@/lib/preferences";
import {
  initQuestionnaire, questionnaireReducer, toPreferences,
} from "@/lib/questionnaire";
import type { Location } from "@/types/menu";
import { ArrowLeft, Check } from "lucide-react";
import { useReducer } from "react";

const primary = "rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800";
const secondary = "rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50";

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick}
      className={`flex min-h-12 items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
        selected ? "border-emerald-600 bg-emerald-50 text-emerald-950" : "border-stone-200 bg-white text-stone-800 hover:border-stone-300"}`}>
      <span className="flex items-center gap-2">{children}</span>
      <span aria-hidden className={`flex size-5 items-center justify-center rounded-full ${selected ? "bg-emerald-600 text-white" : "border border-stone-300"}`}>
        {selected && <Check className="size-3" />}
      </span>
    </button>
  );
}

export function Questionnaire({
  initial, locations, locationsLoading, onSave, onDone, onCancel,
}: {
  initial?: Pick<Preferences, "allergens" | "locationIds">;
  locations: Location[];
  locationsLoading: boolean;
  /** Called once when the user finishes step 2; saves immediately. */
  onSave: (p: Preferences) => void;
  /** Called from the confirmation screen. */
  onDone: () => void;
  /** Only when editing existing preferences. */
  onCancel?: () => void;
}) {
  const [s, dispatch] = useReducer(questionnaireReducer, initial, initQuestionnaire);
  const sorted = [...locations].sort((a, b) => a.name.localeCompare(b.name));
  const allSelected = sorted.length > 0 && sorted.every((l) => s.locationIds.includes(l.id));

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col px-4 py-6">
      {s.step < 2 && (
        <div className="mb-6" aria-label={`Step ${s.step + 1} of 2`}>
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-stone-600">
            <span>Step {s.step + 1} of 2</span>
            {onCancel && <button type="button" onClick={onCancel} className="underline">Cancel</button>}
          </div>
          <div className="h-1.5 rounded-full bg-stone-200" role="progressbar" aria-valuemin={1} aria-valuemax={2} aria-valuenow={s.step + 1}>
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${(s.step + 1) * 50}%` }} />
          </div>
        </div>
      )}

      {s.step === 0 && (
        <section className="flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold text-stone-900">Are there any allergens you&rsquo;d like to avoid?</h1>
          <p className="mt-2 text-sm text-stone-600">
            Pick the ones to <b>exclude</b> from your results. We&rsquo;ll only show dishes without them. You can skip this.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {ALLERGEN_CATEGORIES.map((c) => (
              <Choice key={c.id} selected={s.allergens.includes(c.id)} onClick={() => dispatch({ type: "toggleAllergen", id: c.id })}>
                <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />{c.label}
              </Choice>
            ))}
          </div>
          <div className="mt-auto flex justify-end pt-8">
            <button type="button" className={primary} onClick={() => dispatch({ type: "next" })}>
              {s.allergens.length ? "Continue" : "Continue without allergens"}
            </button>
          </div>
        </section>
      )}

      {s.step === 1 && (
        <section className="flex flex-1 flex-col">
          <h1 className="text-2xl font-semibold text-stone-900">Which mensas do you usually visit?</h1>
          <p className="mt-2 text-sm text-stone-600">Select one or more. If you pick none, we&rsquo;ll show every mensa.</p>
          {locationsLoading && locations.length === 0 ? (
            <div className="mt-5 space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-stone-200" />)}
            </div>
          ) : sorted.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-700">
              The list of mensas isn&rsquo;t available right now. You can continue; we&rsquo;ll show all mensas.
            </p>
          ) : (
            <>
              <button type="button" className="mt-4 self-start text-sm font-medium text-emerald-800 underline"
                onClick={() => dispatch(allSelected ? { type: "clearLocations" } : { type: "selectAllLocations", ids: sorted.map((l) => l.id) })}>
                {allSelected ? "Clear selection" : "Select all mensas"}
              </button>
              <div className="mt-3 grid gap-3">
                {sorted.map((l) => (
                  <Choice key={l.id} selected={s.locationIds.includes(l.id)} onClick={() => dispatch({ type: "toggleLocation", id: l.id })}>
                    {l.name}
                  </Choice>
                ))}
              </div>
            </>
          )}
          <div className="mt-auto flex items-center justify-between pt-8">
            <button type="button" className={`${secondary} inline-flex items-center gap-1`} onClick={() => dispatch({ type: "back" })}>
              <ArrowLeft className="size-4" aria-hidden /> Back
            </button>
            <button type="button" className={primary} onClick={() => { onSave(toPreferences(s)); dispatch({ type: "next" }); }}>
              Finish
            </button>
          </div>
        </section>
      )}

      {s.step === 2 && (
        <section className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><Check className="size-7" aria-hidden /></span>
          <h1 className="mt-4 text-2xl font-semibold text-stone-900">You&rsquo;re all set</h1>
          <p className="mt-2 text-sm text-stone-600">
            {s.allergens.length ? `Avoiding ${s.allergens.length} allergen${s.allergens.length > 1 ? "s" : ""}` : "No allergens excluded"}
            {" · "}
            {s.locationIds.length ? `${s.locationIds.length} mensa${s.locationIds.length > 1 ? "s" : ""}` : "all mensas"}.
            Your choices are saved on this device. You can change them anytime.
          </p>
          <button type="button" className={`${primary} mt-6`} onClick={onDone}>Show today&rsquo;s menu</button>
        </section>
      )}
    </div>
  );
}
