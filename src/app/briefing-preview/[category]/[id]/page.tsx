import { permanentRedirect } from "next/navigation";

type BriefingDetailPageProps = {
  params: Promise<{ category: string; id: string }>;
};

export default async function BriefingDetailPage({ params }: BriefingDetailPageProps) {
  const { category, id } = await params;
  permanentRedirect(`/briefing/${encodeURIComponent(category)}/${encodeURIComponent(id)}`);
}
