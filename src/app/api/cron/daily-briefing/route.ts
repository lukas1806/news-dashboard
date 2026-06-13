import { NextResponse } from "next/server";
import { generateAndSaveDailyBriefing } from "@/lib/briefing-generation";
import { categories } from "@/lib/news";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { snapshot, generated } = await generateAndSaveDailyBriefing();

    return NextResponse.json({
      ok: true,
      generated,
      generatedAt: snapshot.generatedAt,
      model: snapshot.model,
      counts: Object.fromEntries(categories.map(({ id }) => [id, snapshot.categories[id].length])),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not generate daily briefing" },
      { status: 500 },
    );
  }
}

function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}
