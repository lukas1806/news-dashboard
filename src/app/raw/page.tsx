import Link from "next/link";
import { Activity, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { RawFeedSection } from "@/components/RawFeedSection";
import { categories } from "@/lib/news";
import { fetchLiveArticlesByCategory } from "@/lib/rss";
import type { NewsCategory } from "@/types/news";
import type { LiveArticle } from "@/types/source";

export const dynamic = "force-dynamic";

export default async function RawFeedsPage() {
  const articleGroups = await Promise.all(
    categories.map(async (category) => ({
      category: category.id,
      articles: await fetchSafeArticles(category.id),
    })),
  );

  const totalArticles = articleGroups.reduce((sum, group) => sum + group.articles.length, 0);

  return (
    <AppShell>
      <main className="px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
        <Link className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-ink" href="/">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Zurück zum Dashboard
        </Link>

        <header className="mt-4 space-y-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface">
            <Activity aria-hidden="true" className="h-5 w-5 text-slate-200" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Intern · Phase 2</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Rohmeldungen</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-300">
            Echte kostenlose Feed-Artikel zur Quellenprüfung. Diese Ansicht ersetzt noch nicht das kuratierte Executive Dashboard.
          </p>
          <p className="text-sm text-muted">{totalArticles} geladene Artikel</p>
        </header>

        <div className="mt-7 space-y-8">
          {articleGroups.map((group) => (
            <RawFeedSection articles={group.articles} category={group.category} key={group.category} />
          ))}
        </div>
      </main>
    </AppShell>
  );
}

async function fetchSafeArticles(category: NewsCategory): Promise<LiveArticle[]> {
  try {
    return await fetchLiveArticlesByCategory(category);
  } catch {
    return [];
  }
}
