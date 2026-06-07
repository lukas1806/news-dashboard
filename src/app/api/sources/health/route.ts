import { NextResponse } from "next/server";
import { checkFeedHealth } from "@/lib/rss";

export async function GET() {
  const sources = await checkFeedHealth();

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    ok: sources.every((source) => source.ok || source.status === "candidate"),
    sources,
  });
}
