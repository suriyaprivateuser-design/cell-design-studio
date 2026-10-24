"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tag } from "lucide-react";
import { TISSUE_MODELS } from "@/three/models";
import type { ModelView } from "@/three/ModelCanvas";
import { cx } from "./ui";

const ModelCanvas = dynamic(() => import("@/three/ModelCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-24 w-24 animate-pulse rounded-full bg-sage-100" />
    </div>
  ),
});

const VIEWS: [ModelView, string][] = [
  ["oblique", "มุมเฉียง"],
  ["top", "มองด้านบน"],
  ["side", "มองด้านข้าง"],
];

/** 3D model of a tissue with its variants, camera presets and labels. */
export function ModelViewer({ tissueId, className }: { tissueId: string; className?: string }) {
  const variants = TISSUE_MODELS[tissueId] ?? [];
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [view, setView] = useState<ModelView>("oblique");
  const [showLabels, setShowLabels] = useState(true);
  if (!variants.length) return null;
  return (
    <div className={cx("flex flex-col", className)}>
      {variants.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line/70 px-3 py-2" role="radiogroup" aria-label="ชนิด">
          {variants.map((v) => (
            <button
              key={v.id}
              role="radio"
              aria-checked={variantId === v.id}
              onClick={() => setVariantId(v.id)}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                variantId === v.id ? "bg-sage-700 text-white" : "text-muted hover:bg-sage-50 hover:text-ink",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        <ModelCanvas tissueId={tissueId} variantId={variantId} view={view} showLabels={showLabels} className="absolute inset-0" />
        <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-sage-800 shadow-soft">แบบจำลอง 3D</div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line/70 bg-white/60 px-2 py-2">
        <div className="flex rounded-full border border-line bg-white p-0.5" role="radiogroup" aria-label="มุมมอง">
          {VIEWS.map(([v, label]) => (
            <button
              key={v}
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className={cx("rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap", view === v ? "bg-sage-700 text-white" : "text-muted hover:text-ink")}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowLabels((s) => !s)}
          aria-pressed={showLabels}
          className={cx(
            "inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium",
            showLabels ? "bg-sage-100 text-sage-900" : "bg-white text-faint",
          )}
        >
          <Tag className="h-3.5 w-3.5" /> ป้ายชื่อ
        </button>
      </div>
    </div>
  );
}
