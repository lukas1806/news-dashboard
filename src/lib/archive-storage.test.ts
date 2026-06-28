import { afterEach, describe, expect, it } from "vitest";
import { rm } from "node:fs/promises";
import path from "node:path";
import { archivePaths, loadArchiveMonth, saveArchiveMonth } from "@/lib/archive-storage";
import type { MonthlyArchive } from "@/types/archive";

const target = path.join(process.cwd(), ".briefing-data", "archive", "2099-12.json");
const originalDriver = process.env.BRIEFING_STORAGE_DRIVER;
afterEach(async () => { if (originalDriver === undefined) delete process.env.BRIEFING_STORAGE_DRIVER; else process.env.BRIEFING_STORAGE_DRIVER = originalDriver; await rm(target, { force: true }); });

describe("archive storage", () => {
  it("uses stable private paths", () => { expect(archivePaths.month("2026-07")).toBe("briefings/archive/2026-07.json"); expect(archivePaths.input("2026-07-01")).toBe("briefings/archive-inputs/2026-07-01.json"); });
  it("round-trips a validated month with the local file driver", async () => {
    process.env.BRIEFING_STORAGE_DRIVER = "file";
    const value: MonthlyArchive = { version: 1, month: "2099-12", periodStart: "2099-12-01", periodEnd: "2099-12-31", generatedAt: "2100-01-01T08:00:00Z", model: "fixture", wirtschaft: { id: "fixture", category: "wirtschaft", title: "Titel", teaser: "Teaser", developmentLines: ["A", "B", "C"], managementSummary: ["A", "B", "C"], briefingText: "Text", whyImportant: "Wichtig", concreteImpact: "Auswirkung", uncertainty: "low", sources: [{ articleId: "a", name: "Quelle", url: "https://example.com/a", publishedAt: "2099-12-01T08:00:00Z" }] } };
    await saveArchiveMonth(value); await expect(loadArchiveMonth("2099-12")).resolves.toEqual(value);
  });
});
