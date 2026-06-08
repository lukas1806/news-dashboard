import type { NewsCategory } from "@/types/news";

export type RawReviewAction = "keep" | "higher" | "lower" | "exclude";

export type RawReviewItem = {
  id: string;
  title: string;
  category: NewsCategory;
  sourceName: string;
  action: RawReviewAction;
  updatedAt: string;
};

export type RawReviewMap = Record<string, RawReviewItem>;

export const RAW_REVIEW_STORAGE_KEY = "executive-news-dashboard.raw-review.v1";
export const RAW_REVIEW_UPDATED_EVENT = "raw-review-updated";
