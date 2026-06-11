import type { NewsCategory } from "@/types/news";

export type BriefingUncertainty = "none" | "low" | "medium" | "high";

export type BriefingSource = {
  articleId: string;
  name: string;
  url: string;
  publishedAt: string;
};

export type BriefingItem = {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  whyImportant: string;
  concreteImpact: string;
  uncertainty: BriefingUncertainty;
  uncertaintyNote?: string;
  sources: BriefingSource[];
};

export type BriefingSnapshot = {
  version: 1;
  generatedAt: string;
  model: string;
  categories: Record<NewsCategory, BriefingItem[]>;
};

export type BriefingDisplayStatus = "fresh" | "stale" | "expired" | "unavailable";
