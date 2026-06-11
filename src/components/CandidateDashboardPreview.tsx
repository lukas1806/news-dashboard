"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, FlaskConical } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { categories, getCategoryLabel } from "@/lib/news";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle } from "@/types/source";

type PreviewGroup = {
  category: NewsCategory;
  candidates: CandidateArticle[];
  source: "live" | "mock";
};

export function CandidateDashboardPreview({ groups }: { groups: PreviewGroup[] }) {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>("wirtschaft");
  const activeGroup = useMemo(
    () => groups.find((group) => group.category === selectedCategory) ?? groups[0],
    [groups, selectedCategory],
  );

  if (!activeGroup) {
    return null;
  }

  const usesMockData = activeGroup.source === "mock";

  return (
    <main className="px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
      <Link className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-ink" href="/">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Zurück zum Dashboard
      </Link>

      <header className="mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Phase 2 · Preview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Echte Kandidaten</h1>
          </div>
          <div className="rounded-md border border-amber-300/30 bg-amber-300/5 px-2.5 py-1.5 text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-amber-200">Experiment</p>
            <p className="text-sm font-semibold text-ink">Kein Briefing</p>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
          Eine kleine Vorschau der regelbasiert ausgewählten RSS-Kandidaten. Noch ohne KI, Zusammenfassungen, Datenbank oder redaktionelle Freigabe.
        </p>
      </header>

      <section className="-mx-4 mt-6 border-y border-line bg-canvas px-4 py-3 sm:-mx-6 sm:px-6">
        <CategoryTabs categories={categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
      </section>

      <section className="mt-5 space-y-3" aria-label="Kandidaten-Preview">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted">{usesMockData ? "Fallback" : "Live RSS"}</p>
            <h2 className="mt-1 text-xl font-semibold text-ink">{getCategoryLabel(activeGroup.category)}</h2>
          </div>
          <p className="text-sm text-muted">{activeGroup.candidates.length} Kandidaten</p>
        </div>

        {usesMockData ? (
          <div className="flex gap-3 rounded-lg border border-amber-300/25 bg-amber-300/5 p-3 text-sm leading-6 text-amber-100">
            <FlaskConical aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
            Die Live-Feeds waren nicht verfügbar. Diese Kategorie zeigt klar gekennzeichnete Phase-1-Mockdaten.
          </div>
        ) : null}

        {activeGroup.candidates.map((candidate) => (
          <article className="rounded-lg border border-line bg-surface p-4" key={candidate.id}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="font-semibold uppercase tracking-[0.14em]">{candidate.sourceName}</span>
              {candidate.publishedAt ? (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={candidate.publishedAt}>{formatPublishedAt(candidate.publishedAt)}</time>
                </>
              ) : null}
            </div>

            <h3 className="mt-3 text-lg font-semibold leading-snug text-ink">{candidate.title}</h3>
            {candidate.excerpt ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-300">{candidate.excerpt}</p> : null}

            <div className="mt-3 flex flex-wrap gap-2">
              {candidate.candidateReasons.slice(0, 3).map((reason) => (
                <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted" key={reason}>
                  {reason}
                </span>
              ))}
            </div>

            <a
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-medium text-muted transition hover:border-slate-500 hover:text-ink"
              href={candidate.url}
              rel="noreferrer"
              target="_blank"
            >
              Quelle öffnen
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          </article>
        ))}
      </section>
    </main>
  );
}

function formatPublishedAt(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
