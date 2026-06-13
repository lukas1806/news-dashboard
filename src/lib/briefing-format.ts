import type { BriefingItem } from "@/types/briefing";

export function getBriefingReadingTime(item: BriefingItem): number {
  const words = [item.summary, item.whyImportant, item.concreteImpact, item.uncertaintyNote]
    .filter(Boolean)
    .join(" ")
    .trim()
    .split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 180));
}

export function formatBriefingDateTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatBriefingSourceTime(value: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(
    new Date(value),
  );
}

export function formatBriefingUncertainty(value: BriefingItem["uncertainty"]): string {
  return { low: "niedrig", medium: "mittel", high: "hoch", none: "keine" }[value];
}
