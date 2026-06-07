export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 9 ? "border-amber-300/50 text-amber-100" : score >= 8 ? "border-blue-300/45 text-blue-100" : "border-slate-400/35 text-slate-200";

  return (
    <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-semibold tabular-nums ${tone}`}>
      {score.toFixed(1)}/10
    </span>
  );
}
