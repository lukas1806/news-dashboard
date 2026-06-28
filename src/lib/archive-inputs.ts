import type { BriefingSnapshot } from "@/types/briefing";
import type { ArchiveCategory, ArchiveDailyInput, ArchiveInputItem } from "@/types/archive";

export const archiveCategories: ArchiveCategory[] = ["wirtschaft", "politik"];

export function createArchiveInput(snapshot: BriefingSnapshot, date: string): ArchiveDailyInput {
  return {
    version: 1, date, collectedAt: snapshot.generatedAt,
    categories: Object.fromEntries(archiveCategories.map((category) => [category, snapshot.categories[category].map(({ createdAt: _createdAt, relevanceScore: _score, ...item }) => item)])) as ArchiveDailyInput["categories"],
  };
}

export function qualifyArchiveInputs(inputs: ArchiveDailyInput[]) {
  return Object.fromEntries(archiveCategories.map((category) => [category, qualifyCategory(inputs.flatMap((input) => input.categories[category]))])) as Record<ArchiveCategory, ArchiveInputItem[]>;
}

function qualifyCategory(items: ArchiveInputItem[]): ArchiveInputItem[] {
  const usedSources = new Set<string>(); const seenEvents = new Set<string>(); const result: ArchiveInputItem[] = [];
  for (const item of items) {
    const sourceIds = item.sources.map((source) => source.articleId);
    const event = eventKey(item);
    if (!sourceIds.length || sourceIds.some((id) => usedSources.has(id)) || seenEvents.has(event)) continue;
    result.push(item); seenEvents.add(event); sourceIds.forEach((id) => usedSources.add(id));
  }
  const providers = new Set(result.flatMap((item) => item.sources.map((source) => source.name.toLowerCase())));
  return result.length >= 6 && providers.size >= 3 ? result : [];
}

function eventKey(item: ArchiveInputItem): string {
  const ignored = new Set(["der", "die", "das", "und", "oder", "mit", "für", "von", "nach", "eine", "einer", "einem", "auf"]);
  return [item.title, item.teaser].join(" ").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !ignored.has(word)).slice(0, 8).sort().join("|");
}
