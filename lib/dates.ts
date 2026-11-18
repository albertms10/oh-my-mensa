/** Canteens are in Stuttgart: "today" is always evaluated in this timezone, never the server's. */
export const MENSA_TIMEZONE = "Europe/Berlin";

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** YYYY-MM-DD of `now` in the given timezone. */
export function todayISO(now: Date = new Date(), timeZone: string = MENSA_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the ISO week containing `iso`. */
export function mondayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return addDays(iso, -((d.getUTCDay() + 6) % 7));
}
