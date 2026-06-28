import { describe, expect, it } from "vitest";
import { mergeBriefingSnapshots } from "@/lib/briefing-generation";
import type { BriefingItem, BriefingSnapshot } from "@/types/briefing";
import type { NewsCategory } from "@/types/news";

const generatedAt = "2026-06-28T03:00:00.000Z";

function item(id: string, title: string, teaser: string, category: NewsCategory = "handball"): BriefingItem {
  return {
    id,
    category,
    title,
    teaser,
    summary: teaser,
    whyImportant: "Belegte Einordnung.",
    concreteImpact: "Keine weitergehende Auswirkung belegt.",
    createdAt: generatedAt,
    relevanceScore: 80,
    uncertainty: "low",
    sources: [
      {
        articleId: `${id}-source`,
        name: "Testquelle",
        url: `https://example.com/${id}`,
        publishedAt: "2026-06-28T02:00:00.000Z",
      },
    ],
  };
}

function snapshot(handball: BriefingItem[], existingGeneratedAt = generatedAt): BriefingSnapshot {
  return {
    version: 1,
    generatedAt: existingGeneratedAt,
    model: "test-model",
    categories: { wirtschaft: [], politik: [], handball },
  };
}

describe("mergeBriefingSnapshots", () => {
  it("deduplicates two same-run reports about one group-stage draw", () => {
    const merged = mergeBriefingSnapshots(
      snapshot([
        item("kielce", "Kielce reagiert auf Magdeburg-Los", "Auslosung der Champions-League-Vorrundengruppen."),
        item("melsungen", "Melsungen trifft Angstgegner", "Die Auslosung der Gruppenphase der Champions League ist erfolgt."),
      ]),
      null,
    );

    expect(merged.categories.handball).toHaveLength(1);
  });

  it("removes a retained draw duplicate but keeps a distinct Champions-League goal", () => {
    const current = snapshot([
      item("kielce", "Kielce reagiert auf Magdeburg-Los", "Auslosung der Champions-League-Vorrundengruppen."),
      item("goal", "MT Melsungen formuliert Champions-League-Ziel", "Der Club benennt sein Ziel für die Saison."),
    ]);
    const previous = snapshot(
      [item("melsungen", "Melsungen trifft Angstgegner", "Die Auslosung der Gruppenphase der Champions League ist erfolgt.")],
      "2026-06-27T03:00:00.000Z",
    );

    const merged = mergeBriefingSnapshots(current, previous);

    expect(merged.categories.handball.map((entry) => entry.id)).toEqual(["kielce", "goal"]);
  });
});
