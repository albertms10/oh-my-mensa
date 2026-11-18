import { generateMockEntries, MOCK_LOCATIONS } from "@/data/mock-data";
import { addDays, mondayOf, todayISO } from "@/lib/dates";
import type { DataSource, Location, MenuEntry, MenuResponse } from "@/types/menu";
import { getConfig } from "./config";
import { ProviderError } from "./errors";
import { loadMaxManagerData } from "./maxmanager";
import { locationsSchema, menuEntriesSchema } from "./schema";

interface LoadOptions { date?: string }
interface MenuProvider {
  name: DataSource;
  load(opts: LoadOptions): Promise<{ locations: Location[]; entries: MenuEntry[] }>;
}

const mockProvider: MenuProvider = {
  name: "mock",
  // Mock data is anchored to the current week so "today" has a menu on weekdays.
  load: async ({ date }) => ({
    locations: [...MOCK_LOCATIONS],
    entries: generateMockEntries(addDays(mondayOf(todayISO()), -7)).filter((e) => !date || e.date === date),
  }),
};
const maxManagerProvider: MenuProvider = { name: "maxmanager", load: loadMaxManagerData };

const cache = new Map<string, { at: number; value: MenuResponse }>();
const inflight = new Map<string, Promise<MenuResponse>>();

async function fetchFresh(provider: MenuProvider, key: string, opts: LoadOptions, ttlMs: number): Promise<MenuResponse> {
  const raw = await provider.load(opts);
  const entries = menuEntriesSchema.safeParse(raw.entries);
  const locations = locationsSchema.safeParse(raw.locations);
  if (!entries.success || !locations.success)
    throw new ProviderError("The data source returned data in an unexpected format.", {
      cause: entries.success ? locations.error : entries.error,
    });
  const value: MenuResponse = {
    source: provider.name,
    fetchedAt: new Date().toISOString(),
    locations: locations.data,
    entries: entries.data,
  };
  const now = Date.now();
  for (const [k, v] of cache) if (now - v.at >= ttlMs) cache.delete(k); // prune expired
  cache.set(key, { at: now, value });
  return value;
}

/**
 * Cached per provider and date (TTL from CACHE_TTL_SECONDS). `date` limits the upstream
 * requests to one day. Never falls back to mock data when the real provider fails.
 */
export async function getMenuData(opts: { refresh?: boolean; date?: string } = {}): Promise<MenuResponse> {
  const cfg = getConfig();
  const provider = cfg.provider === "maxmanager" ? maxManagerProvider : mockProvider;
  const key = `${provider.name}:${opts.date ?? "all"}`;
  const hit = cache.get(key);
  if (!opts.refresh && hit && Date.now() - hit.at < cfg.cacheTtlMs) return hit.value;
  let pending = inflight.get(key);
  if (!pending) {
    pending = fetchFresh(provider, key, { date: opts.date }, cfg.cacheTtlMs).finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}
