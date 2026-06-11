"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Bot, Clock3, ExternalLink } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
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
          Automatisch ausgewählte und verdichtete Meldungen. Diese Preview bleibt getrennt vom bestehenden Dashboard, bis die Qualität freigegeben ist.
        </p>

        {snapshot ? (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
              Erstellt {formatDateTime(snapshot.generatedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bot aria-hidden="true" className="h-3.5 w-3.5" />
              {snapshot.model}
            </span>
          </div>
        ) : null}
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
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Heute</p>
                <h2 className="mt-1 text-xl font-semibold text-ink">{getCategoryLabel(selectedCategory)}</h2>
              </div>
              <p className="text-sm text-muted">{items.length} Briefings</p>
            </div>

            {items.length ? (
              items.map((item) => <BriefingCard isMock={isMockSnapshot} item={item} key={item.id} />)
            ) : (
              <div className="rounded-lg border border-line bg-surface p-4 text-sm leading-6 text-slate-300">
                Die KI hat für diese Kategorie heute keine Meldung mit ausreichender Substanz freigegeben.
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}

function BriefingCard({ item, isMock }: { item: BriefingItem; isMock: boolean }) {
  return (
    <article className="rounded-lg border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span className="font-semibold uppercase tracking-[0.14em]">{isMock ? "Lokaler Mock" : "KI-generiert"}</span>
        {item.uncertainty !== "none" ? (
          <span className="rounded-full border border-amber-300/25 bg-amber-300/5 px-2 py-0.5 text-amber-100">
            Unsicherheit: {formatUncertainty(item.uncertainty)}
          </span>
        ) : null}
      </div>

      <h3 className="mt-3 text-xl font-semibold leading-snug text-ink">{item.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-line bg-canvas/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Warum wichtig?</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.whyImportant}</p>
        </div>
        <div className="rounded-md border border-line bg-canvas/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Konkrete Auswirkungen</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{item.concreteImpact}</p>
        </div>
      </div>

      {item.uncertaintyNote ? (
        <div className="mt-3 flex gap-2 rounded-md border border-amber-300/20 bg-amber-300/5 p-3 text-sm leading-6 text-amber-100">
          <AlertTriangle aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
          {item.uncertaintyNote}
        </div>
      ) : null}

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Quellen">
        {item.sources.map((source) => (
          <li key={source.articleId}>
            <a
              className="inline-flex items-center gap-1.5 rounded border border-line bg-panel/70 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-slate-500 hover:text-ink"
              href={source.url}
              rel="noreferrer"
              target="_blank"
            >
              {source.name} · {formatSourceTime(source.publishedAt)}
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

function StatusNotice({ status, error }: { status: BriefingDisplayStatus; error?: string }) {
  if (status === "fresh") {
    return null;
  }

  const messages: Record<Exclude<BriefingDisplayStatus, "fresh">, string> = {
    stale: "Der heutige Lauf ist fehlgeschlagen oder verspätet. Das letzte erfolgreiche Briefing wird noch bis maximal 48 Stunden angezeigt.",
    expired: "Das letzte erfolgreiche Briefing ist älter als 48 Stunden und wird nicht mehr angezeigt.",
    unavailable: "Noch kein Briefing verfügbar. OpenAI, Vercel Blob und der geschützte Cronjob müssen für den ersten Produktionslauf eingerichtet sein.",
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

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatSourceTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );
}

function formatUncertainty(value: BriefingItem["uncertainty"]): string {
  return { low: "niedrig", medium: "mittel", high: "hoch", none: "keine" }[value];
}
