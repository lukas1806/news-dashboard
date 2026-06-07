import type { NewsCategory } from "@/types/news";

export type FeedSourceStatus = "active" | "candidate";

export type FeedSource = {
  id: string;
  name: string;
  category: NewsCategory;
  url: string;
  free: true;
  official: boolean;
  status: FeedSourceStatus;
  language: "de" | "en";
  notes?: string;
};

export type LiveArticle = {
  id: string;
  sourceId: string;
  sourceName: string;
  category: NewsCategory;
  title: string;
  url: string;
  publishedAt?: string;
  excerpt?: string;
};
