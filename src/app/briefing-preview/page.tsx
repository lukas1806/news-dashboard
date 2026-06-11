import { AppShell } from "@/components/AppShell";
import { BriefingPreview } from "@/components/BriefingPreview";
import { loadBriefingSnapshot } from "@/lib/briefing-storage";
import type { BriefingDisplayStatus, BriefingSnapshot } from "@/types/briefing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FRESH_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const STALE_MAX_AGE_MS = 48 * 60 * 60 * 1000;

export default async function BriefingPreviewPage() {
  const result = await loadSnapshotSafely();
  const status = getDisplayStatus(result.snapshot);

  return (
    <AppShell>
      <BriefingPreview error={result.error} snapshot={status === "expired" ? null : result.snapshot} status={status} />
    </AppShell>
  );
}

async function loadSnapshotSafely(): Promise<{ snapshot: BriefingSnapshot | null; error?: string }> {
  try {
    return { snapshot: await loadBriefingSnapshot() };
  } catch (error) {
    console.error("Could not load briefing snapshot", error);
    return {
      snapshot: null,
      error: "Briefing-Speicher konnte nicht gelesen werden.",
    };
  }
}

function getDisplayStatus(snapshot: BriefingSnapshot | null): BriefingDisplayStatus {
  if (!snapshot) {
    return "unavailable";
  }

  const age = Date.now() - new Date(snapshot.generatedAt).getTime();

  if (age <= FRESH_MAX_AGE_MS) {
    return "fresh";
  }

  if (age <= STALE_MAX_AGE_MS) {
    return "stale";
  }

  return "expired";
}
