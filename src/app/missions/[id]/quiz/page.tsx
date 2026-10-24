import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MISSIONS, getMission } from "@/content/missions";
import { QUIZZES } from "@/content/quizzes";
import { QuizScreen } from "@/components/quiz/QuizScreen";
import { PageLoading } from "@/components/PageLoading";

export function generateStaticParams() {
  return MISSIONS.map((m) => ({ id: m.id }));
}

export default function MissionQuizPage({ params }: PageProps<"/missions/[id]/quiz">) {
  return (
    <Suspense fallback={<PageLoading />}>
      <Quiz params={params} />
    </Suspense>
  );
}

async function Quiz({ params }: { params: PageProps<"/missions/[id]/quiz">["params"] }) {
  const { id } = await params;
  if (!getMission(id) || !QUIZZES[id]?.length) notFound();
  return <QuizScreen missionId={id} />;
}
