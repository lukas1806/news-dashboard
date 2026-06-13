import { generateBriefingSnapshot } from "@/lib/briefing-provider";
import { loadBriefingSnapshot, saveBriefingSnapshot } from "@/lib/briefing-storage";
import { categories } from "@/lib/news";
import { fetchArticleCandidatesByCategory } from "@/lib/rss";
import type { BriefingItem, BriefingSnapshot } from "@/types/briefing";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

const RETAINED_ITEM_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const MAX_ITEMS_PER_CATEGORY = 5;
const BRIEFING_CANDIDATE_POOL_SIZE = 8;

export async function generateAndSaveDailyBriefing({ force = false }: { force?: boolean } = {}) {
  const existingSnapshot = await loadBriefingSnapshot();

  if (!force && existingSnapshot && isSameUtcDate(existingSnapshot.generatedAt, new Date().toISOString())) {
    return { snapshot: existingSnapshot, generated: false };
  }

  const entries = await Promise.all(
    categories.map(async ({ id }) => [id, await fetchArticleCandidatesByCategory(id, BRIEFING_CANDIDATE_POOL_SIZE)] as const),
  );
  const candidateGroups = Object.fromEntries(entries) as Record<NewsCategory, CandidateArticle[]>;
  const generatedSnapshot = await generateBriefingSnapshot(candidateGroups);
  const snapshot = mergeBriefingSnapshots(generatedSnapshot, existingSnapshot);

  await saveBriefingSnapshot(snapshot);
  return { snapshot, generated: true };
}

function mergeBriefingSnapshots(generated: BriefingSnapshot, existing: BriefingSnapshot | null): BriefingSnapshot {
  const now = new Date(generated.generatedAt).getTime();
  const mergedCategories = Object.fromEntries(
    categories.map(({ id: category }) => {
      const retained = (existing?.categories[category] ?? []).filter(
        (item) => now - new Date(item.createdAt).getTime() <= RETAINED_ITEM_MAX_AGE_MS && isRetainableItem(item),
      );
      const oldBySource = new Map(retained.flatMap((item) => item.sources.map((source) => [source.articleId, item] as const)));
      const generatedWithOriginalDates = generated.categories[category].map((item) => {
        const priorItem = item.sources.map((source) => oldBySource.get(source.articleId)).find(Boolean);
        return priorItem ? { ...item, createdAt: priorItem.createdAt } : item;
      });
      const merged = [...generatedWithOriginalDates];

      for (const item of retained) {
        if (merged.some((candidate) => itemsOverlap(candidate, item))) {
          continue;
        }
        merged.push(item);
      }

      return [category, merged.sort(sortBriefingItems).slice(0, MAX_ITEMS_PER_CATEGORY)];
    }),
  ) as BriefingSnapshot["categories"];

  return { ...generated, categories: mergedCategories };
}

function itemsOverlap(a: BriefingItem, b: BriefingItem): boolean {
  const sourceIds = new Set(a.sources.map((source) => source.articleId));
  if (b.sources.some((source) => sourceIds.has(source.articleId))) {
    return true;
  }

  return titlesAreNearDuplicates(a.title, b.title);
}

function isRetainableItem(item: BriefingItem): boolean {
  const text = [item.title, item.teaser, item.summary].join(" ").toLowerCase();

  if (item.category === "wirtschaft" && (item.title.toLowerCase().startsWith("dax ") || text.includes("marktbericht"))) {
    return false;
  }

  if (text.includes("mikkel hansen gidsel") || text.includes("anmerkung: name aus artikel")) {
    return false;
  }

  return !(item.category === "politik" && item.uncertainty === "high" && item.sources.length === 1);
}

function sortBriefingItems(a: BriefingItem, b: BriefingItem): number {
  if (b.relevanceScore !== a.relevanceScore) {
    return b.relevanceScore - a.relevanceScore;
  }

  return getLatestSourceTime(b) - getLatestSourceTime(a);
}

function getLatestSourceTime(item: BriefingItem): number {
  return Math.max(...item.sources.map((source) => new Date(source.publishedAt).getTime()));
}

function titlesAreNearDuplicates(a: string, b: string): boolean {
  const aWords = getMeaningfulTitleWords(a);
  const bWords = getMeaningfulTitleWords(b);

  if (!aWords.size || !bWords.size) {
    return false;
  }

  const sharedWords = Array.from(aWords).filter((word) => bWords.has(word)).length;
  return sharedWords / Math.min(aWords.size, bWords.size) >= 0.8;
}

function getMeaningfulTitleWords(value: string): Set<string> {
  const ignoredWords = new Set(["der", "die", "das", "den", "dem", "des", "ein", "eine", "einer", "eines", "und", "oder", "mit", "für", "von", "im", "in", "auf", "zu", "nach"]);
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9äöüß]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length >= 3 && !ignoredWords.has(word)),
  );
}

function isSameUtcDate(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
