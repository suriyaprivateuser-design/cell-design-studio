"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, Eye, EyeOff, HelpCircle } from "lucide-react";
import { MISSIONS } from "@/content/missions";
import { getTissue } from "@/content/tissues";
import { isNameVisible, useStudio } from "@/store/useStudio";
import { TissueSection } from "@/tissue/TissueSection";
import { SceneArt } from "./SceneArt";
import { cx } from "./ui";

export function MissionList() {
  const discoveryMode = useStudio((s) => s.discoveryMode);
  const completed = useStudio((s) => s.completed);
  const revealed = useStudio((s) => s.revealed);
  const setDiscoveryMode = useStudio((s) => s.setDiscoveryMode);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-soft">
        <div className="flex items-center gap-3">
          {discoveryMode ? <EyeOff className="h-5 w-5 text-sage-600" /> : <Eye className="h-5 w-5 text-sage-600" />}
          <div>
            <p className="text-sm font-medium text-ink">Student Discovery Mode</p>
            <p className="text-xs text-muted">
              {discoveryMode ? "ซ่อนชื่อเนื้อเยื่อจนกว่าจะทำภารกิจสำเร็จ" : "แสดงชื่อเนื้อเยื่อทุกภารกิจ (โหมดครู)"}
            </p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={discoveryMode}
          aria-label="Student Discovery Mode"
          onClick={() => setDiscoveryMode(!discoveryMode)}
          className={cx("relative h-7 w-12 rounded-full transition-colors", discoveryMode ? "bg-sage-600" : "bg-sage-200")}
        >
          <span className={cx("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", discoveryMode ? "left-6" : "left-1")} />
        </button>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MISSIONS.map((m, i) => {
          const tissue = getTissue(m.tissueId);
          const visible = isNameVisible({ discoveryMode, completed, revealed }, m.id);
          const done = !!completed[m.id];
          const planned = m.studio === "planned";
          return (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <Link
                href={`/missions/${m.id}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-sage-300 hover:shadow-lift"
              >
                <div className="relative aspect-[3/2] bg-sage-50">
                  {visible && tissue?.reference ? (
                    <TissueSection design={tissue.reference} view="cross" width={240} height={160} simple showScale={false} className="h-full w-full" />
                  ) : (
                    <SceneArt scene={m.scene} className="h-full w-full" />
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-sage-800 shadow-soft">
                    {m.number}
                  </span>
                  {done && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-good px-2.5 py-1 text-xs font-medium text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" /> สำเร็จ
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-4">
                  <p className="text-base font-semibold text-ink">{m.title}</p>
                  <p className="text-xs text-faint">{m.titleEn}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    {visible ? (
                      <span className="text-sm font-medium text-sage-700">
                        {tissue?.nameTh} <span className="font-normal text-muted">· {tissue?.nameEn}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                        <HelpCircle className="h-4 w-4" /> ค้นพบชื่อหลังทดลอง
                      </span>
                    )}
                    {planned && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5 text-[11px] text-faint">
                        <Clock className="h-3 w-3" /> Phase {m.plannedPhase}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
