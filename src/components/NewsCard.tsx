import Link from "next/link";
import { ChevronRight, Clock } from "lucide-react";
import { getCategoryLabel, getItemTimeLabel } from "@/lib/news";
import type { NewsItem } from "@/types/news";
import { ScoreBadge } from "@/components/ScoreBadge";
import { SourceList } from "@/components/SourceList";
import { TagList } from "@/components/TagList";

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className="group rounded-lg border border-line bg-surface p-4 transition hover:-translate-y-0.5 hover:border-slate-500/45 hover:bg-panel">
      {item.imageUrl ? (
        <img alt="" className="mb-4 aspect-[16/9] w-full rounded-md object-cover" src={item.imageUrl} />
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted">
            <span className="font-semibold uppercase tracking-[0.16em]">{getCategoryLabel(item.category)}</span>
            <span aria-hidden="true">·</span>
            <span>{getItemTimeLabel(item)}</span>
          </div>
          <ScoreBadge score={item.relevanceScore} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-snug text-ink">
            <Link className="rounded focus:outline-none focus:ring-2 focus:ring-slate-500/60" href={`/news/${item.id}`}>
              {item.title}
            </Link>
          </h3>
          <p className="text-sm leading-6 text-slate-300">{item.summary}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <Clock aria-hidden="true" className="h-3.5 w-3.5" />
          <span>{item.readingTimeMinutes} Min</span>
        </div>

        {item.type === "weekly" ? <TagList tags={item.tags} /> : null}

        <div className="flex items-end justify-between gap-3 pt-1">
          <SourceList compact sources={item.sources} />
          <Link
            aria-label={`Detailansicht für ${item.title}`}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line text-muted transition hover:border-slate-500 hover:text-ink focus:outline-none focus:ring-2 focus:ring-slate-500/60"
            href={`/news/${item.id}`}
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
