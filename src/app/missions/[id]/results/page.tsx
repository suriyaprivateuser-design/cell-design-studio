import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getMission, MISSIONS } from "@/content/missions";
import { getMissionRules } from "@/simulation/missions";
import { ResultsScreen } from "@/components/results/ResultsScreen";
import { PageLoading } from "@/components/PageLoading";

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ id: m.id }));
}

export default function ResultsPage({ params }: PageProps<"/missions/[id]/results">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Results params={params} />
    </Suspense>
  );
}

async function Results({ params }: { params: PageProps<"/missions/[id]/results">["params"] }) {
  const { id } = await params;
  if (!getMission(id) || !getMissionRules(id)) notFound();
  return <ResultsScreen missionId={id} />;
}
