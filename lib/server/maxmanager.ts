import type { MenuEntry } from "@/types/menu";
import * as cheerio from "cheerio";
import { getConfig } from "./config";
import { ProviderError } from "./errors";
import { normalizeImagePath } from "./images";

/**
 * MaxManager provider. Endpoint and form fields are taken from the known browser
 * request (POST inc/ajax-php_konnektor.inc.php, func=make_spl) and parse the returned
 * HTML fragment. Everything runs server-side, so browser CORS never applies.
 */

const iso = (d: Date) => d.toISOString().slice(0, 10);

function weekdays(weeks: number): { dates: string[]; thisWeek: string; nextWeek: string } {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const dates: string[] = [];
  for (let w = 0; w < weeks; w++)
    for (let d = 0; d < 5; d++) {
      const day = new Date(monday);
      day.setUTCDate(day.getUTCDate() + w * 7 + d);
      dates.push(iso(day));
    }
  const next = new Date(monday);
  next.setUTCDate(next.getUTCDate() + 7);
  return { dates, thisWeek: iso(monday), nextWeek: iso(next) };
}

async function pooled<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

export async function loadMaxManagerEntries(): Promise<MenuEntry[]> {
  const cfg = getConfig();
  const { baseUrl, weeks, locationOverride } = cfg.maxmanager;

  const request = async (url: string, init: RequestInit, cookie: string) => {
    try {
      const res = await fetch(url, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(cfg.timeoutMs),
        headers: { ...(init.headers as Record<string, string>), ...(cookie ? { cookie } : {}) },
      });
      if (!res.ok) throw new ProviderError(`MaxManager responded with HTTP ${res.status}.`);
      return res;
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      throw new ProviderError("MaxManager could not be reached (timeout or network error).", { cause: e });
    }
  };

  // 1. Session cookie + location list from the public page.
  const pageRes = await request(`${baseUrl}/index.php?mode=bed`, { method: "GET" }, "");
  const cookie = pageRes.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
  const $page = cheerio.load(await pageRes.text());

  let locations: { id: string; name: string }[];
  if (locationOverride) {
    locations = locationOverride.split(",").map((p) => {
      const [id, ...rest] = p.split(":");
      return { id: id.trim(), name: rest.join(":").trim() || id.trim() };
    });
  } else {
    locations = $page("#listbox-locations option")
      .map((_, o) => ({ id: $page(o).attr("value") ?? "", name: $page(o).text().trim() }))
      .get()
      .filter((l) => l.id);
  }
  if (locations.length === 0)
    throw new ProviderError("No MaxManager locations found. Set MAXMANAGER_LOCATION_IDS.");

  // 2. One request per location and day.
  const { dates, thisWeek, nextWeek } = weekdays(weeks);
  const jobs = locations.flatMap((loc) => dates.map((date) => ({ loc, date })));

  const results = await pooled(jobs, 6, async ({ loc, date }) => {
    const res = await request(
      `${baseUrl}/inc/ajax-php_konnektor.inc.php`,
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "x-requested-with": "XMLHttpRequest",
          referer: `${baseUrl}/index.php?mode=bed`,
        },
        body: new URLSearchParams({
          func: "make_spl", locId: loc.id, date, lang: "de",
          startThisWeek: thisWeek, startNextWeek: nextWeek,
        }),
      },
      cookie,
    );
    const $ = cheerio.load(await res.text());
    const groups = new Map<string, MenuEntry["dishes"]>();
    let group = "Ohne Gruppe"; // dish before any header (same fallback as allergenen.js)
    $(".row.gruppenkopf, .row.splMeal").each((i, el) => {
      if ($(el).hasClass("gruppenkopf")) {
        group = $(el).find(".gruppenname").text().trim() || group;
        return;
      }
      const name = $(el).find(".col-xs-12.visible-xs-block span").first().text().trim();
      if (!name) return;
      const allergens = ($(el).attr("lang") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const list = groups.get(group) ?? [];
      const image = normalizeImagePath($(el).find(".contains-foto img.smallFoto").first().attr("src"), baseUrl);
      list.push({ id: `${loc.id}-${date}-${i}`, name, allergens, ...(image ? { image } : {}) });
      groups.set(group, list);
    });
    return [...groups].map(
      ([mealGroup, dishes]): MenuEntry => ({
        locationId: loc.id, locationName: loc.name, date, mealGroup, dishes,
      }),
    );
  });

  return results.flat();
}
