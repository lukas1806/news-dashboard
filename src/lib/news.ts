import type { NewsCategory } from "@/types/news";

export const categories: { id: NewsCategory; label: string }[] = [
  { id: "wirtschaft", label: "Wirtschaft" },
  { id: "politik", label: "Politik" },
  { id: "handball", label: "Handball" },
];

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
