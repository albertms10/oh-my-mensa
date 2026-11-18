"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  PREFERENCES_KEY, parsePreferences, serializePreferences, type Preferences,
} from "./preferences";

export type PreferencesState =
  | { status: "loading" }
  | { status: "ready"; preferences: Preferences | null };

const LOADING: PreferencesState = { status: "loading" };
const listeners = new Set<() => void>();
/** Fallback when localStorage is unavailable or a write failed. undefined = use storage. */
let memory: string | null | undefined;
let cache: { raw: string | null; state: PreferencesState } | null = null;

function readRaw(): string | null {
  if (memory !== undefined) return memory;
  try {
    return window.localStorage.getItem(PREFERENCES_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): PreferencesState {
  const raw = readRaw();
  if (cache && cache.raw === raw) return cache.state; // stable reference between renders
  cache = { raw, state: { status: "ready", preferences: parsePreferences(raw) } };
  return cache.state;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PREFERENCES_KEY || e.key === null) {
      memory = undefined;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function write(value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(PREFERENCES_KEY);
    else window.localStorage.setItem(PREFERENCES_KEY, value);
    memory = undefined;
  } catch {
    memory = value;
  }
  listeners.forEach((l) => l());
}

/**
 * Preferences from localStorage. `status: "loading"` on the server and during hydration, so
 * returning users never see the questionnaire flash and there is no hydration mismatch.
 */
export function usePreferences() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => LOADING);
  const save = useCallback((p: Preferences) => write(serializePreferences(p)), []);
  const reset = useCallback(() => write(null), []);
  return { state, save, reset };
}
