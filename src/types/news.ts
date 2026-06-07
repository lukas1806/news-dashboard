export type NewsCategory = "wirtschaft" | "politik" | "handball";

export type NewsType = "daily" | "weekly";

export type Source = {
  name: string;
  url: string;
};

export type Quote = {
  text: string;
  sourceName: string;
};

export type NewsItem = {
  id: string;
  type: NewsType;
  category: NewsCategory;
  title: string;
  relevanceScore: number;
  date: string;
  calendarWeek?: string;
  readingTimeMinutes: number;
  summary: string;
  whyImportant: string;
  managementSummary: string[];
  briefingText: string;
  concreteImpact: string;
  sources: Source[];
  tags: string[];
  relatedStoryIds?: string[];
  imageUrl?: string;
  quotes?: Quote[];
};
