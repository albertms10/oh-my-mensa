"use client";

import { useSyncExternalStore } from "react";
import { todayISO } from "./dates";

function subscribe(cb: () => void): () => void {
  const id = setInterval(cb, 60_000); // picks up the date change at midnight
  return () => clearInterval(id);
}

/** Today in the canteens' timezone. `null` on the server/during hydration (no clock read at prerender). */
export function useToday(): string | null {
  return useSyncExternalStore(subscribe, () => todayISO(), () => null);
}
