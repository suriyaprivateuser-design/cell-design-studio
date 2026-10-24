"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Columns2,
  Eye,
  ListChecks,
  PencilRuler,
  Sparkles,
  ThumbsUp,
  Wrench,
  XCircle,
} from "lucide-react";
import { getMission, nextMission } from "@/content/missions";
import { getTissue } from "@/content/tissues";
import { CONTROLS, describeControl } from "@/simulation/design";
import { getMissionRules } from "@/simulation/missions";
import { evaluate, FIT_TEXT, type Fit, type Reason } from "@/simulation/rules";
import { latestAttempt, useStudio } from "@/store/useStudio";
import { useHydrated } from "@/store/StoreHydrator";
import { CellViewer, type ViewerOptions } from "../CellViewer";
import { PageLoading } from "../PageLoading";
import { ReasonLine } from "../studio/PerformancePanel";
import { TissuePreview } from "../studio/TissuePreview";
import { Button, ButtonLink, Card, Container, LevelBadge, cx } from "../ui";

const FIT_STYLE: Record<Fit, string> = {
  good: "bg-good-soft text-good",
  partial: "bg-mid-soft text-mid",
  poor: "bg-low-soft text-low",
};

const FIT_SUMMARY: Record<Fit, string> = {
  good: "เซลล์ที่ออกแบบตอบโจทย์ครบทุกเป้าหมาย",
  partial: "เซลล์ที่ออกแบบตอบโจทย์ได้เกือบครบ ยังมีบางเป้าหมายที่ควรปรับ",
  poor: "เซลล์ที่ออกแบบยังไม่ตอบโจทย์ ลองอ่านเหตุผลด้านล่างแล้วกลับไปปรับ",
};

/** Attempts needed before the student may reveal the answer without completing. */
const REVEAL_AFTER = 3;

export function ResultsScreen({ missionId }: { missionId: string }) {
  const hydrated = useHydrated((s) => s.hydrated);
  const attempts = useStudio((s) => s.attempts);
  const completedAt = useStudio((s) => s.completed[missionId]);
  const revealedAt = useStudio((s) => s.revealed[missionId]);
  const reveal = useStudio((s) => s.reveal);
  const [viewer, setViewer] = useState<ViewerOptions>({ view: "cross", showLabels: false, showLayers: true });

  const mission = getMission(missionId)!;
  const rules = getMissionRules(missionId)!;
  const tissue = getTissue(mission.tissueId);
  const attempt = latestAttempt(attempts, missionId);
  const tries = attempts.filter((a) => a.missionId === missionId).length;
  const evaluation = useMemo(() => (attempt ? evaluate(rules, attempt.design) : null), [rules, attempt]);

  if (!hydrated) return <PageLoading />;
  if (!attempt || !evaluation) {
    return (
      <Container className="py-16 text-center">
        <p className="text-lg font-semibold text-ink">ยังไม่มีผลการทดสอบของภารกิจนี้</p>
        <ButtonLink href={`/missions/${missionId}/studio`} className="mt-6">
          <PencilRuler className="h-4 w-4" /> ไปออกแบบเซลล์
        </ButtonLink>
      </Container>
    );
  }

  const design = attempt.design;
  const goalMetrics = evaluation.metrics.filter((m) => !m.tradeOff);
  const strengths: Reason[] = goalMetrics.flatMap((m) => m.reasons.filter((r) => r.effect > 0));
  const improvements: Reason[] = goalMetrics.flatMap((m) => m.reasons.filter((r) => r.effect < 0));
  const success = evaluation.fit === "good";
  const showName = success || !!completedAt || !!revealedAt;
  const next = nextMission(missionId);

  return (
    <Container className="py-6 md:py-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/missions/${missionId}/studio`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> กลับไปปรับแบบเซลล์
        </Link>
        <p className="text-xs text-faint">ทดสอบครั้งที่ {tries}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-3">
        <p className="text-sm font-semibold text-sage-600">ภารกิจ {mission.number} · ผลการทดสอบ</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">{mission.title}</h1>
          <span className={cx("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold", FIT_STYLE[evaluation.fit])}>
            {success ? <CheckCircle2 className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
            {FIT_TEXT[evaluation.fit]}
          </span>
        </div>
        <p className="text-[15px] text-muted">{FIT_SUMMARY[evaluation.fit]}</p>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="overflow-hidden p-0">
            <CellViewer design={design} {...viewer} onChange={(p) => setViewer((v) => ({ ...v, ...p }))} className="h-[46vh] min-h-[320px]" caption="แบบเซลล์ที่ทดสอบ" />
          </Card>
          <Card className="p-4">
            <TissuePreview design={design} view={viewer.view === "long" ? "long" : "cross"} />
          </Card>
          <Card className="p-5">
            <SectionHead icon={<ListChecks className="h-4 w-4" />} title="คุณสมบัติที่เลือก" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {mission.controls.map((id) => (
                <div key={id} className="flex items-baseline justify-between gap-3 border-b border-line/70 py-1.5 text-sm">
                  <dt className="text-muted">{CONTROLS[id].label}</dt>
                  <dd className="text-right font-medium text-ink">{describeControl(CONTROLS[id], design)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <SectionHead icon={<CheckCircle2 className="h-4 w-4" />} title="ความเหมาะสมต่อโจทย์" />
            <ul className="space-y-3">
              {evaluation.goals.map((g) => {
                const goal = mission.goals.find((x) => x.id === g.id);
                return (
                  <li key={g.id} className="flex gap-3">
                    {g.met ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-good" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-low" />}
                    <div>
                      <p className="text-sm font-medium text-ink">{goal?.text}</p>
                      <p className="text-[13px] leading-relaxed text-muted">{g.feedback}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
              {evaluation.metrics.map((m) => (
                <span key={m.id} className="inline-flex items-center gap-2 rounded-full bg-sage-50 py-1 pr-1 pl-3 text-xs text-muted">
                  {m.label}
                  <LevelBadge level={m.level} />
                </span>
              ))}
            </div>
          </Card>

          {strengths.length > 0 && (
            <Card className="p-5">
              <SectionHead icon={<ThumbsUp className="h-4 w-4" />} title="จุดที่สอดคล้องกับหน้าที่" />
              <ul className="space-y-2">
                {strengths.map((r, i) => (
                  <ReasonLine key={i} reason={r} />
                ))}
              </ul>
            </Card>
          )}

          {improvements.length > 0 && (
            <Card className="p-5">
              <SectionHead icon={<Wrench className="h-4 w-4" />} title="จุดที่ควรปรับปรุง" />
              <ul className="space-y-3">
                {improvements.map((r, i) => (
                  <li key={i} className="space-y-1">
                    <ul>
                      <ReasonLine reason={r} />
                    </ul>
                    {r.hint && <p className="pl-6 text-[12.5px] text-sage-700">ลองดู: {r.hint}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {showName && tissue ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}>
              <Card className="border-sage-300 bg-gradient-to-br from-white to-sage-50 p-5">
                <p className="flex items-center gap-2 text-sm font-semibold text-sage-700">
                  <Sparkles className="h-4 w-4" /> {success || completedAt ? "ค้นพบเนื้อเยื่อ" : "เฉลยเนื้อเยื่อ"}
                </p>
                <p className="mt-2 text-2xl font-semibold text-sage-900">
                  {tissue.nameTh} <span className="text-lg font-normal text-muted">· {tissue.nameEn}</span>
                </p>
                {mission.discovery && <p className="mt-2 text-[14.5px] leading-relaxed text-ink">{mission.discovery}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <ButtonLink href={`/missions/${missionId}/compare`} variant="secondary">
                    <Columns2 className="h-4 w-4" /> เทียบกับเนื้อเยื่อจริง
                  </ButtonLink>
                  <ButtonLink href={`/library/${tissue.id}`} variant="secondary">
                    <BookOpen className="h-4 w-4" /> สรุปความรู้
                  </ButtonLink>
                  <ButtonLink href={`/missions/${missionId}/quiz`}>
                    แบบทดสอบท้ายภารกิจ <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                </div>
              </Card>
            </motion.div>
          ) : (
            <Card className="p-5">
              <p className="text-sm font-semibold text-ink">ยังไม่เปิดเผยชื่อเนื้อเยื่อ</p>
              <p className="mt-1 text-[13px] text-muted">ปรับแบบเซลล์ให้ตอบโจทย์ครบทุกข้อ แล้วชื่อเนื้อเยื่อจะปรากฏที่นี่</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/missions/${missionId}/studio`}>
                  <PencilRuler className="h-4 w-4" /> กลับไปปรับแบบ
                </ButtonLink>
                {tries >= REVEAL_AFTER && (
                  <Button variant="ghost" onClick={() => reveal(missionId)}>
                    <Eye className="h-4 w-4" /> เปิดเผยชื่อเนื้อเยื่อ
                  </Button>
                )}
              </div>
              {tries < REVEAL_AFTER && (
                <p className="mt-3 text-xs text-faint">ทดลองครบ {REVEAL_AFTER} ครั้งแล้วจะเลือกเปิดเผยชื่อเนื้อเยื่อได้</p>
              )}
            </Card>
          )}

          {next && (
            <div className="flex justify-end">
              <ButtonLink href={`/missions/${next.id}`} variant="ghost">
                ภารกิจถัดไป: {next.number} {next.title} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

function SectionHead({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-sage-800">
      {icon}
      {title}
    </p>
  );
}
