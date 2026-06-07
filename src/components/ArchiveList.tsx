import { Archive } from "lucide-react";
import { NewsCard } from "@/components/NewsCard";
import { getArchiveGroups } from "@/lib/news";

export function ArchiveList() {
  const groups = getArchiveGroups();
  const totalItems = groups.reduce((count, group) => count + group.items.length, 0);

  return (
    <main className="px-4 pb-28 pt-6 sm:px-6 sm:pt-8">
      <header className="space-y-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-surface">
          <Archive aria-hidden="true" className="h-5 w-5 text-slate-200" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">Nur Wochenrückblicke</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink sm:text-4xl">Archiv</h1>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-300">
          Strategische Rückblicke nach Kalenderwoche. Tagesnews werden hier bewusst nicht angezeigt.
        </p>
        <p className="text-sm text-muted">{totalItems} Wochenbriefings</p>
      </header>

      <div className="mt-7 space-y-8">
        {groups.map((group) => (
          <section className="space-y-3" key={group.calendarWeek}>
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h2 className="text-lg font-semibold text-ink">{group.calendarWeek}</h2>
              <span className="text-sm text-muted">{group.items.length} Einträge</span>
            </div>
            <div className="space-y-3">
              {group.items.map((item) => (
                <NewsCard item={item} key={item.id} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
