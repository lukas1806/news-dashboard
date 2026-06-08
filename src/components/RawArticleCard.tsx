"use client";

import { ArrowDown, ArrowUp, Check, ExternalLink, X } from "lucide-react";
import { getCategoryLabel, formatDate } from "@/lib/news";
import type { LiveArticle } from "@/types/source";
import type { RawReviewAction } from "@/types/raw-review";

export function RawArticleCard({
  article,
  candidateScore,
  candidateReasons = [],
  reviewAction,
  onReview,
}: {
  article: LiveArticle;
  candidateScore?: number;
  candidateReasons?: string[];
  reviewAction?: RawReviewAction;
  onReview?: (article: LiveArticle, action: RawReviewAction | undefined) => void;
}) {
  const reviewClasses = {
    keep: "border-emerald-400/40",
    higher: "border-sky-400/40",
    lower: "border-amber-400/40",
    exclude: "border-red-400/40 opacity-60",
  };

  return (
    <article className={`rounded-lg border bg-surface p-4 ${reviewAction ? reviewClasses[reviewAction] : "border-line"}`}>
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

      {onReview ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <ReviewButton
            action="keep"
            activeAction={reviewAction}
            icon={Check}
            label="Gut"
            onClick={() => onReview(article, reviewAction === "keep" ? undefined : "keep")}
          />
          <ReviewButton
            action="higher"
            activeAction={reviewAction}
            icon={ArrowUp}
            label="Höher"
            onClick={() => onReview(article, reviewAction === "higher" ? undefined : "higher")}
          />
          <ReviewButton
            action="lower"
            activeAction={reviewAction}
            icon={ArrowDown}
            label="Niedriger"
            onClick={() => onReview(article, reviewAction === "lower" ? undefined : "lower")}
          />
          <ReviewButton
            action="exclude"
            activeAction={reviewAction}
            icon={X}
            label="Raus"
            onClick={() => onReview(article, reviewAction === "exclude" ? undefined : "exclude")}
          />
        </div>
      ) : null}
    </article>
  );
}

function ReviewButton({
  action,
  activeAction,
  icon: Icon,
  label,
  onClick,
}: {
  action: RawReviewAction;
  activeAction?: RawReviewAction;
  icon: typeof Check;
  label: string;
  onClick: () => void;
}) {
  const active = activeAction === action;

  return (
    <button
      aria-pressed={active}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
        active
          ? "border-slate-400 bg-slate-200 text-slate-950"
          : "border-line text-muted hover:border-slate-500 hover:text-ink"
      }`}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );
}
