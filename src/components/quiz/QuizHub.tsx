"use client";

import Link from "next/link";
import { ArrowRight, Clock, Lock } from "lucide-react";
import { MISSIONS } from "@/content/missions";
import { QUIZZES } from "@/content/quizzes";
import { useStudio } from "@/store/useStudio";
import { cx } from "../ui";

export function QuizHub() {
  const quizzes = useStudio((s) => s.quizzes);
  const completed = useStudio((s) => s.completed);
  const revealed = useStudio((s) => s.revealed);

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {MISSIONS.map((m) => {
        const count = QUIZZES[m.id]?.length ?? 0;
        const record = quizzes[m.id];
        // The quiz names the tissue, so it opens after the mission (or a reveal).
        const unlocked = count > 0 && (!!completed[m.id] || !!revealed[m.id]);
        const body = (
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sm font-semibold text-sage-800">{m.number}</span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{m.title}</p>
              <p className="text-xs text-muted">
                {count === 0
                  ? `เพิ่มพร้อมภารกิจใน Phase ${m.plannedPhase}`
                  : unlocked
                    ? record
                      ? `${count} ข้อ · ครั้งล่าสุดตอบถูก ${record.correct}/${record.total}`
                      : `${count} ข้อ`
                    : `${count} ข้อ · ทำภารกิจให้สำเร็จก่อนจึงจะเปิด`}
              </p>
            </div>
            {count === 0 ? <Clock className="h-4 w-4 text-faint" /> : unlocked ? <ArrowRight className="h-4 w-4 text-sage-700" /> : <Lock className="h-4 w-4 text-faint" />}
          </div>
        );
        return (
          <li key={m.id}>
            {unlocked ? (
              <Link href={`/missions/${m.id}/quiz`} className="block rounded-3xl border border-line bg-white p-4 shadow-soft transition hover:border-sage-300">
                {body}
              </Link>
            ) : (
              <div className={cx("rounded-3xl border border-line bg-white/60 p-4", count === 0 && "opacity-70")}>
                {body}
                {count > 0 && (
                  <Link href={`/missions/${m.id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sage-700">
                    ไปที่ภารกิจ <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
