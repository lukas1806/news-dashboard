import { AppShell } from "@/components/AppShell";
import { CandidateDashboardPreview } from "@/components/CandidateDashboardPreview";
import { selectArticleCandidates } from "@/lib/article-candidates";
import { categories, getDailyNewsByCategory } from "@/lib/news";
import { fetchLiveArticlesByCategory } from "@/lib/rss";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

export const dynamic = "force-dynamic";

const PREVIEW_LIMIT = 5;

export default async function PreviewPage() {
  const groups = await Promise.all(
    categories.map(async (category) => {
      const candidates = await fetchCandidates(category.id);

      if (candidates.length) {
        return { category: category.id, candidates, source: "live" as const };
      }

      return {
        category: category.id,
        candidates: getFallbackCandidates(category.id),
        source: "mock" as const,
      };
    }),
  );

  return (
    <AppShell>
      <CandidateDashboardPreview groups={groups} />
    </AppShell>
  );
}

async function fetchCandidates(category: NewsCategory): Promise<CandidateArticle[]> {
  try {
    const articles = await fetchLiveArticlesByCategory(category, 60);
    return selectArticleCandidates(category, articles, PREVIEW_LIMIT);
  } catch {
    return [];
  }
}

function getFallbackCandidates(category: NewsCategory): CandidateArticle[] {
  return getDailyNewsByCategory(category)
    .slice(0, PREVIEW_LIMIT)
    .map((item) => ({
      id: `preview-${item.id}`,
      sourceId: "phase-1-mock",
      sourceName: "Phase-1-Mockdaten",
      category,
      title: item.title,
      url: item.sources[0]?.url ?? "/",
      publishedAt: `${item.date}T12:00:00.000Z`,
      excerpt: item.summary,
      candidateScore: Math.round(item.relevanceScore * 10),
      candidateReasons: ["Mockdaten-Fallback"],
    }));
}
