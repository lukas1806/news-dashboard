"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Bot, Clock3 } from "lucide-react";
import { BriefingManualRefresh } from "@/components/BriefingManualRefresh";
import { CategoryTabs } from "@/components/CategoryTabs";
import {
  formatBriefingDateTime,
  formatBriefingSourceTime,
  formatBriefingUncertainty,
  getBriefingReadingTime,
} from "@/lib/briefing-format";
import { categories, getCategoryLabel } from "@/lib/news";
import type { BriefingDisplayStatus, BriefingItem, BriefingSnapshot } from "@/types/briefing";
import type { NewsCategory } from "@/types/news";

export function BriefingPreview({
  snapshot,
  status,
  error,
}: {
  snapshot: BriefingSnapshot | null;
  status: BriefingDisplayStatus;
  error?: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory>("wirtschaft");
  const items = useMemo(() => snapshot?.categories[selectedCategory] ?? [], [selectedCategory, snapshot]);
  const isMockSnapshot = snapshot?.model === "mock-provider";

  return (
    <main className="px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
      <Link className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-ink" href="/">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Zurück zum Dashboard
      </Link>

      <header className="mt-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Phase 3 · Preview</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Morning Briefing</h1>
          </div>
          <div className="rounded-md border border-violet-300/30 bg-violet-300/5 px-2.5 py-1.5 text-right">
            <p className="text-[0.68rem] uppercase tracking-[0.16em] text-violet-200">Experiment</p>
            <p className="text-sm font-semibold text-ink">{isMockSnapshot ? "Lokaler Mock" : "KI-generiert"}</p>
          </div>
        </div>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
          Bis zu fünf priorisierte Meldungen pro Bereich. Die Übersicht ist für einen schnellen Scan gedacht; jede Kachel führt zum ausführlichen Bericht.
        </p>

        {snapshot ? (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
              Aktualisiert {formatBriefingDateTime(snapshot.generatedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bot aria-hidden="true" className="h-3.5 w-3.5" />
              {snapshot.model}
            </span>
          </div>
        ) : null}

        <div className="mt-5">
          <BriefingManualRefresh />
        </div>
      </header>

      <StatusNotice error={error} status={status} />

      {snapshot ? (
        <>
          <section className="-mx-4 mt-6 border-y border-line bg-canvas px-4 py-3 sm:-mx-6 sm:px-6">
            <CategoryTabs categories={categories} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
          </section>

          <section className="mt-5 space-y-3" aria-label="KI-Briefings">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Nach Relevanz</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">{getCategoryLabel(selectedCategory)}</h2>
              </div>
              <p className="text-sm text-muted">{items.length} Briefings</p>
            </div>

            {items.length ? (
              items.map((item) => <CompactBriefingCard item={item} key={item.id} />)
            ) : (
              <div className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-slate-300">
                Für diese Kategorie liegt aktuell keine Meldung mit ausreichender Substanz vor.
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function CompactBriefingCard({ item }: { item: BriefingItem }) {
  const primarySource = item.sources[0];
  const sourceLabel = item.sources.length > 1 ? `${primarySource.name} +${item.sources.length - 1}` : primarySource.name;

  return (
    <Link
      className="group block rounded-lg border border-line bg-surface p-4 transition hover:border-slate-500/60 hover:bg-panel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      href={`/briefing-preview/${item.category}/${encodeURIComponent(item.id)}`}
    >
      <article>
        <div className="flex items-center justify-between gap-3 text-xs text-muted">
          <span className="truncate">{sourceLabel} · {formatBriefingSourceTime(primarySource.publishedAt)}</span>
          {item.uncertainty !== "none" ? (
            <span className="shrink-0 rounded-full border border-amber-300/25 bg-amber-300/5 px-2 py-0.5 text-amber-100">
              {formatBriefingUncertainty(item.uncertainty)}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-lg font-semibold leading-snug text-ink sm:text-xl">{item.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">{item.teaser}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span>{getBriefingReadingTime(item)} Min Lesezeit</span>
          <span className="inline-flex items-center gap-1 font-medium text-slate-300 transition group-hover:text-ink">
            Details
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}

function StatusNotice({ status, error }: { status: BriefingDisplayStatus; error?: string }) {
  if (status === "fresh") {
    return null;
  }

  const messages: Record<Exclude<BriefingDisplayStatus, "fresh">, string> = {
    stale: "Der automatische Lauf ist fehlgeschlagen oder verspätet. Das letzte erfolgreiche Briefing wird noch bis maximal 48 Stunden angezeigt.",
    expired: "Das letzte erfolgreiche Briefing ist älter als 48 Stunden und wird nicht mehr angezeigt. Eine manuelle Aktualisierung ist weiterhin möglich.",
    unavailable: "Noch kein Briefing verfügbar. Eine manuelle Aktualisierung ist möglich, sobald das Admin-Passwort in Vercel eingerichtet ist.",
  };

  return (
    <div className="mt-5 flex gap-3 rounded-lg border border-amber-300/25 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100">
      <AlertTriangle aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
      <div>
        <p>{messages[status]}</p>
        {error ? <p className="mt-1 text-xs text-amber-200/75">Technischer Hinweis: {error}</p> : null}
      </div>
    </div>
  );
}
