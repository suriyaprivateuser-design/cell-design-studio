"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Info, Minus, Plus } from "lucide-react";
import type { Evaluation, MetricResult, Reason } from "@/simulation/rules";
import { LevelBadge, cx } from "../ui";

interface Props {
  evaluation: Evaluation;
  /** When comparing, the evaluation of the "before" design */
  before?: Evaluation;
}

export function PerformancePanel({ evaluation, before }: Props) {
  const main = evaluation.metrics.filter((m) => !m.tradeOff);
  const extra = evaluation.metrics.filter((m) => m.tradeOff);
  return (
    <div className="space-y-3">
      {main.map((m) => (
        <MetricCard key={m.id} metric={m} before={before?.byId[m.id]} />
      ))}
      {extra.length > 0 && (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-semibold text-faint">ข้อมูลเปรียบเทียบ (ไม่ใช่เป้าหมายของภารกิจนี้)</p>
          {extra.map((m) => (
            <MetricCard key={m.id} metric={m} before={before?.byId[m.id]} muted />
          ))}
        </div>
      )}
      <p className="text-[11px] leading-snug text-faint">
        ระดับ สูง / ปานกลาง / ต่ำ เป็นการประเมินเชิงคุณภาพจากเหตุผลทางชีววิทยาที่แสดงไว้ ไม่ใช่ค่าที่วัดจากการทดลองจริง
      </p>
    </div>
  );
}

function MetricCard({ metric, before, muted }: { metric: MetricResult; before?: MetricResult; muted?: boolean }) {
  const changed = before && before.level !== metric.level;
  return (
    <div className={cx("rounded-2xl border p-3.5", muted ? "border-line/70 bg-sage-50/50" : "border-line bg-white")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">{metric.label}</p>
          <p className="text-[11px] text-faint">{metric.labelEn}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {before && (
            <>
              <LevelBadge level={before.level} className="opacity-60" />
              <ArrowRight className={cx("h-3.5 w-3.5", changed ? "text-sage-700" : "text-faint")} />
            </>
          )}
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={metric.level}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LevelBadge level={metric.level} />
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-muted">{metric.about}</p>
      {metric.reasons.length > 0 && (
        <ul className="mt-2.5 space-y-1.5">
          {metric.reasons.map((r, i) => (
            <ReasonLine key={i} reason={r} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReasonLine({ reason }: { reason: Reason }) {
  const Icon = reason.effect > 0 ? Plus : reason.effect < 0 ? Minus : Info;
  return (
    <li className="flex gap-2 text-[12.5px] leading-snug text-ink">
      <span
        className={cx(
          "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
          reason.effect > 0 ? "bg-good-soft text-good" : reason.effect < 0 ? "bg-low-soft text-low" : "bg-sage-100 text-sage-700",
        )}
      >
        <Icon className="h-3 w-3" strokeWidth={2.5} />
      </span>
      <span>{reason.text}</span>
    </li>
  );
}
