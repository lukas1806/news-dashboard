import { describe, expect, it } from "vitest";
import { parseBriefingSnapshot } from "@/lib/briefing-validation";

describe("parseBriefingSnapshot", () => {
  it("rejects snapshots with more than five items in a category", () => {
    const item = {
      id: "item",
      title: "Titel",
      teaser: "Teaser",
      summary: "Zusammenfassung",
      whyImportant: "Einordnung",
      concreteImpact: "Auswirkung",
      uncertainty: "low",
      sources: [{ articleId: "source", name: "Quelle", url: "https://example.com", publishedAt: "2026-06-28T02:00:00.000Z" }],
    };

    expect(() =>
      parseBriefingSnapshot({
        version: 1,
        generatedAt: "2026-06-28T03:00:00.000Z",
        model: "test-model",
        categories: { wirtschaft: Array.from({ length: 6 }, (_, index) => ({ ...item, id: `item-${index}` })), politik: [], handball: [] },
      }),
    ).toThrow("Invalid briefing items for wirtschaft");
  });

  it("rejects sources without a verified publication time", () => {
    expect(() =>
      parseBriefingSnapshot({
        version: 1,
        generatedAt: "2026-06-28T03:00:00.000Z",
        model: "test-model",
        categories: {
          wirtschaft: [
            {
              id: "item",
              title: "Titel",
              summary: "Zusammenfassung",
              whyImportant: "Einordnung",
              concreteImpact: "Auswirkung",
              uncertainty: "low",
              sources: [{ articleId: "source", name: "Quelle", url: "https://example.com" }],
            },
          ],
          politik: [],
          handball: [],
        },
      }),
    ).toThrow("Invalid briefing source for wirtschaft");
  });
});
