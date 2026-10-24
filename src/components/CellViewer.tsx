"use client";

import dynamic from "next/dynamic";
import { Layers, Tag } from "lucide-react";
import type { CellDesign } from "@/simulation/design";
import { VIEW_LABEL, type View } from "@/three/cellGeometry";
import { cx } from "./ui";

const CellCanvas = dynamic(() => import("@/three/CellCanvas"), {
  ssr: false,
  loading: () => <ModelLoading />,
});

function ModelLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-24 w-24 animate-pulse rounded-full bg-sage-100" />
    </div>
  );
}

export interface ViewerOptions {
  view: View;
  showLabels: boolean;
  showLayers: boolean;
}

interface Props extends ViewerOptions {
  design: CellDesign;
  onChange?: (patch: Partial<ViewerOptions>) => void;
  className?: string;
  /** Hide the toolbar (thumbnails, hero) */
  bare?: boolean;
  sway?: boolean;
  interactive?: boolean;
  caption?: string;
  distanceScale?: number;
}

const VIEWS: View[] = ["tissue", "whole", "cross", "long"];

export function CellViewer({ design, view, showLabels, showLayers, onChange, className, bare, sway, interactive = true, caption, distanceScale }: Props) {
  const toolbar = !bare && onChange;
  return (
    <div className={cx("flex flex-col", className)}>
      <div className="relative min-h-0 flex-1">
        <CellCanvas
          design={design}
          view={view}
          showLabels={showLabels}
          showLayers={showLayers}
          sway={sway}
          interactive={interactive}
          distanceScale={distanceScale}
          className="absolute inset-0"
        />
        {caption && (
          <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-sage-800 shadow-soft">
            {caption}
          </div>
        )}
      </div>
      {toolbar && (
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line/70 bg-white/60 px-2 py-2">
          <div className="flex rounded-full border border-line bg-white p-0.5" role="radiogroup" aria-label="มุมมอง">
            {VIEWS.map((v) => (
              <button
                key={v}
                role="radio"
                aria-checked={view === v}
                onClick={() => onChange({ view: v })}
                className={cx(
                  "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  view === v ? "bg-sage-700 text-white" : "text-muted hover:text-ink",
                )}
              >
                {VIEW_LABEL[v].th}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-full border border-line bg-white p-0.5">
            <ToggleIcon on={showLabels} onClick={() => onChange({ showLabels: !showLabels })} label="ป้ายชื่อ" icon={<Tag className="h-3.5 w-3.5" />} />
            <ToggleIcon on={showLayers} onClick={() => onChange({ showLayers: !showLayers })} label="ชั้นผนัง" icon={<Layers className="h-3.5 w-3.5" />} />
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleIcon({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
        on ? "bg-sage-100 text-sage-900" : "text-faint hover:text-ink",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
