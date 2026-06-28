import { AppShell } from "@/components/AppShell";
import { ArchiveList } from "@/components/ArchiveList";
import { loadArchiveIndex, loadArchiveMonth } from "@/lib/archive-storage";

export const dynamic = "force-dynamic";

export default async function ArchivePage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const params = await searchParams;
  const currentYear = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Berlin" }).format(new Date()));
  const year = /^\d{4}$/.test(params.year ?? "") ? Number(params.year) : currentYear;
  const index = await loadArchiveIndex();
  const archives = (await Promise.all(index.months.map((entry) => loadArchiveMonth(entry.month)))).filter((item): item is NonNullable<typeof item> => Boolean(item));
  return (
    <AppShell>
      <ArchiveList archives={archives} year={year} />
    </AppShell>
  );
}
