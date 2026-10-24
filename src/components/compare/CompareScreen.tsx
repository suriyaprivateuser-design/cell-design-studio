"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ImageOff, MapPin, Microscope, Minus, Target } from "lucide-react";
import { getMission } from "@/content/missions";
import { getTissue } from "@/content/tissues";
import { isNameVisible, latestAttempt, useStudio } from "@/store/useStudio";
import { useHydrated } from "@/store/StoreHydrator";
import { CellViewer, type ViewerOptions } from "../CellViewer";
import { PageLoading } from "../PageLoading";
import { TissuePreview } from "../studio/TissuePreview";
import { ButtonLink, Card, Container } from "../ui";

export function CompareScreen({ missionId }: { missionId: string }) {
  const hydrated = useHydrated((s) => s.hydrated);
  const attempts = useStudio((s) => s.attempts);
  const visible = useStudio((s) => isNameVisible(s, missionId));
  const [viewer, setViewer] = useState<ViewerOptions>({ view: "cross", showLabels: false, showLayers: true });

  const mission = getMission(missionId)!;
  const tissue = getTissue(mission.tissueId)!;
  const attempt = latestAttempt(attempts, missionId);

  if (!hydrated) return <PageLoading />;
  if (!attempt || !visible || !tissue.reference) {
    return (
      <Container className="py-16 text-center">
        <p className="text-lg font-semibold text-ink">ทำภารกิจให้สำเร็จก่อน แล้วจึงเปรียบเทียบกับเนื้อเยื่อจริง</p>
        <ButtonLink href={`/missions/${missionId}/studio`} className="mt-6">
          ไปออกแบบเซลล์
        </ButtonLink>
      </Container>
    );
  }

  const traits = tissue.traits ?? [];
  const same = traits.filter((t) => t.matches(attempt.design));
  const diff = traits.filter((t) => !t.matches(attempt.design));
  const sectionView = viewer.view === "long" ? "long" : "cross";

  return (
    <Container className="py-6 md:py-8">
      <Link href={`/missions/${missionId}/results`} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> ผลการทดสอบ
      </Link>
      <div className="mb-6 space-y-1">
        <p className="text-sm font-semibold text-sage-600">ภารกิจ {mission.number} · เปรียบเทียบกับเนื้อเยื่อจริง</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {tissue.nameTh} <span className="text-lg font-normal text-muted">· {tissue.nameEn}</span>
        </h1>
      </div>

      <div className="mb-3 flex flex-wrap justify-center gap-1 rounded-full border border-line bg-white p-1 shadow-soft sm:inline-flex">
        {(
          [
            ["whole", "ทั้งเซลล์"],
            ["cross", "ภาคตัดขวาง"],
            ["long", "ภาคตัดตามยาว"],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setViewer((o) => ({ ...o, view: v }))}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${viewer.view === v ? "bg-sage-700 text-white" : "text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setViewer((o) => ({ ...o, showLabels: !o.showLabels }))}
          aria-pressed={viewer.showLabels}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${viewer.showLabels ? "bg-sage-100 text-sage-900" : "text-faint"}`}
        >
          ป้ายชื่อ
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <CellViewer design={attempt.design} {...viewer} caption="แบบของนักเรียน" className="h-[40vh] min-h-[280px]" />
          <div className="border-t border-line p-4">
            <TissuePreview design={attempt.design} view={sectionView} title="แบบของนักเรียน" compact />
          </div>
        </Card>
        <Card className="overflow-hidden p-0">
          <CellViewer design={tissue.reference} {...viewer} caption={`แบบจำลองอ้างอิง: ${tissue.nameTh}`} className="h-[40vh] min-h-[280px]" />
          <div className="border-t border-line p-4">
            <TissuePreview design={tissue.reference} view={sectionView} title="แบบจำลองอ้างอิง" compact />
          </div>
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-sage-800">
          <Microscope className="h-4 w-4" /> ภาพจากกล้องจุลทรรศน์ (ภาพจริง)
        </p>
        {tissue.micrographs && tissue.micrographs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {tissue.micrographs.map((m) => (
              <figure key={m.src} className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.src} alt={m.caption} className="w-full rounded-2xl border border-line" />
                <figcaption className="text-xs text-muted">
                  {m.caption} · ภาพโดย {m.credit} · {m.license} ·{" "}
                  <a href={m.sourceUrl} className="underline" target="_blank" rel="noreferrer">
                    แหล่งที่มา
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border border-dashed border-sage-300 bg-sage-50 p-4 text-sm text-muted">
            <ImageOff className="mt-0.5 h-5 w-5 shrink-0 text-sage-600" />
            <p>
              ยังไม่มีภาพถ่ายจากกล้องจุลทรรศน์ที่ตรวจสอบสิทธิ์การใช้งานแล้ว ภาพด้านบนเป็นแบบจำลอง ไม่ใช่ภาพถ่ายจริง
              ครูเพิ่มภาพที่มีสัญญาอนุญาตได้ใน <code className="rounded bg-white px-1">src/content/tissues.ts</code> โดยระบุผู้สร้าง
              สัญญาอนุญาต และแหล่งที่มา หรือใช้ภาพจากการส่องกล้องในห้องเรียน เช่น เนื้อมันฝรั่งย้อมไอโอดีน
            </p>
          </div>
        )}
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-sage-800">ความเหมือน</p>
          {same.length ? (
            <ul className="space-y-2">
              {same.map((t) => (
                <li key={t.text} className="flex gap-2 text-sm text-ink">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-good" /> {t.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">ยังไม่มีลักษณะที่ตรงกับเนื้อเยื่อจริง</p>
          )}
        </Card>
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-sage-800">ความแตกต่าง</p>
          {diff.length ? (
            <ul className="space-y-2">
              {diff.map((t) => (
                <li key={t.text} className="flex gap-2 text-sm text-ink">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-mid" /> {t.differs}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">ลักษณะสำคัญตรงกับเนื้อเยื่อจริงทุกข้อ</p>
          )}
        </Card>
      </div>

      {tissue.knowledge && (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InfoCard icon={<Check className="h-4 w-4" />} title="ลักษณะเด่น" items={tissue.knowledge.keyFeatures} />
          <InfoCard icon={<Target className="h-4 w-4" />} title="หน้าที่" items={tissue.knowledge.function.slice(0, 3)} />
          <InfoCard icon={<MapPin className="h-4 w-4" />} title="ตำแหน่งที่พบ" items={tissue.knowledge.location.slice(0, 3)} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <ButtonLink href={`/library/${tissue.id}`} variant="secondary">
          สรุปความรู้
        </ButtonLink>
        <ButtonLink href={`/missions/${missionId}/quiz`}>
          แบบทดสอบท้ายภารกิจ <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>
    </Container>
  );
}

function InfoCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <Card className="p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-sage-800">
        {icon} {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-[13.5px] leading-snug text-ink">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
            {t}
          </li>
        ))}
      </ul>
    </Card>
  );
}
