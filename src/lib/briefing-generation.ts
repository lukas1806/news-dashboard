import { generateBriefingSnapshot } from "@/lib/briefing-provider";
import { loadBriefingSnapshot, saveBriefingSnapshot } from "@/lib/briefing-storage";
import { categories } from "@/lib/news";
import { fetchArticleCandidatesByCategory } from "@/lib/rss";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

export async function generateAndSaveDailyBriefing() {
  const existingSnapshot = await loadBriefingSnapshot();

  if (existingSnapshot && isSameUtcDate(existingSnapshot.generatedAt, new Date().toISOString())) {
    return { snapshot: existingSnapshot, generated: false };
  }

  const entries = await Promise.all(
    categories.map(async ({ id }) => [id, await fetchArticleCandidatesByCategory(id)] as const),
  );
  const candidateGroups = Object.fromEntries(entries) as Record<NewsCategory, CandidateArticle[]>;
  const snapshot = await generateBriefingSnapshot(candidateGroups);

  await saveBriefingSnapshot(snapshot);
  return { snapshot, generated: true };
}

function isSameUtcDate(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10);
}
