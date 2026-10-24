"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Columns2, FlaskConical, Pin, RotateCcw } from "lucide-react";
import { getMission } from "@/content/missions";
import { getTissue } from "@/content/tissues";
import { getMissionRules } from "@/simulation/missions";
import { evaluate } from "@/simulation/rules";
import { isNameVisible, useStudio } from "@/store/useStudio";
import { useHydrated } from "@/store/StoreHydrator";
import { CellViewer, type ViewerOptions } from "../CellViewer";
import { Button, Card, cx } from "../ui";
import { ControlsPanel } from "./ControlsPanel";
import { PerformancePanel } from "./PerformancePanel";
import { TissuePreview } from "./TissuePreview";

export function StudioScreen({ missionId }: { missionId: string }) {
  const mission = getMission(missionId)!;
  const rules = getMissionRules(missionId)!;
  const router = useRouter();
  const hydrated = useHydrated((s) => s.hydrated);

  const design = useStudio((s) => s.designs[missionId]) ?? mission.startDesign;
  const before = useStudio((s) => s.before[missionId]) ?? mission.startDesign;
  const ensureDesign = useStudio((s) => s.ensureDesign);
  const updateDesign = useStudio((s) => s.updateDesign);
  const resetDesign = useStudio((s) => s.resetDesign);
  const setBefore = useStudio((s) => s.setBefore);
  const recordAttempt = useStudio((s) => s.recordAttempt);
  const nameVisible = useStudio((s) => isNameVisible(s, missionId));

  const [viewer, setViewer] = useState<ViewerOptions>({ view: "tissue", showLabels: true, showLayers: true });
  const [compare, setCompare] = useState(false);

  useEffect(() => {
    if (hydrated) ensureDesign(missionId);
  }, [hydrated, ensureDesign, missionId]);

  // Evaluating a design is a handful of comparisons, cheap enough to run on every render.
  const evaluation = evaluate(rules, design);
  const beforeEval = evaluate(rules, before);
  const tissue = getTissue(mission.tissueId);
  const sectionView = viewer.view === "long" ? "long" : "cross";

  const runTest = () => {
    recordAttempt({ id: crypto.randomUUID(), missionId, design, at: Date.now(), fit: evaluation.fit });
    router.push(`/missions/${missionId}/results`);
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-3 py-4 md:px-6 md:py-6">
      {/* Top bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href={`/missions/${missionId}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted hover:text-ink"
            aria-label="กลับไปที่โจทย์"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sage-600">
              ภารกิจ {mission.number} · Cell Design Studio
              {nameVisible && tissue && <span className="ml-1 font-normal text-muted">· {tissue.nameTh}</span>}
            </p>
            <h1 className="truncate text-lg font-semibold text-ink md:text-xl">{mission.title}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => resetDesign(missionId)} className="px-3.5">
            <RotateCcw className="h-4 w-4" /> รีเซ็ต
          </Button>
          <Button variant={compare ? "secondary" : "ghost"} onClick={() => setCompare((c) => !c)} aria-pressed={compare} className={cx("px-3.5", compare && "border-sage-400")}>
            <Columns2 className="h-4 w-4" /> ก่อน / หลัง
          </Button>
          <Button onClick={runTest} className="px-5">
            <FlaskConical className="h-4 w-4" /> ทดสอบ
          </Button>
        </div>
      </div>

      <details className="mb-4 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm shadow-soft lg:hidden">
        <summary className="cursor-pointer font-medium text-sage-800">โจทย์และเป้าหมาย</summary>
        <ProblemSummary missionId={missionId} />
      </details>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)_330px]">
        {/* CENTER (first on small screens so the model stays in view) */}
        <div className="space-y-4 lg:col-start-2 lg:row-start-1">
          <Card className="sticky top-16 z-10 overflow-hidden p-0 md:static">
            {compare ? (
              <div className="grid grid-cols-2 divide-x divide-line">
                <CellViewer design={before} {...viewer} distanceScale={1.45} caption="ก่อน · Before" className="h-[38vh] min-h-[260px] lg:h-[520px]" />
                <CellViewer design={design} {...viewer} distanceScale={1.45} caption="หลัง · After" className="h-[38vh] min-h-[260px] lg:h-[520px]" />
              </div>
            ) : (
              <CellViewer
                design={design}
                {...viewer}
                onChange={(p) => setViewer((v) => ({ ...v, ...p }))}
                className="h-[42vh] min-h-[300px] lg:h-[560px]"
              />
            )}
            {compare && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
                <ViewSwitch viewer={viewer} onChange={(p) => setViewer((v) => ({ ...v, ...p }))} />
                <Button variant="secondary" onClick={() => setBefore(missionId)} className="px-3 py-1.5 text-xs">
                  <Pin className="h-3.5 w-3.5" /> ใช้แบบปัจจุบันเป็น “ก่อน”
                </Button>
              </div>
            )}
          </Card>
          <Card className="p-4">
            {compare ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <TissuePreview design={before} view={sectionView} title="ก่อน" compact />
                <TissuePreview design={design} view={sectionView} title="หลัง" compact />
              </div>
            ) : (
              <TissuePreview design={design} view={sectionView} />
            )}
          </Card>
          <p className="px-1 text-[11px] leading-snug text-faint">
            แบบจำลองขยายความหนาผนังเซลล์ให้มองเห็นชัดกว่าสัดส่วนจริง ลากเพื่อหมุน 360° และใช้ล้อเมาส์หรือสองนิ้วเพื่อซูม
          </p>
        </div>

        {/* LEFT */}
        <Card className="p-4 lg:col-start-1 lg:row-start-1 lg:self-start">
          <div className="mb-4 hidden lg:block">
            <ProblemSummary missionId={missionId} />
          </div>
          <h2 className="mb-3 text-sm font-semibold text-ink">ปรับเซลล์ · Cell Controls</h2>
          <ControlsPanel controls={mission.controls} design={design} onChange={(p) => updateDesign(missionId, p)} />
        </Card>

        {/* RIGHT */}
        <Card className="p-4 lg:col-start-3 lg:row-start-1 lg:self-start">
          <h2 className="mb-3 text-sm font-semibold text-ink">
            สมรรถนะของเซลล์ · Cell Performance
            {compare && <span className="ml-1.5 text-xs font-normal text-faint">ก่อน → หลัง</span>}
          </h2>
          <PerformancePanel evaluation={evaluation} before={compare ? beforeEval : undefined} />
          <Button onClick={runTest} className="mt-4 w-full">
            <FlaskConical className="h-4 w-4" /> ทดสอบแบบเซลล์นี้
          </Button>
        </Card>
      </div>
    </div>
  );
}

function ProblemSummary({ missionId }: { missionId: string }) {
  const mission = getMission(missionId)!;
  return (
    <div className="space-y-2 pt-2 lg:pt-0">
      <p className="text-[13px] leading-relaxed text-ink">{mission.problem}</p>
      <ul className="space-y-1">
        {mission.goals.map((g) => (
          <li key={g.id} className="flex gap-2 text-xs text-muted">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-400" />
            {g.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ViewSwitch({ viewer, onChange }: { viewer: ViewerOptions; onChange: (p: Partial<ViewerOptions>) => void }) {
  const opts: [ViewerOptions["view"], string][] = [
    ["whole", "ทั้งเซลล์"],
    ["cross", "ตัดขวาง"],
    ["long", "ตัดตามยาว"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-1">
      {opts.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange({ view: v })}
          className={cx("rounded-full px-3 py-1 text-xs", viewer.view === v ? "bg-sage-700 text-white" : "text-muted hover:bg-sage-50")}
        >
          {label}
        </button>
      ))}
      <button
        onClick={() => onChange({ showLabels: !viewer.showLabels })}
        aria-pressed={viewer.showLabels}
        className={cx("rounded-full px-3 py-1 text-xs", viewer.showLabels ? "bg-sage-100 text-sage-900" : "text-faint")}
      >
        ป้ายชื่อ
      </button>
    </div>
  );
}
