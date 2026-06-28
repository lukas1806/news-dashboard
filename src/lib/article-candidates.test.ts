import { describe, expect, it } from "vitest";
import { selectArticleCandidates } from "@/lib/article-candidates";
import type { LiveArticle } from "@/types/source";

function handballArticle(id: string, title: string, excerpt: string): LiveArticle {
  return {
    id,
    sourceId: "handball-world",
    sourceName: "handball-world.news",
    category: "handball",
    title,
    excerpt,
    url: `https://example.com/${id}`,
    publishedAt: new Date().toISOString(),
  };
}

describe("selectArticleCandidates", () => {
  it("keeps only one article about the same Champions-League draw across spelling variants", () => {
    const candidates = selectArticleCandidates("handball", [
      handballArticle(
        "draw-hyphen",
        "Kielce reagiert auf das Magdeburg-Los",
        "Die Vorrundengruppen der Champions-League-Saison wurden ausgelost.",
      ),
      handballArticle(
        "draw-space",
        "Melsungen trifft einen Angstgegner",
        "Die Gruppenphase der Champions League wurde ausgelost.",
      ),
    ]);

    expect(candidates).toHaveLength(1);
  });

  it("keeps a draw report and a distinct structural Champions-League report", () => {
    const candidates = selectArticleCandidates("handball", [
      handballArticle(
        "draw",
        "Kielce reagiert auf das Magdeburg-Los",
        "Die Vorrundengruppen der Champions League wurden ausgelost.",
      ),
      handballArticle(
        "goal",
        "MT Melsungen formuliert Champions-League-Ziel",
        "Der Club beschreibt sein sportliches Ziel für die erste Saison in der Königsklasse.",
      ),
    ]);

    expect(candidates.map((candidate) => candidate.id)).toEqual(expect.arrayContaining(["draw", "goal"]));
  });
});
