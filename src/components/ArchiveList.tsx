import Link from "next/link";
import { Archive, Bot, Clock3 } from "lucide-react";
import { formatBriefingUncertainty } from "@/lib/briefing-format";
import type { MonthlyArchive } from "@/types/archive";

export function ArchiveList({ archives, year }: { archives: MonthlyArchive[]; year: number }) {
  const years = Array.from(new Set([year, ...archives.map((item) => Number(item.month.slice(0, 4)))] )).sort((a, b) => b - a);
  const visible = archives.filter((item) => item.month.startsWith(`${year}-`));
  return <main className="px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
    <header className="space-y-3">
      <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface"><Archive className="h-5 w-5 text-slate-200" /></div>
      <div><p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Monatsrückblicke</p><h1 className="mt-2 text-3xl font-semibold text-ink sm:text-4xl">Archiv</h1></div>
      <p className="max-w-xl text-sm leading-6 text-slate-300">Die prägenden Entwicklungen aus Wirtschaft und Politik, dauerhaft nach Monaten verdichtet.</p>
      <nav className="flex flex-wrap gap-2" aria-label="Jahresauswahl">{years.map((value) => <Link className={`rounded-md border px-3 py-2 text-sm ${value === year ? "border-slate-400 bg-slate-200 text-slate-950" : "border-line text-muted"}`} href={`/archive?year=${value}`} key={value}>{value}</Link>)}</nav>
    </header>
    {visible.length ? <div className="mt-8 space-y-9">{visible.map((archive) => <section key={archive.month}><h2 className="border-b border-line pb-2 text-lg font-semibold text-ink">{monthName(archive.month)}</h2><div className="mt-3 grid gap-3">{(["wirtschaft", "politik"] as const).map((category) => { const report = archive[category]; if (!report) return null; const minutes = Math.max(3, Math.ceil(report.briefingText.split(/\s+/).length / 180)); return <Link className="min-w-0 rounded-xl border border-line bg-panel p-4 transition hover:border-slate-500" href={`/archive/${archive.month}/${category}`} key={category}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted"><span className="font-semibold uppercase tracking-[0.16em]">{category}</span><span>·</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{minutes} Min</span><span>·</span><span>{report.sources.length} Quellen</span></div>
          <h3 className="mt-3 break-words text-xl font-semibold text-ink">{report.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{report.teaser}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full border border-violet-300/25 px-2.5 py-1 text-violet-100"><Bot className="mr-1 inline h-3.5 w-3.5" />KI-generiert</span><span className="rounded-full border border-amber-300/20 px-2.5 py-1 text-amber-100">Unsicherheit: {formatBriefingUncertainty(report.uncertainty)}</span></div>
        </Link>; })}</div></section>)}</div> : <section className="mt-10 rounded-xl border border-dashed border-line bg-panel p-6"><h2 className="text-lg font-semibold text-ink">Noch keine Monatsrückblicke</h2><p className="mt-2 text-sm leading-6 text-muted">Das Archiv startet bewusst leer. Nach dem ersten vollständig gesammelten Monat erscheinen hier Rückblicke für Wirtschaft und Politik, sofern die Qualitätsschwelle erreicht wurde.</p></section>}
  </main>;
}

function monthName(month: string) { return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric", timeZone: "Europe/Berlin" }).format(new Date(`${month}-15T12:00:00Z`)); }
