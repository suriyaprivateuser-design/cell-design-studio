import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PageLoading } from "@/components/PageLoading";
import { getMission, MISSIONS } from "@/content/missions";
import { getMissionRules } from "@/simulation/missions";
import { StudioScreen } from "@/components/studio/StudioScreen";
import { ButtonLink, Container } from "@/components/ui";

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ id: m.id }));
}

export default function StudioPage({ params }: PageProps<"/missions/[id]/studio">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Studio params={params} />
    </Suspense>
  );
}

async function Studio({ params }: { params: PageProps<"/missions/[id]/studio">["params"] }) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) notFound();

  if (mission.studio !== "available" || !getMissionRules(id)) {
    return (
      <Container className="py-16 text-center">
        <p className="text-lg font-semibold text-ink">สตูดิโอของภารกิจ {mission.number} ยังไม่เปิด</p>
        <p className="mt-2 text-sm text-muted">ภารกิจนี้จะเปิดใน Phase {mission.plannedPhase}</p>
        <ButtonLink href="/missions" variant="secondary" className="mt-6">
          กลับไปเลือกภารกิจ
        </ButtonLink>
      </Container>
    );
  }

  return <StudioScreen missionId={id} />;
}
