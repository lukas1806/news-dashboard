import { ExternalLink } from "lucide-react";
import { getCategoryLabel, formatDate } from "@/lib/news";
import type { LiveArticle } from "@/types/source";

export function RawArticleCard({
  article,
  candidateScore,
  candidateReasons = [],
}: {
  article: LiveArticle;
  candidateScore?: number;
  candidateReasons?: string[];
}) {
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{getCategoryLabel(article.category)}</p>
          <h3 className="text-base font-semibold leading-snug text-ink">{article.title}</h3>
        </div>
        <a
          aria-label={`Originalmeldung öffnen: ${article.title}`}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line text-muted transition hover:border-slate-500 hover:text-ink"
          href={article.url}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
      </div>

      {article.excerpt ? <p className="mt-3 text-sm leading-6 text-slate-300">{article.excerpt}</p> : null}

      {candidateScore ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 font-semibold text-emerald-200">
            Kandidat · {candidateScore}
          </span>
          {candidateReasons.map((reason) => (
            <span className="rounded-md border border-line px-2 py-1 text-muted" key={reason}>
              {reason}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{article.sourceName}</span>
        {article.publishedAt ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{formatDate(article.publishedAt.slice(0, 10))}</span>
          </>
        ) : null}
      </div>
    </article>
  );
}
