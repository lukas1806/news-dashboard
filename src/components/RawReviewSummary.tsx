"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, RotateCcw, TrendingDown, TrendingUp, X } from "lucide-react";
import { getCategoryLabel } from "@/lib/news";
import {
  RAW_REVIEW_STORAGE_KEY,
  RAW_REVIEW_UPDATED_EVENT,
  type RawReviewAction,
  type RawReviewItem,
  type RawReviewMap,
} from "@/types/raw-review";

const actionLabels: Record<RawReviewAction, string> = {
  keep: "Gut",
  higher: "Höher",
  lower: "Niedriger",
  exclude: "Raus",
};

const actionIcons = {
  keep: Check,
  higher: TrendingUp,
  lower: TrendingDown,
  exclude: X,
};

export function RawReviewSummary() {
  const [reviews, setReviews] = useState<RawReviewMap>({});
  const [copied, setCopied] = useState(false);

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

  const reviewItems = useMemo(
    () => Object.values(reviews).sort((a, b) => a.category.localeCompare(b.category) || a.action.localeCompare(b.action)),
    [reviews],
  );

  const counts = useMemo(() => countReviews(reviewItems), [reviewItems]);
  const exportText = useMemo(() => formatReviewsForExport(reviewItems), [reviewItems]);

  function clearReviews() {
    localStorage.removeItem(RAW_REVIEW_STORAGE_KEY);
    window.dispatchEvent(new Event(RAW_REVIEW_UPDATED_EVENT));
  }

  async function copyReviews() {
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">Review</h2>
          <p className="mt-1 text-sm text-muted">{reviewItems.length} markierte Meldungen</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-muted transition hover:border-slate-500 hover:text-ink"
            disabled={!reviewItems.length}
            onClick={copyReviews}
            type="button"
          >
            <Clipboard aria-hidden="true" className="h-4 w-4" />
            {copied ? "Kopiert" : "Kopieren"}
          </button>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-muted transition hover:border-slate-500 hover:text-ink disabled:opacity-50"
            disabled={!reviewItems.length}
            onClick={clearReviews}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Zurücksetzen
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.entries(actionLabels).map(([action, label]) => {
          const Icon = actionIcons[action as RawReviewAction];

          return (
            <div className="rounded-md border border-line px-3 py-2" key={action}>
              <div className="flex items-center gap-2 text-xs text-muted">
                <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                {label}
              </div>
              <p className="mt-1 text-lg font-semibold text-ink">{counts[action as RawReviewAction]}</p>
            </div>
          );
        })}
      </div>

      {reviewItems.length ? (
        <textarea
          className="mt-4 min-h-36 w-full resize-y rounded-md border border-line bg-canvas p-3 text-sm leading-6 text-slate-200 outline-none"
          readOnly
          value={exportText}
        />
      ) : null}
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

function countReviews(items: RawReviewItem[]): Record<RawReviewAction, number> {
  return items.reduce(
    (counts, item) => ({
      ...counts,
      [item.action]: counts[item.action] + 1,
    }),
    { keep: 0, higher: 0, lower: 0, exclude: 0 },
  );
}

function formatReviewsForExport(items: RawReviewItem[]): string {
  if (!items.length) {
    return "";
  }

  return (Object.keys(actionLabels) as RawReviewAction[])
    .map((action) => {
      const actionItems = items.filter((item) => item.action === action);

      if (!actionItems.length) {
        return "";
      }

      const rows = actionItems.map((item) => `- ${getCategoryLabel(item.category)}: ${item.title} (${item.sourceName})`);
      return `${actionLabels[action]}:\n${rows.join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
}
