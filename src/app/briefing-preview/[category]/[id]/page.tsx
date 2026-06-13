import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BriefingDetail } from "@/components/BriefingDetail";
import { loadBriefingSnapshot } from "@/lib/briefing-storage";
import type { NewsCategory } from "@/types/news";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BriefingDetailPageProps = {
  params: Promise<{ category: string; id: string }>;
};

export default async function BriefingDetailPage({ params }: BriefingDetailPageProps) {
  const { category, id } = await params;
  if (!isNewsCategory(category)) {
    notFound();
  }

  const snapshot = await loadBriefingSnapshot();
  if (!snapshot || Date.now() - new Date(snapshot.generatedAt).getTime() > 48 * 60 * 60 * 1000) {
    notFound();
  }

  const item = snapshot.categories[category].find((candidate) => candidate.id === decodeURIComponent(id));
  if (!item) {
    notFound();
  }

  return (
    <AppShell>
      <BriefingDetail item={item} model={snapshot.model} />
    </AppShell>
  );
}

function isNewsCategory(value: string): value is NewsCategory {
  return value === "wirtschaft" || value === "politik" || value === "handball";
}
