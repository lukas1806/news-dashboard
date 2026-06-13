import { categories } from "@/lib/news";
import type { BriefingItem, BriefingSnapshot, BriefingUncertainty } from "@/types/briefing";
import type { NewsCategory } from "@/types/news";

const uncertaintyLevels: BriefingUncertainty[] = ["none", "low", "medium", "high"];

export function parseBriefingSnapshot(value: unknown): BriefingSnapshot {
  if (!isRecord(value) || value.version !== 1 || !isString(value.generatedAt) || !isString(value.model)) {
    throw new Error("Invalid briefing snapshot metadata");
  }

  if (Number.isNaN(new Date(value.generatedAt).getTime()) || !isRecord(value.categories)) {
    throw new Error("Invalid briefing snapshot date or categories");
  }

  const generatedAt = value.generatedAt;
  const rawCategories = value.categories;

  const parsedCategories = Object.fromEntries(
    categories.map(({ id }) => {
      const items = rawCategories[id];

      if (!Array.isArray(items) || items.length > 5) {
        throw new Error(`Invalid briefing items for ${id}`);
      }

      return [id, items.map((item) => parseBriefingItem(id, item, generatedAt))];
    }),
  ) as Record<NewsCategory, BriefingItem[]>;

  return {
    version: 1,
    generatedAt,
    model: value.model,
    categories: parsedCategories,
  };
}

function parseBriefingItem(category: NewsCategory, value: unknown, snapshotGeneratedAt: string): BriefingItem {
  if (
    !isRecord(value) ||
    !isString(value.id) ||
    !isString(value.title) ||
    !isString(value.summary) ||
    !isString(value.whyImportant) ||
    !isString(value.concreteImpact) ||
    !isUncertainty(value.uncertainty) ||
    !Array.isArray(value.sources) ||
    !value.sources.length
  ) {
    throw new Error(`Invalid briefing item for ${category}`);
  }

  return {
    id: value.id,
    category,
    title: value.title,
    teaser: isString(value.teaser) && value.teaser.trim() ? value.teaser : createLegacyTeaser(value.summary),
    summary: value.summary,
    whyImportant: value.whyImportant,
    concreteImpact: value.concreteImpact,
    createdAt: isValidDateString(value.createdAt) ? value.createdAt : snapshotGeneratedAt,
    relevanceScore: isValidScore(value.relevanceScore) ? value.relevanceScore : 50,
    uncertainty: value.uncertainty,
    uncertaintyNote: isString(value.uncertaintyNote) && value.uncertaintyNote ? value.uncertaintyNote : undefined,
    sources: value.sources.map((source) => {
      if (
        !isRecord(source) ||
        !isString(source.articleId) ||
        !isString(source.name) ||
        !isString(source.url) ||
        !isString(source.publishedAt)
      ) {
        throw new Error(`Invalid briefing source for ${category}`);
      }

      return {
        articleId: source.articleId,
        name: source.name,
        url: source.url,
        publishedAt: source.publishedAt,
      };
    }),
  };
}

function createLegacyTeaser(summary: string): string {
  const firstSentence = summary.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return firstSentence || summary.slice(0, 180).trim();
}

function isValidDateString(value: unknown): value is string {
  return isString(value) && !Number.isNaN(new Date(value).getTime());
}

function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isUncertainty(value: unknown): value is BriefingUncertainty {
  return typeof value === "string" && uncertaintyLevels.includes(value as BriefingUncertainty);
}
