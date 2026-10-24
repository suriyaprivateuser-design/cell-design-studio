"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { getMission, nextMission } from "@/content/missions";
import { QUIZZES, SKILL_TEXT } from "@/content/quizzes";
import { isNameVisible, useStudio } from "@/store/useStudio";
import { useHydrated } from "@/store/StoreHydrator";
import { PageLoading } from "../PageLoading";
import { TissueSection } from "@/tissue/TissueSection";
import { Button, ButtonLink, Card, Container, Pill, cx } from "../ui";

const CHOICE_LETTERS = ["ก", "ข", "ค", "ง", "จ"];

export function QuizScreen({ missionId }: { missionId: string }) {
  const mission = getMission(missionId)!;
  const questions = QUIZZES[missionId] ?? [];
  const recordQuiz = useStudio((s) => s.recordQuiz);
  const hydrated = useHydrated((s) => s.hydrated);
  const unlocked = useStudio((s) => isNameVisible(s, missionId));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [finished, setFinished] = useState(false);

  const q = questions[index];
  const choice = picked[index];
  const answered = choice !== null;
  const correctCount = picked.filter((p, i) => p === questions[i].answer).length;
  const next = nextMission(missionId);

  const choose = (i: number) => {
    if (answered) return;
    setPicked((p) => p.map((v, k) => (k === index ? i : v)));
  };

  const goNext = () => {
    if (index < questions.length - 1) setIndex(index + 1);
    else {
      setFinished(true);
      recordQuiz(missionId, { correct: correctCount, total: questions.length, at: Date.now() });
    }
  };

  const restart = () => {
    setPicked(questions.map(() => null));
    setIndex(0);
    setFinished(false);
  };

  if (!hydrated) return <PageLoading />;
  if (!unlocked) {
    // The questions name the tissue, so they wait until the student has discovered it.
    return (
      <Container className="py-16 text-center">
        <p className="text-lg font-semibold text-ink">ทำภารกิจ {mission.number} ให้สำเร็จก่อน แล้วจึงทำแบบทดสอบ</p>
        <ButtonLink href={`/missions/${missionId}`} className="mt-6">
          ไปที่ภารกิจ
        </ButtonLink>
      </Container>
    );
  }

  return (
    <Container className="max-w-3xl py-6 md:py-10">
      <Link href={`/missions/${missionId}/results`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> ผลการทดสอบ
      </Link>
      <div className="mb-5 space-y-1">
        <p className="text-sm font-semibold text-sage-600">ภารกิจ {mission.number} · แบบทดสอบท้ายภารกิจ</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{mission.title}</h1>
      </div>

      {finished ? (
        <Card className="space-y-4 p-6 text-center">
          <p className="text-sm text-muted">ตอบถูก</p>
          <p className="text-4xl font-semibold text-sage-800">
            {correctCount} <span className="text-xl font-normal text-muted">จาก {questions.length} ข้อ</span>
          </p>
          <p className="text-[15px] text-muted">
            {correctCount === questions.length
              ? "เชื่อมโยงโครงสร้างกับหน้าที่ได้ครบถ้วน"
              : "ย้อนดูคำอธิบายของข้อที่ตอบผิด แล้วลองทำอีกครั้ง"}
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Button variant="secondary" onClick={restart}>
              <RotateCcw className="h-4 w-4" /> ทำอีกครั้ง
            </Button>
            {next && (
              <ButtonLink href={`/missions/${next.id}`}>
                ภารกิจถัดไป <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            )}
          </div>
        </Card>
      ) : (
        q && (
          <AnimatePresence mode="wait">
            <motion.div key={q.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              <Card className="space-y-5 p-5 md:p-6">
                <div className="flex items-center justify-between gap-2">
                  <Pill>{SKILL_TEXT[q.skill]}</Pill>
                  <span className="text-xs text-faint">
                    ข้อ {index + 1} / {questions.length}
                  </span>
                </div>
                <p className="text-lg leading-relaxed font-medium text-ink">{q.prompt}</p>

                {q.pictures && (
                  <div className={cx("mx-auto grid w-full gap-3", q.pictures.length > 1 ? "sm:grid-cols-2" : "max-w-md")}>
                    {q.pictures.map((p, i) => (
                      <figure key={i} className="space-y-1">
                        <TissueSection design={p.design} view={p.view} width={300} height={180} className="w-full rounded-2xl border border-line" seed={5 + i} />
                        <figcaption className="text-center text-xs text-muted">{p.caption} · ภาพจำลอง ไม่ใช่ภาพถ่ายจริง</figcaption>
                      </figure>
                    ))}
                  </div>
                )}

                <ul className="space-y-2">
                  {q.choices.map((c, i) => {
                    const isAnswer = i === q.answer;
                    const isPicked = i === choice;
                    return (
                      <li key={i}>
                        <button
                          onClick={() => choose(i)}
                          disabled={answered}
                          className={cx(
                            "flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left text-[15px] transition-colors",
                            !answered && "border-line bg-white hover:border-sage-400 hover:bg-sage-50",
                            answered && isAnswer && "border-good bg-good-soft",
                            answered && isPicked && !isAnswer && "border-low bg-low-soft",
                            answered && !isAnswer && !isPicked && "border-line bg-white opacity-60",
                          )}
                        >
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-100 text-xs font-semibold text-sage-800">
                            {CHOICE_LETTERS[i]}
                          </span>
                          <span className="flex-1">
                            {c.text}
                            {answered && isPicked && !isAnswer && c.why && <span className="mt-1 block text-[13px] text-low">{c.why}</span>}
                          </span>
                          {answered && isAnswer && <CheckCircle2 className="h-5 w-5 shrink-0 text-good" />}
                          {answered && isPicked && !isAnswer && <XCircle className="h-5 w-5 shrink-0 text-low" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {answered && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-sage-50 p-4">
                    <p className="text-sm font-semibold text-sage-800">{choice === q.answer ? "ถูกต้อง" : "ยังไม่ถูก"} · เหตุผล</p>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-ink">{q.explanation}</p>
                  </motion.div>
                )}

                <div className="flex justify-end">
                  <Button onClick={goNext} disabled={!answered}>
                    {index < questions.length - 1 ? "ข้อถัดไป" : "ดูผล"} <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        )
      )}
    </Container>
  );
}
