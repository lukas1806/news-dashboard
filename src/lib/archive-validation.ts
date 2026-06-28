import type { ArchiveCategory, ArchiveCollectionState, ArchiveDailyInput, ArchiveIndex, ArchiveRunState, MonthlyArchive, MonthlyArchiveReport } from "@/types/archive";

const MONTH = /^\d{4}-\d{2}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T/;
const categories: ArchiveCategory[] = ["wirtschaft", "politik"];

export function parseMonthlyArchive(value: unknown): MonthlyArchive {
  const item = object(value);
  required(item.version === 1 && typeof item.month === "string" && MONTH.test(item.month));
  required(typeof item.periodStart === "string" && DATE.test(item.periodStart));
  required(typeof item.periodEnd === "string" && DATE.test(item.periodEnd));
  required(typeof item.generatedAt === "string" && ISO.test(item.generatedAt) && text(item.model));
  const result = item as unknown as MonthlyArchive;
  for (const category of categories) {
    if (result[category] !== undefined) validateReport(result[category], category);
  }
  required(Boolean(result.wirtschaft || result.politik));
  return result;
}

function validateReport(report: MonthlyArchiveReport, category: ArchiveCategory) {
  const item = object(report);
  required(item.category === category && text(item.id) && text(item.title) && text(item.teaser));
  required(arrayOfText(item.developmentLines, 3, 5) && arrayOfText(item.managementSummary, 3, 5));
  required(text(item.briefingText) && text(item.whyImportant) && text(item.concreteImpact));
  required(["none", "low", "medium", "high"].includes(String(item.uncertainty)));
  required(Array.isArray(item.sources) && item.sources.length > 0);
  for (const source of item.sources as MonthlyArchiveReport["sources"]) {
    required(text(source.articleId) && text(source.name) && validUrl(source.url) && typeof source.publishedAt === "string" && ISO.test(source.publishedAt));
  }
}

export function parseArchiveInput(value: unknown): ArchiveDailyInput {
  const item = object(value);
  required(item.version === 1 && typeof item.date === "string" && DATE.test(item.date));
  required(typeof item.collectedAt === "string" && ISO.test(item.collectedAt));
  const groups = object(item.categories);
  required(Object.keys(groups).every((key) => categories.includes(key as ArchiveCategory)));
  for (const category of categories) required(Array.isArray(groups[category]));
  return item as unknown as ArchiveDailyInput;
}

export function parseArchiveIndex(value: unknown): ArchiveIndex {
  const item = object(value);
  required(item.version === 1 && Array.isArray(item.months));
  for (const entry of item.months as ArchiveIndex["months"]) required(MONTH.test(entry.month) && ISO.test(entry.generatedAt) && entry.categories.every((c) => categories.includes(c)));
  return item as unknown as ArchiveIndex;
}

export function parseArchiveRunState(value: unknown): ArchiveRunState {
  const item = object(value); required(item.version === 1); const months = object(item.months);
  for (const [month, raw] of Object.entries(months)) { const state = object(raw); required(MONTH.test(month) && Number.isInteger(state.attempts) && Number(state.attempts) >= 0 && typeof state.processed === "boolean"); if (state.lastAttemptDate !== undefined) required(typeof state.lastAttemptDate === "string" && DATE.test(state.lastAttemptDate)); }
  return item as unknown as ArchiveRunState;
}

export function parseArchiveCollectionState(value: unknown): ArchiveCollectionState {
  const item = object(value); required(item.version === 1 && typeof item.firstCompleteMonth === "string" && MONTH.test(item.firstCompleteMonth) && typeof item.initializedAt === "string" && ISO.test(item.initializedAt)); return item as unknown as ArchiveCollectionState;
}

function object(value: unknown): Record<string, any> { required(typeof value === "object" && value !== null && !Array.isArray(value)); return value as Record<string, any>; }
function required(ok: unknown): asserts ok { if (!ok) throw new Error("Invalid archive data"); }
function text(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function arrayOfText(value: unknown, min: number, max: number) { return Array.isArray(value) && value.length >= min && value.length <= max && value.every(text); }
function validUrl(value: unknown) { try { return typeof value === "string" && ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; } }
