"use client";

import { memo, useId, useMemo } from "react";
import type { CellDesign } from "@/simulation/design";
import { CELL_COLORS as C } from "@/three/palette";
import { buildSection, type SectionView } from "./section";

interface Props {
  design: CellDesign;
  view: SectionView;
  width?: number;
  height?: number;
  seed?: number;
  /** Hide the protoplast details (for small thumbnails) */
  simple?: boolean;
  showScale?: boolean;
  className?: string;
  title?: string;
  /** Crop instead of shrink when the box is narrower than the picture (keeps cells readable on phones) */
  crop?: boolean;
}

/** Light-microscope-style slice of the designed tissue (SVG). */
export const TissueSection = memo(function TissueSection({ design, view, width = 320, height = 220, seed, simple, showScale = true, className, title, crop }: Props) {
  const section = useMemo(() => buildSection(design, view, width, height, seed ?? (view === "cross" ? 11 : 29)), [design, view, width, height, seed]);
  const clipId = useId();
  const lignin = design.lignified;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio={crop ? "xMidYMid slice" : undefined} className={className} role="img" aria-label={title ?? "ภาพจำลองเนื้อเยื่อ"}>
      <defs>
        <clipPath id={clipId}>
          <rect width={width} height={height} rx={14} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={width} height={height} fill={C.space} />
        {section.cells.map((c) => (
          <g key={c.id}>
            <path d={c.outer} fill={C.middleLamella} />
            <path d={c.primary} fill={C.primaryWall} />
            {c.secondary && <path d={c.secondary} fill={lignin ? C.lignin : C.secondaryWall} />}
            <path d={c.lumen} fill={design.living ? C.cytoplasm : C.lumen} />
            {!simple && c.membrane && <path d={c.membrane} fill="none" stroke={C.membrane} strokeWidth={0.6} />}
            {c.vacuole && <path d={c.vacuole} fill={C.vacuole} stroke={simple ? "none" : C.tonoplast} strokeWidth={0.5} />}
            {!simple &&
              c.plastids.map((p, i) => (
                <ellipse
                  key={i}
                  cx={p.c[0]}
                  cy={p.c[1]}
                  rx={p.rx}
                  ry={p.ry}
                  transform={`rotate(${p.angle} ${p.c[0]} ${p.c[1]})`}
                  fill={design.plastids === "amyloplast" ? C.amyloplast : C.chloroplast}
                  stroke={design.plastids === "amyloplast" ? C.amyloplastEdge : "none"}
                  strokeWidth={0.5}
                />
              ))}
            {c.nucleus && (
              <g>
                <circle cx={c.nucleus.c[0]} cy={c.nucleus.c[1]} r={c.nucleus.r} fill={C.nucleus} />
                {!simple && <circle cx={c.nucleus.c[0] + c.nucleus.r * 0.2} cy={c.nucleus.c[1] - c.nucleus.r * 0.15} r={c.nucleus.r * 0.35} fill={C.nucleolus} />}
              </g>
            )}
          </g>
        ))}
        {showScale && (
          <g transform={`translate(${(width - section.scaleBar50) / 2} ${height - 16})`}>
            <rect x={-6} y={-13} width={section.scaleBar50 + 12} height={22} rx={6} fill="white" opacity={0.85} />
            <line x1={0} x2={section.scaleBar50} y1={4} y2={4} stroke="#2f412c" strokeWidth={2} />
            <text x={section.scaleBar50 / 2} y={-2} textAnchor="middle" fontSize={8} fill="#2f412c">
              ≈ 50 µm
            </text>
          </g>
        )}
      </g>
    </svg>
  );
});
