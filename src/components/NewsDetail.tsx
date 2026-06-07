import Link from "next/link";
import { ArrowLeft, Clock, Quote } from "lucide-react";
import { getCategoryLabel, getItemTimeLabel } from "@/lib/news";
import type { NewsItem } from "@/types/news";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SourceList } from "@/components/SourceList";
import { TagList } from "@/components/TagList";

export function NewsDetail({ item }: { item: NewsItem }) {
  return (
    <main className="px-4 pb-28 pt-5 sm:px-6 sm:pt-8">
      <Link className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-ink" href="/">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Zurück
      </Link>

      <article className="mt-4 space-y-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-semibold uppercase tracking-[0.18em]">{getCategoryLabel(item.category)}</span>
            <span aria-hidden="true">·</span>
            <span>{getItemTimeLabel(item)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
              {item.readingTimeMinutes} Min
            </span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight text-ink sm:text-4xl">{item.title}</h1>
          <div className="flex items-center gap-3">
            <ScoreBadge score={item.relevanceScore} />
            <span className="text-sm text-muted">{item.type === "weekly" ? "Wochenrückblick" : "Tagesnews"}</span>
          </div>
          <p className="text-base leading-7 text-slate-300">{item.summary}</p>
        </header>

        <DetailSection title="Warum wichtig">
          <p>{item.whyImportant}</p>
        </DetailSection>

        <DetailSection title="Management Summary">
          <ul className="space-y-3">
            {item.managementSummary.map((point) => (
              <li className="flex gap-3" key={point}>
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection title="3-5-Minuten-Lesetext">
          <p>{item.briefingText}</p>
        </DetailSection>

        {item.quotes?.length ? (
          <DetailSection title="Direkte Zitate">
            <div className="space-y-3">
              {item.quotes.map((quote) => (
                <blockquote className="rounded-lg border border-line bg-surface p-4" key={`${quote.sourceName}-${quote.text}`}>
                  <Quote aria-hidden="true" className="mb-3 h-4 w-4 text-muted" />
                  <p className="font-serif text-lg leading-7 text-ink">"{quote.text}"</p>
                  <footer className="mt-3 text-sm text-muted">{quote.sourceName}</footer>
                </blockquote>
              ))}
            </div>
          </DetailSection>
        ) : null}

        <DetailSection title="Was bedeutet das konkret?">
          <p>{item.concreteImpact}</p>
        </DetailSection>

        {item.type === "weekly" ? (
          <DetailSection title="Tags und verknüpfte Storys">
            <TagList tags={item.tags} />
            {item.relatedStoryIds?.length ? (
              <p className="mt-3 text-sm text-muted">Verknüpfte Demo-Storys: {item.relatedStoryIds.join(", ")}</p>
            ) : null}
          </DetailSection>
        ) : null}

        <DetailSection title="Quellen">
          <SourceList sources={item.sources} />
        </DetailSection>
      </article>
    </main>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-line pt-5 text-sm leading-7 text-slate-300">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
