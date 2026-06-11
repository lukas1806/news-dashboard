import { XMLParser } from "fast-xml-parser";
import { getActiveFeedSources, getFeedSources } from "@/data/feed-sources";
import { selectArticleCandidates } from "@/lib/article-candidates";
import { filterArticlesForFocus } from "@/lib/article-filter";
import type { NewsCategory } from "@/types/news";
import type { CandidateArticle, FeedHealth, FeedSource, LiveArticle } from "@/types/source";

type RssItem = {
  title?: string;
  link?: string | { href?: string };
  guid?: string | { "#text"?: string };
  pubDate?: string;
  isoDate?: string;
  description?: string;
  "content:encoded"?: string;
};

type AtomEntry = {
  title?: string;
  link?: string | { href?: string } | { href?: string }[];
  id?: string;
  updated?: string;
  published?: string;
  summary?: string;
  content?: string;
};

type ParsedFeed = {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
  feed?: {
    entry?: AtomEntry | AtomEntry[];
  };
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  trimValues: true,
});

export async function fetchLiveArticlesByCategory(category: NewsCategory, limit = 20): Promise<LiveArticle[]> {
  const sources = getActiveFeedSources().filter((source) => source.category === category);
  const settledArticleGroups = await Promise.allSettled(sources.map((source) => fetchFeedSource(source)));
  const articleGroups = settledArticleGroups.flatMap((result) => (result.status === "fulfilled" ? result.value : []));

  return filterArticlesForFocus(category, articleGroups)
    .sort((a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime())
    .slice(0, limit);
}

export async function fetchArticleCandidatesByCategory(category: NewsCategory): Promise<CandidateArticle[]> {
  const articles = await fetchLiveArticlesByCategory(category, 60);

  return selectArticleCandidates(category, articles);
}

export async function fetchFeedSource(source: FeedSource): Promise<LiveArticle[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  const response = await fetch(source.url, {
    headers: {
      "User-Agent": "Executive News Dashboard Phase 2 RSS Reader",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
    signal: controller.signal,
    next: {
      revalidate: 15 * 60,
    },
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`Feed ${source.id} returned ${response.status}`);
  }

  const xml = await response.text();
  const parsed = parser.parse(xml) as ParsedFeed;
  const rssItems = toArray(parsed.rss?.channel?.item);
  const atomEntries = toArray(parsed.feed?.entry);

  return [
    ...rssItems.map((item) => normalizeRssItem(item, source)),
    ...atomEntries.map((entry) => normalizeAtomEntry(entry, source)),
  ].filter(isCompleteArticle);
}

export async function checkFeedHealth(): Promise<FeedHealth[]> {
  const settledHealthChecks = await Promise.allSettled(
    getFeedSources().map(async (source) => {
      const articles = await fetchFeedSource(source);
      const latestPublishedAt = articles
        .map((article) => article.publishedAt)
        .filter((publishedAt): publishedAt is string => Boolean(publishedAt))
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

      return {
        sourceId: source.id,
        sourceName: source.name,
        category: source.category,
        status: source.status,
        url: source.url,
        ok: true,
        articleCount: articles.length,
        latestPublishedAt,
        checkedAt: new Date().toISOString(),
      } satisfies FeedHealth;
    }),
  );

  return settledHealthChecks.map((result, index) => {
    const source = getFeedSources()[index];

    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      sourceId: source.id,
      sourceName: source.name,
      category: source.category,
      status: source.status,
      url: source.url,
      ok: false,
      articleCount: 0,
      checkedAt: new Date().toISOString(),
      error: result.reason instanceof Error ? result.reason.message : "Unknown feed error",
    };
  });
}

function normalizeRssItem(item: RssItem, source: FeedSource): LiveArticle {
  const url = getTextLink(item.link);
  const title = cleanText(item.title);
  const publishedAt = normalizeDate(item.pubDate ?? item.isoDate);
  const excerpt = cleanText(stripHtml(item.description ?? item["content:encoded"]));

  return {
    id: createArticleId(source.id, url || title),
    sourceId: source.id,
    sourceName: source.name,
    category: source.category,
    title,
    url,
    publishedAt,
    excerpt,
  };
}

function normalizeAtomEntry(entry: AtomEntry, source: FeedSource): LiveArticle {
  const url = getAtomLink(entry.link);
  const title = cleanText(entry.title);
  const publishedAt = normalizeDate(entry.published ?? entry.updated);
  const excerpt = cleanText(stripHtml(entry.summary ?? entry.content));

  return {
    id: createArticleId(source.id, url || entry.id || title),
    sourceId: source.id,
    sourceName: source.name,
    category: source.category,
    title,
    url,
    publishedAt,
    excerpt,
  };
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function isCompleteArticle(article: LiveArticle): boolean {
  return Boolean(article.title && article.url);
}

function getTextLink(link: RssItem["link"]): string {
  if (!link) {
    return "";
  }

  return typeof link === "string" ? link : link.href ?? "";
}

function getAtomLink(link: AtomEntry["link"]): string {
  if (!link) {
    return "";
  }

  if (Array.isArray(link)) {
    return link.find((item) => item.href)?.href ?? "";
  }

  return typeof link === "string" ? link : link.href ?? "";
}

function normalizeDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function stripHtml(value: string | undefined): string {
  return value?.replace(/<[^>]*>/g, " ") ?? "";
}

function cleanText(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function createArticleId(sourceId: string, value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${sourceId}-${normalized}`.slice(0, 160);
}
