"use client";

import type { CellDesign } from "@/simulation/design";
import { hasSecondaryWall } from "@/simulation/design";
import { CELL_COLORS, LEGEND } from "@/three/palette";
import { TissueSection } from "@/tissue/TissueSection";

interface Props {
  design: CellDesign;
  view: "cross" | "long";
  title?: string;
  compact?: boolean;
}

/** Many cells of the current design side by side, as in a thin section. */
export function TissuePreview({ design, view, title, compact }: Props) {
  const legend = LEGEND.filter((l) => {
    if (l.key === "secondaryWall") return hasSecondaryWall(design) && !design.lignified;
    if (l.key === "lignin") return hasSecondaryWall(design) && design.lignified;
    if (l.key === "cytoplasm" || l.key === "vacuole" || l.key === "nucleus") return design.living;
    if (l.key === "amyloplast") return design.living && design.plastids === "amyloplast";
    if (l.key === "lumen") return !design.living;
    return true;
  });
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-ink">
          {title ?? "ภาพจำลองเนื้อเยื่อ"}
          <span className="ml-1.5 text-xs font-normal text-faint">Tissue Preview · {view === "cross" ? "ภาคตัดขวาง" : "ภาคตัดตามยาว"}</span>
        </p>
      </div>
      <TissueSection design={design} view={view} width={compact ? 320 : 480} height={compact ? 200 : 210} crop={!compact} className={compact ? "w-full rounded-2xl" : "h-52 w-full rounded-2xl sm:h-auto"} title="ภาพจำลองเนื้อเยื่อ" />
      {!compact && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {legend.map((l) => (
            <li key={l.key} className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="h-2.5 w-2.5 rounded-full border border-black/10" style={{ background: CELL_COLORS[l.key] }} />
              {l.th}
            </li>
          ))}
          <li className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="h-2.5 w-2.5 rounded-full border border-black/15" style={{ background: CELL_COLORS.space }} />
            ช่องว่างระหว่างเซลล์
          </li>
        </ul>
      )}
    </div>
  );
}
