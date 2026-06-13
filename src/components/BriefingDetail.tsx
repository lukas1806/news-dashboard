"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bot, Clock3, ExternalLink } from "lucide-react";
import {
  formatBriefingDateTime,
  formatBriefingSourceTime,
  formatBriefingUncertainty,
  getBriefingReadingTime,
} from "@/lib/briefing-format";
import { getCategoryLabel } from "@/lib/news";
import type { BriefingItem } from "@/types/briefing";

export function BriefingDetail({ item, model }: { item: BriefingItem; model: string }) {
  const router = useRouter();

  return (
    <main className="px-4 pb-28 pt-5 sm:px-6 sm:pt-8">
      <button
        className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-muted transition hover:text-ink"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/briefing-preview");
          }
        }}
        type="button"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Zurück zu den Briefings
      </button>

      <article className="mt-4 space-y-6">
        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-semibold uppercase tracking-[0.18em]">{getCategoryLabel(item.category)}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
              {getBriefingReadingTime(item)} Min
            </span>
            <span aria-hidden="true">·</span>
            <span>Beitrag erstellt {formatBriefingDateTime(item.createdAt)}</span>
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-ink sm:text-4xl">{item.title}</h1>
          <p className="mt-4 text-base leading-7 text-slate-300">{item.teaser}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 bg-violet-300/5 px-2.5 py-1 text-violet-100">
              <Bot aria-hidden="true" className="h-3.5 w-3.5" />
              KI-generiert · {model}
            </span>
            {item.uncertainty !== "none" ? (
              <span className="rounded-full border border-amber-300/25 bg-amber-300/5 px-2.5 py-1 text-amber-100">
                Unsicherheit: {formatBriefingUncertainty(item.uncertainty)}
              </span>
            ) : null}
          </div>
        </header>

        <DetailSection title="Beschreibung">
          <p>{item.summary}</p>
        </DetailSection>

        <DetailSection title="Warum wichtig?">
          <p>{item.whyImportant}</p>
        </DetailSection>

        <DetailSection title="Konkrete Auswirkungen">
          <p>{item.concreteImpact}</p>
        </DetailSection>

        {item.uncertaintyNote ? (
          <section className="flex gap-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4 text-sm leading-7 text-amber-100">
            <AlertTriangle aria-hidden="true" className="mt-1 h-4 w-4 shrink-0" />
            <div>
              <h2 className="font-semibold">Hinweis zur Unsicherheit</h2>
              <p className="mt-1">{item.uncertaintyNote}</p>
            </div>
          </section>
        ) : null}

        <DetailSection title="Quellen">
          <ul className="space-y-2">
            {item.sources.map((source) => (
              <li key={source.articleId}>
                <a
                  className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 transition hover:border-slate-500 hover:text-ink"
                  href={source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span>{source.name} · {formatBriefingSourceTime(source.publishedAt)}</span>
                  <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </DetailSection>
      </article>
    </main>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-t border-line pt-5 text-[0.95rem] leading-7 text-slate-300">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
