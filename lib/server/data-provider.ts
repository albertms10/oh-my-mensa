import { generateMockEntries } from "@/data/mock-data";
import type { DataSource, MenuEntry, MenuResponse } from "@/types/menu";
import { getConfig } from "./config";
import { ProviderError } from "./errors";
import { loadMaxManagerEntries } from "./maxmanager";
import { menuEntriesSchema } from "./schema";

interface MenuProvider {
  name: DataSource;
  load(): Promise<MenuEntry[]>;
}

const mockProvider: MenuProvider = { name: "mock", load: async () => generateMockEntries() };
const maxManagerProvider: MenuProvider = { name: "maxmanager", load: loadMaxManagerEntries };

let cache: { at: number; value: MenuResponse } | null = null;
let inflight: Promise<MenuResponse> | null = null;

async function fetchFresh(provider: MenuProvider): Promise<MenuResponse> {
  const raw = await provider.load();
  const parsed = menuEntriesSchema.safeParse(raw);
  if (!parsed.success)
    throw new ProviderError("The data source returned data in an unexpected format.", {
      cause: parsed.error,
    });
  const value: MenuResponse = {
    source: provider.name,
    fetchedAt: new Date().toISOString(),
    entries: parsed.data,
  };
  cache = { at: Date.now(), value };
  return value;
}

/** Cached (TTL from CACHE_TTL_SECONDS). Never falls back to mock when the real provider fails. */
export async function getMenuData(opts: { refresh?: boolean } = {}): Promise<MenuResponse> {
  const cfg = getConfig();
  const provider = cfg.provider === "maxmanager" ? maxManagerProvider : mockProvider;
  if (
    !opts.refresh &&
    cache &&
    cache.value.source === provider.name &&
    Date.now() - cache.at < cfg.cacheTtlMs
  )
    return cache.value;
  inflight ??= fetchFresh(provider).finally(() => {
    inflight = null;
  });
  return inflight;
}
