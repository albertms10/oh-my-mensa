import { addDays, mondayOf, todayISO } from "@/lib/dates";
import type { Location, MenuEntry } from "@/types/menu";
import * as cheerio from "cheerio";
import { getConfig } from "./config";
import { ProviderError } from "./errors";
import { normalizeImagePath } from "./images";

/**
 * MaxManager provider. Endpoint and form fields are taken from the known browser
 * request (POST inc/ajax-php_konnektor.inc.php, func=make_spl) and parse the returned
 * HTML fragment. Everything runs server-side, so browser CORS never applies.
 */

function weekdays(weeks: number): string[] {
  const monday = mondayOf(todayISO());
  return Array.from({ length: weeks * 5 }, (_, i) => addDays(monday, Math.floor(i / 5) * 7 + (i % 5)));
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

/** `date` set = only that day (used by the overview); otherwise the configured weeks. */
export async function loadMaxManagerData(
  opts: { date?: string } = {},
): Promise<{ locations: Location[]; entries: MenuEntry[] }> {
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

  let locations: Location[];
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
  const dates = opts.date ? [opts.date] : weekdays(weeks);
  const thisWeek = mondayOf(dates[0]);
  const nextWeek = addDays(thisWeek, 7);
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
      // Absent `lang` attribute = allergen info missing (unknown). Empty attribute = none listed.
      const lang = $(el).attr("lang");
      const allergens = (lang ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      const image = normalizeImagePath($(el).find(".contains-foto img.smallFoto").first().attr("src"), baseUrl);
      const list = groups.get(group) ?? [];
      list.push({
        id: `${loc.id}-${date}-${i}`, name, allergens,
        ...(lang === undefined ? { allergensKnown: false } : {}),
        ...(image ? { image } : {}),
      });
      groups.set(group, list);
    });
    return [...groups].map(
      ([mealGroup, dishes]): MenuEntry => ({
        locationId: loc.id, locationName: loc.name, date, mealGroup, dishes,
      }),
    );
  });

  return { locations, entries: results.flat() };
}
