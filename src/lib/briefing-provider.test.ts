import { describe, expect, it } from "vitest";
import { groundGeneratedBriefing, type GeneratedBriefing, type GeneratedItem } from "@/lib/briefing-provider";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

const generatedAt = "2026-06-28T03:00:00.000Z";

function candidate(id: string, category: NewsCategory, title: string, excerpt: string): CandidateArticle {
  return {
    id,
    category,
    sourceId: "test-source",
    sourceName: "Testquelle",
    title,
    excerpt,
    url: `https://example.com/${id}`,
    publishedAt: "2026-06-28T02:00:00.000Z",
    candidateScore: 80,
    candidateReasons: ["Testgrund"],
  };
}

function generatedItem(sourceArticleIds: string[], overrides: Partial<GeneratedItem> = {}): GeneratedItem {
  return {
    title: "Belegter Titel",
    teaser: "Belegter Teaser.",
    summary: "Belegte Zusammenfassung.",
    whyImportant: "Belegte Einordnung.",
    concreteImpact: "Keine weitere Auswirkung belegt.",
    uncertainty: "low",
    uncertaintyNote: "",
    sourceArticleIds,
    ...overrides,
  };
}

function generated(category: NewsCategory, items: GeneratedItem[]): GeneratedBriefing {
  return {
    wirtschaft: category === "wirtschaft" ? items : [],
    politik: category === "politik" ? items : [],
    handball: category === "handball" ? items : [],
  };
}

function groups(category: NewsCategory, candidates: CandidateArticle[]) {
  return {
    wirtschaft: category === "wirtschaft" ? candidates : [],
    politik: category === "politik" ? candidates : [],
    handball: category === "handball" ? candidates : [],
  };
}

describe("groundGeneratedBriefing", () => {
  it("rejects an invented first name combined with a sourced surname", () => {
    const source = candidate("gidsel", "handball", "Mathias Gidsel ist ausgezeichnet", "Mathias Gidsel gewinnt die Wahl.");
    const result = groundGeneratedBriefing(
      generated("handball", [generatedItem([source.id], { title: "Emil Gidsel ist ausgezeichnet" })]),
      groups("handball", [source]),
      generatedAt,
    );

    expect(result.handball).toHaveLength(0);
  });

  it("rejects football terminology in a Handball report", () => {
    const source = candidate("handball", "handball", "SC Magdeburg gewinnt", "Der Handballclub gewinnt sein Spiel.");
    const result = groundGeneratedBriefing(
      generated("handball", [generatedItem([source.id], { summary: "Der Fußballclub gewinnt sein Spiel." })]),
      groups("handball", [source]),
      generatedAt,
    );

    expect(result.handball).toHaveLength(0);
  });

  it("rejects a weak single-source political report without independent confirmation", () => {
    const source = candidate("claim", "politik", "Militär meldet Angriff", "Nach Angaben des Militärs gab es einen Angriff.");
    const result = groundGeneratedBriefing(
      generated("politik", [
        generatedItem([source.id], {
          uncertainty: "high",
          uncertaintyNote: "Eine unabhängige Bestätigung fehlt.",
        }),
      ]),
      groups("politik", [source]),
      generatedAt,
    );

    expect(result.politik).toHaveLength(0);
  });

  it("does not reuse one source article for two reports", () => {
    const source = candidate("economy", "wirtschaft", "Industrie investiert", "Das Unternehmen investiert in ein Werk.");
    const result = groundGeneratedBriefing(
      generated("wirtschaft", [
        generatedItem([source.id], { title: "Industrie investiert" }),
        generatedItem([source.id], { title: "Werk wird ausgebaut" }),
      ]),
      groups("wirtschaft", [source]),
      generatedAt,
    );

    expect(result.wirtschaft).toHaveLength(1);
  });

  it("fills Wirtschaft to three distinct source-grounded reports when the model returns too few", () => {
    const sources = [
      candidate("economy-1", "wirtschaft", "Industrie investiert", "Ein Unternehmen investiert in ein neues Werk."),
      candidate("economy-2", "wirtschaft", "EZB entscheidet", "Die Zentralbank veröffentlicht ihre neue Entscheidung."),
      candidate("economy-3", "wirtschaft", "Export zieht an", "Die Ausfuhren entwickeln sich im aktuellen Bericht positiv."),
    ];
    const result = groundGeneratedBriefing(
      generated("wirtschaft", [generatedItem([sources[0].id], { title: sources[0].title })]),
      groups("wirtschaft", sources),
      generatedAt,
    );

    expect(result.wirtschaft).toHaveLength(3);
    expect(new Set(result.wirtschaft.flatMap((item) => item.sources.map((source) => source.articleId))).size).toBe(3);
    expect(result.wirtschaft.slice(1).every((item) => item.uncertaintyNote?.includes("Kompakte Quellenvorschau"))).toBe(true);
  });
});
