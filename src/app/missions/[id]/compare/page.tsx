import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MISSIONS, getMission } from "@/content/missions";
import { getTissue } from "@/content/tissues";
import { CompareScreen } from "@/components/compare/CompareScreen";
import { PageLoading } from "@/components/PageLoading";

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ id: m.id }));
}

export default function ComparePage({ params }: PageProps<"/missions/[id]/compare">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Compare params={params} />
    </Suspense>
  );
}

async function Compare({ params }: { params: PageProps<"/missions/[id]/compare">["params"] }) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission || !getTissue(mission.tissueId)?.reference) notFound();
  return <CompareScreen missionId={id} />;
}
