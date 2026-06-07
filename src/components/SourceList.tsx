import { ExternalLink } from "lucide-react";
import type { Source } from "@/types/news";

type SourceListProps = {
  sources: Source[];
  compact?: boolean;
};

export function SourceList({ sources, compact = false }: SourceListProps) {
  return (
    <ul className={`flex flex-wrap ${compact ? "gap-x-2 gap-y-1" : "gap-2"}`} aria-label="Quellen">
      {sources.map((source) => (
        <li key={`${source.name}-${source.url}`}>
          <a
            className={`inline-flex items-center gap-1 rounded border border-line bg-panel/70 text-slate-300 transition hover:border-slate-500 hover:text-ink ${
              compact ? "px-2 py-1 text-[0.72rem]" : "px-2.5 py-1.5 text-xs"
            }`}
            href={source.url}
            rel="noreferrer"
            target="_blank"
          >
            {source.name}
            <ExternalLink aria-hidden="true" className="h-3 w-3" />
          </a>
        </li>
      ))}
    </ul>
  );
}
