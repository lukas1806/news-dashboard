import { getBerlinDateParts, nextMonth, previousMonth, shouldAttemptArchive } from "@/lib/archive-calendar";
import { qualifyArchiveInputs } from "@/lib/archive-inputs";
import { generateMonthlyArchive } from "@/lib/archive-provider";
import * as storage from "@/lib/archive-storage";
import type { ArchiveIndex, MonthlyArchive } from "@/types/archive";

export async function collectAndProcessArchive(snapshot: import("@/types/briefing").BriefingSnapshot, now = new Date()) {
  const date = getBerlinDateParts(now).date;
  let collection = await storage.loadArchiveCollectionState();
  if (!collection) { collection = { version: 1, firstCompleteMonth: nextMonth(date.slice(0, 7)), initializedAt: now.toISOString() }; await storage.saveArchiveCollectionState(collection); }
  await storage.saveArchiveInput((await import("@/lib/archive-inputs")).createArchiveInput(snapshot, date));
  return processArchiveMonth(now, collection.firstCompleteMonth);
}

export type ArchiveOperationDependencies = {
  storage: typeof storage;
  generate: typeof generateMonthlyArchive;
};
const defaults: ArchiveOperationDependencies = { storage, generate: generateMonthlyArchive };

export async function processArchiveMonth(now: Date, firstCompleteMonth: string, dependencies: ArchiveOperationDependencies = defaults) {
  const store = dependencies.storage;
  const month = previousMonth(now); const run = await store.loadArchiveRunState(); const monthState = run.months[month];
  const existing = await store.loadArchiveMonth(month);
  if (existing) { await repairIndex(existing, store); run.months[month] = { attempts: monthState?.attempts ?? 1, lastAttemptDate: monthState?.lastAttemptDate, processed: true }; await store.saveArchiveRunState(run); return { status: "existing" as const }; }
  if (month < firstCompleteMonth) return { status: "incomplete" as const };
  if (!shouldAttemptArchive(now, monthState)) return { status: "skipped" as const };
  run.months[month] = { attempts: (monthState?.attempts ?? 0) + 1, lastAttemptDate: getBerlinDateParts(now).date, processed: false };
  await store.saveArchiveRunState(run);
  const qualified = qualifyArchiveInputs(await store.listArchiveInputs(month));
  if (!qualified.wirtschaft.length && !qualified.politik.length) { run.months[month].processed = true; await store.saveArchiveRunState(run); return { status: "empty" as const }; }
  const archive = await dependencies.generate(month, qualified);
  await store.saveArchiveMonth(archive); await repairIndex(archive, store); run.months[month].processed = true; await store.saveArchiveRunState(run);
  cleanup(now, store).catch(() => undefined);
  return { status: "generated" as const };
}

async function repairIndex(archive: MonthlyArchive, store = storage) {
  const index = await store.loadArchiveIndex(); const entry = { month: archive.month, generatedAt: archive.generatedAt, categories: (["wirtschaft", "politik"] as const).filter((category) => Boolean(archive[category])) };
  const next: ArchiveIndex = { version: 1, months: [entry, ...index.months.filter((item) => item.month !== archive.month)].sort((a, b) => b.month.localeCompare(a.month)) };
  await store.saveArchiveIndex(next);
}

async function cleanup(now: Date, store = storage) { const before = new Date(now.getTime() - 45 * 86400000).toISOString().slice(0, 10); await store.cleanupArchiveInputs(before); }
