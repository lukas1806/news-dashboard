import { NextResponse } from "next/server";
import { categories } from "@/lib/news";
import { fetchLiveArticlesByCategory } from "@/lib/rss";
import type { NewsCategory } from "@/types/news";

type LiveFeedRouteProps = {
  params: Promise<unknown>;
};

export async function GET(_request: Request, { params }: LiveFeedRouteProps) {
  const { category } = (await params) as { category?: string };

  if (!category || !isNewsCategory(category)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 404 });
  }

  try {
    const articles = await fetchLiveArticlesByCategory(category);
    return NextResponse.json({
      category,
      count: articles.length,
      articles,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not fetch live articles",
      },
      { status: 502 },
    );
  }
}

function isNewsCategory(value: string): value is NewsCategory {
  return categories.some((category) => category.id === value);
}
