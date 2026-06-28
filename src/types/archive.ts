import type { BriefingSource, BriefingUncertainty } from "@/types/briefing";

export type ArchiveCategory = "wirtschaft" | "politik";

export type ArchiveInputItem = {
  id: string;
  category: ArchiveCategory;
  title: string;
  teaser: string;
  summary: string;
  whyImportant: string;
  concreteImpact: string;
  uncertainty: BriefingUncertainty;
  uncertaintyNote?: string;
  sources: BriefingSource[];
};

export type ArchiveDailyInput = {
  version: 1;
  date: string;
  collectedAt: string;
  categories: Record<ArchiveCategory, ArchiveInputItem[]>;
};

export type MonthlyArchiveReport = {
  id: string;
  category: ArchiveCategory;
  title: string;
  teaser: string;
  developmentLines: string[];
  managementSummary: string[];
  briefingText: string;
  whyImportant: string;
  concreteImpact: string;
  uncertainty: BriefingUncertainty;
  uncertaintyNote?: string;
  sources: BriefingSource[];
};

export type MonthlyArchive = {
  version: 1;
  month: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  model: string;
  wirtschaft?: MonthlyArchiveReport;
  politik?: MonthlyArchiveReport;
};

export type ArchiveIndexEntry = {
  month: string;
  generatedAt: string;
  categories: ArchiveCategory[];
};

export type ArchiveIndex = { version: 1; months: ArchiveIndexEntry[] };

export type ArchiveRunState = {
  version: 1;
  months: Record<string, { attempts: number; lastAttemptDate?: string; processed: boolean }>;
};

export type ArchiveCollectionState = { version: 1; firstCompleteMonth: string; initializedAt: string };
