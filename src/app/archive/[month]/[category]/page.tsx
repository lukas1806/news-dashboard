import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bot, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { formatBriefingDateTime, formatBriefingSourceTime, formatBriefingUncertainty } from "@/lib/briefing-format";
import { loadArchiveMonth } from "@/lib/archive-storage";
import type { ArchiveCategory } from "@/types/archive";

export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ month: string; category: string }> }) {
  const { month, category } = await params; if (!/^\d{4}-\d{2}$/.test(month) || !["wirtschaft", "politik"].includes(category)) notFound();
  const archive = await loadArchiveMonth(month); const report = archive?.[category as ArchiveCategory]; if (!archive || !report) notFound();
  return <AppShell><main className="px-4 pb-28 pt-5 sm:px-6 sm:pt-8"><Link className="inline-flex min-h-10 items-center gap-2 text-sm text-muted" href={`/archive?year=${month.slice(0,4)}`}><ArrowLeft className="h-4 w-4" />Zurück zum Archiv</Link>
    <article className="mt-4 space-y-6"><header><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{monthLabel(month)} · {category}</p><h1 className="mt-4 break-words text-3xl font-semibold leading-tight text-ink sm:text-4xl">{report.title}</h1><p className="mt-4 text-base leading-7 text-slate-300">{report.teaser}</p><div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-violet-300/25 px-2.5 py-1 text-violet-100"><Bot className="mr-1 inline h-3.5 w-3.5" />KI-generiert · {archive.model}</span><span className="rounded-full border border-amber-300/20 px-2.5 py-1 text-amber-100">Unsicherheit: {formatBriefingUncertainty(report.uncertainty)}</span></div></header>
    <Section title="Wesentliche Entwicklungslinien"><ul className="list-disc space-y-2 pl-5">{report.developmentLines.map((line) => <li key={line}>{line}</li>)}</ul></Section>
    <Section title="Management-Kernaussagen"><ul className="list-disc space-y-2 pl-5">{report.managementSummary.map((line) => <li key={line}>{line}</li>)}</ul></Section>
    <Section title="Monatsrückblick"><p className="whitespace-pre-line">{report.briefingText}</p></Section><Section title="Warum wichtig?"><p>{report.whyImportant}</p></Section><Section title="Konkrete Auswirkungen"><p>{report.concreteImpact}</p></Section>
    {report.uncertaintyNote ? <section className="flex gap-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4 text-sm text-amber-100"><AlertTriangle className="mt-1 h-4 w-4 shrink-0" /><div><h2 className="font-semibold">Hinweis zur Unsicherheit</h2><p className="mt-1 leading-7">{report.uncertaintyNote}</p></div></section> : null}
    <Section title="Quellen"><ul className="space-y-2">{report.sources.map((source) => <li key={source.articleId}><a className="flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2" href={source.url} rel="noreferrer" target="_blank"><span className="min-w-0 break-words">{source.name} · {formatBriefingSourceTime(source.publishedAt)}</span><ExternalLink className="h-4 w-4 shrink-0" /></a></li>)}</ul><p className="mt-4 text-xs text-muted">Erzeugt {formatBriefingDateTime(archive.generatedAt)} · Modell {archive.model}</p></Section>
    </article></main></AppShell>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-3 border-t border-line pt-5 text-[0.95rem] leading-7 text-slate-300"><h2 className="text-base font-semibold text-ink">{title}</h2>{children}</section>; }
function monthLabel(month: string) { return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(new Date(`${month}-15T12:00:00Z`)); }
