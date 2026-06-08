import { RawArticleCard } from "@/components/RawArticleCard";
import { getCategoryLabel } from "@/lib/news";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle, LiveArticle } from "@/types/source";

export function RawFeedSection({
  category,
  articles,
  candidates,
}: {
  category: NewsCategory;
  articles: LiveArticle[];
  candidates: CandidateArticle[];
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Rohmeldungen</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{getCategoryLabel(category)}</h2>
        </div>
        <p className="text-sm text-muted">{articles.length} Artikel</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Kandidaten</h3>
          <p className="text-xs text-muted">{candidates.length} ausgewählt</p>
        </div>

        {candidates.length ? (
          <div className="space-y-3">
            {candidates.map((article) => (
              <RawArticleCard
                article={article}
                candidateReasons={article.candidateReasons}
                candidateScore={article.candidateScore}
                key={article.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-slate-300">
            Für diese Kategorie wurden gerade keine Kandidaten ausgewählt.
          </div>
        )}
      </div>

      {articles.length ? (
        <div className="space-y-3 pt-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Gefilterte Rohmeldungen</h3>
          {articles.map((article) => (
            <RawArticleCard article={article} key={article.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-slate-300">
          Für diese Kategorie wurden gerade keine Rohmeldungen geladen.
        </div>
      )}
    </section>
  );
}
