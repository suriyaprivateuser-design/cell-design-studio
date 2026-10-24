"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getTissue } from "@/content/tissues";
import { CellViewer, type ViewerOptions } from "../CellViewer";
import { TissuePreview } from "../studio/TissuePreview";
import { Card, cx } from "../ui";

const TABS = [
  { id: "overview", label: "ภาพรวม" },
  { id: "structure", label: "โครงสร้าง" },
  { id: "function", label: "หน้าที่" },
  { id: "location", label: "ตำแหน่งที่พบ" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** Page 07 — Tissue Knowledge: 3D model plus four short tabs. */
export function TissueKnowledge({ tissueId }: { tissueId: string }) {
  const tissue = getTissue(tissueId)!;
  const k = tissue.knowledge!;
  const [tab, setTab] = useState<TabId>("overview");
  const [viewer, setViewer] = useState<ViewerOptions>({ view: "cross", showLabels: true, showLayers: true });

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <Card className="overflow-hidden p-0">
          <CellViewer design={tissue.reference!} {...viewer} onChange={(p) => setViewer((v) => ({ ...v, ...p }))} className="h-[46vh] min-h-[320px]" caption="แบบจำลองเซลล์" />
        </Card>
        <Card className="p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TissuePreview design={tissue.reference!} view="cross" title="ภาพตัดขวาง" compact />
            <TissuePreview design={tissue.reference!} view="long" title="ภาพตัดตามยาว" compact />
          </div>
          <p className="mt-3 text-[11px] text-faint">ภาพจำลองจากแบบจำลอง ไม่ใช่ภาพถ่ายจากกล้องจุลทรรศน์ ความหนาผนังเซลล์ขยายให้เห็นชัดกว่าสัดส่วนจริง</p>
        </Card>
      </div>

      <Card className="p-5">
        <div role="tablist" aria-label="หัวข้อความรู้" className="mb-4 grid grid-cols-4 gap-1 rounded-full bg-sage-50 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cx(
                "rounded-full px-2 py-2 text-[13px] font-medium transition-colors",
                tab === t.id ? "bg-white text-sage-900 shadow-soft" : "text-muted hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={tab} role="tabpanel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === "overview" && (
              <div className="space-y-4">
                {k.overview.map((p) => (
                  <p key={p} className="text-[15px] leading-relaxed text-ink">
                    {p}
                  </p>
                ))}
                <div className="flex flex-wrap gap-2 pt-1">
                  {k.keyFeatures.map((f) => (
                    <span key={f} className="rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-800">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {tab !== "overview" && (
              <ul className="space-y-3">
                {k[tab].map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
