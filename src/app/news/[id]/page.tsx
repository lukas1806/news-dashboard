import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { NewsDetail } from "@/components/NewsDetail";
import { getNewsById } from "@/lib/news";

type NewsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NewsPage({ params }: NewsPageProps) {
  const { id } = await params;
  const item = getNewsById(id);

  if (!item) {
    notFound();
  }

  return (
    <AppShell>
      <NewsDetail item={item} />
    </AppShell>
  );
}
