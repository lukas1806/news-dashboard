import { generateBriefingSnapshot } from "@/lib/briefing-provider";
import { loadBriefingSnapshot, saveBriefingSnapshot } from "@/lib/briefing-storage";
import { categories } from "@/lib/news";
import { fetchArticleCandidatesByCategory } from "@/lib/rss";
import type { BriefingItem, BriefingSnapshot } from "@/types/briefing";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

const RETAINED_ITEM_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const MAX_ITEMS_PER_CATEGORY = 5;

export async function generateAndSaveDailyBriefing({ force = false }: { force?: boolean } = {}) {
  const existingSnapshot = await loadBriefingSnapshot();

  if (!force && existingSnapshot && isSameUtcDate(existingSnapshot.generatedAt, new Date().toISOString())) {
    return { snapshot: existingSnapshot, generated: false };
  }

  const entries = await Promise.all(
    categories.map(async ({ id }) => [id, await fetchArticleCandidatesByCategory(id)] as const),
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

  const aTopic = getBriefingItemTopicKey(a);
  const bTopic = getBriefingItemTopicKey(b);
  return normalizeTitle(a.title) === normalizeTitle(b.title) || Boolean(aTopic && aTopic === bTopic);
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

function getBriefingItemTopicKey(item: BriefingItem): string | undefined {
  const text = [item.title, item.teaser, item.summary].join(" ").toLowerCase();

  if (item.category === "wirtschaft") {
    if (containsAny(text, ["spacex", "börsengang", " ipo "])) return "wirtschaft-ipo";
    if (containsAny(text, ["zoll", "zölle", "handelskonflikt"])) return "wirtschaft-zoelle";
    if (containsAny(text, ["ezb", "leitzins", "zinswende"])) return "wirtschaft-zinsen";
  }

  if (item.category === "politik") {
    if (containsAny(text, ["straße von hormus", "strasse von hormus", "golf von oman"])) return "politik-hormus";
    if (containsAny(text, ["iran", "israel", "nahost", "waffenruhe", "friedensabkommen"])) return "politik-nahost";
    if (containsAny(text, ["ukraine", "russland", "russisch", "drohnen"])) return "politik-ukraine-russland";
  }

  if (item.category === "handball") {
    if (containsAny(text, ["final4", "final four", "lanxess arena"])) return "handball-final4";
    if (containsAny(text, ["torschützenliste", "top-torschützen", "top-torhüter"])) return "handball-statistik";
  }

  return undefined;
}

function containsAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
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

function normalizeTitle(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9äöüß]+/g, " ").trim();
}

function isSameUtcDate(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
