import { describe, expect, it } from "vitest";
import { getBerlinDateParts, monthPeriod, nextMonth, previousMonth, shouldAttemptArchive } from "@/lib/archive-calendar";

describe("archive calendar", () => {
  it("handles year changes", () => { expect(previousMonth(new Date("2026-01-01T10:00:00Z"))).toBe("2025-12"); expect(nextMonth("2026-12")).toBe("2027-01"); });
  it("uses Europe/Berlin boundaries", () => { expect(getBerlinDateParts(new Date("2026-06-30T22:30:00Z")).date).toBe("2026-07-01"); expect(previousMonth(new Date("2026-06-30T22:30:00Z"))).toBe("2026-06"); });
  it("returns exact month periods", () => { expect(monthPeriod("2028-02")).toEqual({ periodStart: "2028-02-01", periodEnd: "2028-02-29" }); });
  it("allows only first attempt and one retry", () => {
    expect(shouldAttemptArchive(new Date("2026-08-01T08:00:00Z"))).toBe(true);
    expect(shouldAttemptArchive(new Date("2026-08-02T08:00:00Z"), { attempts: 1, lastAttemptDate: "2026-08-01", processed: false })).toBe(true);
    expect(shouldAttemptArchive(new Date("2026-08-02T08:00:00Z"))).toBe(true);
    expect(shouldAttemptArchive(new Date("2026-08-03T08:00:00Z"), { attempts: 1, processed: false })).toBe(false);
    expect(shouldAttemptArchive(new Date("2026-08-01T12:00:00Z"), { attempts: 1, lastAttemptDate: "2026-08-01", processed: false })).toBe(false);
  });
});
