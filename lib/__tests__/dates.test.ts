import { addDays, mondayOf, todayISO } from "@/lib/dates";
import { describe, expect, it } from "vitest";

describe("dates", () => {
  it("evaluates today in Europe/Berlin, not UTC", () => {
    // 23:30 UTC on 17 Nov is already 00:30 on 18 Nov in Berlin (CET, UTC+1).
    expect(todayISO(new Date("2026-11-17T23:30:00Z"))).toBe("2026-11-18");
    expect(todayISO(new Date("2026-11-17T12:00:00Z"))).toBe("2026-11-17");
  });
  it("handles daylight saving time", () => {
    // CEST (UTC+2): 22:30 UTC on 30 Jun is 00:30 on 1 Jul.
    expect(todayISO(new Date("2026-06-30T22:30:00Z"))).toBe("2026-07-01");
  });
  it("respects an explicit timezone", () => {
    expect(todayISO(new Date("2026-11-17T23:30:00Z"), "America/New_York")).toBe("2026-11-17");
  });
  it("computes Mondays and offsets", () => {
    expect(mondayOf("2026-11-18")).toBe("2026-11-16");
    expect(mondayOf("2026-11-22")).toBe("2026-11-16"); // Sunday
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
  });
});
