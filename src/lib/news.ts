import { newsItems } from "@/data/news";
import type { NewsCategory, NewsItem } from "@/types/news";

export const categories: { id: NewsCategory; label: string }[] = [
  { id: "wirtschaft", label: "Wirtschaft" },
  { id: "politik", label: "Politik" },
  { id: "handball", label: "Handball" },
];

export function sortByRelevance(items: NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => b.relevanceScore - a.relevanceScore);
}

export function getNewsById(id: string): NewsItem | undefined {
  return newsItems.find((item) => item.id === id);
}

export function getDailyNewsByCategory(category: NewsCategory): NewsItem[] {
  return sortByRelevance(newsItems.filter((item) => item.type === "daily" && item.category === category));
}

export function getWeeklyNewsByCategory(category: NewsCategory): NewsItem[] {
  return sortByRelevance(newsItems.filter((item) => item.type === "weekly" && item.category === category));
}

export function getWeeklyArchiveItems(): NewsItem[] {
  return sortByRelevance(newsItems.filter((item) => item.type === "weekly"));
}

export function getArchiveGroups(): { calendarWeek: string; items: NewsItem[] }[] {
  const grouped = getWeeklyArchiveItems().reduce<Map<string, NewsItem[]>>((groups, item) => {
    const week = item.calendarWeek ?? "Ohne Kalenderwoche";
    groups.set(week, [...(groups.get(week) ?? []), item]);
    return groups;
  }, new Map());

  return Array.from(grouped.entries()).map(([calendarWeek, items]) => ({
    calendarWeek,
    items: sortByRelevance(items),
  }));
}

export function getCategoryLabel(category: NewsCategory): string {
  return categories.find((item) => item.id === category)?.label ?? category;
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function getItemTimeLabel(item: NewsItem): string {
  return item.type === "weekly" && item.calendarWeek ? item.calendarWeek : formatDate(item.date);
}
