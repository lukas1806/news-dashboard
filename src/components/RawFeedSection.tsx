import { RawArticleCard } from "@/components/RawArticleCard";
import { getCategoryLabel } from "@/lib/news";
import type { NewsCategory } from "@/types/news";
import type { LiveArticle } from "@/types/source";

export function RawFeedSection({ category, articles }: { category: NewsCategory; articles: LiveArticle[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Rohmeldungen</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{getCategoryLabel(category)}</h2>
        </div>
        <p className="text-sm text-muted">{articles.length} Artikel</p>
      </div>

      {articles.length ? (
        <div className="space-y-3">
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
