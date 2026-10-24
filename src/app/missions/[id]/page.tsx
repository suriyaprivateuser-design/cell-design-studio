import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, PencilRuler, Target } from "lucide-react";
import { getMission, MISSIONS } from "@/content/missions";
import { ButtonLink, Card, Container } from "@/components/ui";
import { PageLoading } from "@/components/PageLoading";
import { SceneArt } from "@/components/SceneArt";

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ id: m.id }));
}

export default function ProblemPage({ params }: PageProps<"/missions/[id]">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Problem params={params} />
    </Suspense>
  );
}

async function Problem({ params }: { params: PageProps<"/missions/[id]">["params"] }) {
  const { id } = await params;
  const mission = getMission(id);
  if (!mission) notFound();

  return (
    <Container className="py-6 md:py-10">
      <Link href="/missions" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> ภารกิจทั้งหมด
      </Link>

      <div className="grid gap-6 md:grid-cols-[1.05fr_1fr] md:gap-10">
        <div className="aspect-[3/2] self-start overflow-hidden rounded-[2rem] shadow-lift">
          <SceneArt scene={mission.scene} className="h-full w-full" />
        </div>

        <div className="flex flex-col gap-5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-sage-600">ภารกิจ {mission.number}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">{mission.title}</h1>
            <p className="text-sm text-faint">{mission.sceneCaption}</p>
          </div>

          <Card className="p-5">
            <p className="text-lg leading-relaxed text-ink">{mission.problem}</p>
          </Card>

          <div className="space-y-2.5">
            <p className="flex items-center gap-2 text-sm font-semibold text-sage-800">
              <Target className="h-4 w-4" /> เป้าหมายที่ต้องการ
            </p>
            <ol className="space-y-2">
              {mission.goals.map((g, i) => (
                <li key={g.id} className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 text-[15px] text-ink shadow-soft">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-xs font-semibold text-sage-800">
                    {i + 1}
                  </span>
                  {g.text}
                </li>
              ))}
            </ol>
          </div>

          {mission.studio === "available" ? (
            <ButtonLink href={`/missions/${mission.id}/studio`} className="self-start px-7 py-3 text-base">
              <PencilRuler className="h-4 w-4" /> เริ่มออกแบบเซลล์
            </ButtonLink>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-dashed border-sage-300 bg-sage-50 px-4 py-3 text-sm text-muted">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
              <p>
                สตูดิโอออกแบบของภารกิจนี้จะเปิดใน Phase {mission.plannedPhase} ตอนนี้อ่านโจทย์และลองคิดล่วงหน้าได้ว่าเซลล์ควรมีลักษณะอย่างไร
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
