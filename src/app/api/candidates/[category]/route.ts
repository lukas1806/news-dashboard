import { NextResponse } from "next/server";
import { categories } from "@/lib/news";
import { fetchArticleCandidatesByCategory } from "@/lib/rss";
import type { NewsCategory } from "@/types/news";

type CandidateRouteProps = {
  params: Promise<unknown>;
};

export async function GET(_request: Request, { params }: CandidateRouteProps) {
  const { category } = (await params) as { category?: string };

  if (!category || !isNewsCategory(category)) {
    return NextResponse.json({ error: "Unknown category" }, { status: 404 });
  }

  try {
    const candidates = await fetchArticleCandidatesByCategory(category);

    return NextResponse.json({
      category,
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Could not fetch article candidates",
      },
      { status: 502 },
    );
  }
}

function isNewsCategory(value: string): value is NewsCategory {
  return categories.some((category) => category.id === value);
}
