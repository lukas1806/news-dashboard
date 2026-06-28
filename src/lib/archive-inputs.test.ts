import { describe, expect, it } from "vitest";
import { qualifyArchiveInputs } from "@/lib/archive-inputs";
import type { ArchiveDailyInput, ArchiveInputItem } from "@/types/archive";

function item(index: number, provider = ["A", "B", "C"][index % 3], category: "wirtschaft" | "politik" = "wirtschaft"): ArchiveInputItem {
  const topics = ["Zollabkommen Europa", "Leitzinsentscheidung Zentralbank", "Chipinvestition Sachsen", "Ölmarkt Förderquote", "Industrieauftrag Maschinenbau", "Inflationsdaten Eurozone", "Haushaltsreform Bundestag", "Infrastruktur Bahnnetz", "Wahlreform Parlament", "Sicherheitsabkommen Nato"];
  return { id: `${category}-${index}`, category, title: topics[index % topics.length], teaser: `Entwicklung ${index}`, summary: `Fakten ${index}`, whyImportant: "Wichtig", concreteImpact: "Auswirkung", uncertainty: "low", sources: [{ articleId: `article-${index}`, name: provider, url: `https://example.com/${index}`, publishedAt: "2026-07-15T10:00:00Z" }] };
}
function input(items: ArchiveInputItem[]): ArchiveDailyInput { return { version: 1, date: "2026-07-15", collectedAt: "2026-07-15T12:00:00Z", categories: { wirtschaft: items.filter((i) => i.category === "wirtschaft"), politik: items.filter((i) => i.category === "politik") } }; }

describe("archive qualification", () => {
  it("requires six events and three providers", () => { expect(qualifyArchiveInputs([input(Array.from({ length: 5 }, (_, i) => item(i)))]).wirtschaft).toHaveLength(0); expect(qualifyArchiveInputs([input(Array.from({ length: 6 }, (_, i) => item(i, "A")))]).wirtschaft).toHaveLength(0); expect(qualifyArchiveInputs([input(Array.from({ length: 6 }, (_, i) => item(i)))]).wirtschaft).toHaveLength(6); });
  it("deduplicates retained sources and events", () => { const base = Array.from({ length: 6 }, (_, i) => item(i)); const duplicate = { ...item(9), sources: base[0].sources }; expect(qualifyArchiveInputs([input([...base, duplicate]), input(base)]).wirtschaft).toHaveLength(6); });
  it("allows one category to qualify and excludes handball by type and shape", () => { const groups = qualifyArchiveInputs([input([...Array.from({ length: 6 }, (_, i) => item(i)), item(20, "A", "politik")])]); expect(groups.wirtschaft).toHaveLength(6); expect(groups.politik).toHaveLength(0); expect(Object.keys(groups)).toEqual(["wirtschaft", "politik"]); });
});
