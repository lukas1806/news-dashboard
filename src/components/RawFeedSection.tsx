"use client";

import { useEffect, useMemo, useState } from "react";
import { EyeOff, ListFilter } from "lucide-react";
import { RawArticleCard } from "@/components/RawArticleCard";
import { getCategoryLabel } from "@/lib/news";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle, LiveArticle } from "@/types/source";
import {
  RAW_REVIEW_STORAGE_KEY,
  RAW_REVIEW_UPDATED_EVENT,
  type RawReviewAction,
  type RawReviewMap,
} from "@/types/raw-review";

export function RawFeedSection({
  category,
  articles,
  candidates,
}: {
  category: NewsCategory;
  articles: LiveArticle[];
  candidates: CandidateArticle[];
}) {
  const [reviews, setReviews] = useState<RawReviewMap>({});
  const [hideExcluded, setHideExcluded] = useState(false);
  const [useReviewSort, setUseReviewSort] = useState(false);

  useEffect(() => {
    const loadReviews = () => setReviews(readReviews());

    loadReviews();
    window.addEventListener(RAW_REVIEW_UPDATED_EVENT, loadReviews);
    window.addEventListener("storage", loadReviews);

    return () => {
      window.removeEventListener(RAW_REVIEW_UPDATED_EVENT, loadReviews);
      window.removeEventListener("storage", loadReviews);
    };
  }, []);

  const visibleCandidates = useMemo(
    () => prepareArticlesForReview(candidates, reviews, hideExcluded, useReviewSort),
    [candidates, hideExcluded, reviews, useReviewSort],
  );
  const visibleArticles = useMemo(
    () => prepareArticlesForReview(articles, reviews, hideExcluded, useReviewSort),
    [articles, hideExcluded, reviews, useReviewSort],
  );

  function saveReview(article: LiveArticle, action: RawReviewAction | undefined) {
    const nextReviews = readReviews();

    if (action) {
      nextReviews[article.id] = {
        id: article.id,
        title: article.title,
        category: article.category,
        sourceName: article.sourceName,
        action,
        updatedAt: new Date().toISOString(),
      };
    } else {
      delete nextReviews[article.id];
    }

    setReviews(nextReviews);
    localStorage.setItem(RAW_REVIEW_STORAGE_KEY, JSON.stringify(nextReviews));
    window.dispatchEvent(new Event(RAW_REVIEW_UPDATED_EVENT));
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4 border-b border-line pb-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Rohmeldungen</p>
          <h2 className="mt-1 text-xl font-semibold text-ink">{getCategoryLabel(category)}</h2>
        </div>
        <p className="text-sm text-muted">{articles.length} Artikel</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          aria-pressed={useReviewSort}
          className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
            useReviewSort
              ? "border-slate-400 bg-slate-200 text-slate-950"
              : "border-line text-muted hover:border-slate-500 hover:text-ink"
          }`}
          onClick={() => setUseReviewSort((value) => !value)}
          type="button"
        >
          <ListFilter aria-hidden="true" className="h-4 w-4" />
          Review-Sortierung
        </button>
        <button
          aria-pressed={hideExcluded}
          className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
            hideExcluded
              ? "border-slate-400 bg-slate-200 text-slate-950"
              : "border-line text-muted hover:border-slate-500 hover:text-ink"
          }`}
          onClick={() => setHideExcluded((value) => !value)}
          type="button"
        >
          <EyeOff aria-hidden="true" className="h-4 w-4" />
          Raus ausblenden
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Kandidaten</h3>
          <p className="text-xs text-muted">{visibleCandidates.length} sichtbar</p>
        </div>

        {visibleCandidates.length ? (
          <div className="space-y-3">
            {visibleCandidates.map((article) => (
              <RawArticleCard
                article={article}
                candidateReasons={article.candidateReasons}
                candidateScore={article.candidateScore}
                key={article.id}
                onReview={saveReview}
                reviewAction={reviews[article.id]?.action}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-slate-300">
            Für diese Kategorie wurden gerade keine Kandidaten ausgewählt.
          </div>
        )}
      </div>

      {visibleArticles.length ? (
        <div className="space-y-3 pt-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Gefilterte Rohmeldungen</h3>
          {visibleArticles.map((article) => (
            <RawArticleCard
              article={article}
              key={article.id}
              onReview={saveReview}
              reviewAction={reviews[article.id]?.action}
            />
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

function readReviews(): RawReviewMap {
  try {
    return JSON.parse(localStorage.getItem(RAW_REVIEW_STORAGE_KEY) ?? "{}") as RawReviewMap;
  } catch {
    return {};
  }
}

function prepareArticlesForReview<T extends LiveArticle>(
  articles: T[],
  reviews: RawReviewMap,
  hideExcluded: boolean,
  useReviewSort: boolean,
): T[] {
  const visibleArticles = hideExcluded ? articles.filter((article) => reviews[article.id]?.action !== "exclude") : articles;

  if (!useReviewSort) {
    return visibleArticles;
  }

  return [...visibleArticles].sort((a, b) => getReviewPriority(reviews[a.id]?.action) - getReviewPriority(reviews[b.id]?.action));
}

function getReviewPriority(action: RawReviewAction | undefined): number {
  if (action === "higher") {
    return 0;
  }

  if (action === "keep") {
    return 1;
  }

  if (!action) {
    return 2;
  }

  if (action === "lower") {
    return 3;
  }

  return 4;
}
