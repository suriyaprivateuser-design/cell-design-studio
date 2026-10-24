"use client";

import { Info } from "lucide-react";
import {
  CONTROL_GROUPS,
  CONTROLS,
  hasSecondaryWall,
  type CellDesign,
  type Control,
  type ControlGroup,
  type ControlId,
} from "@/simulation/design";
import { cx } from "../ui";

interface Props {
  controls: ControlId[];
  design: CellDesign;
  onChange: (patch: Partial<CellDesign>) => void;
}

/** Why a control is unavailable for the current design, if it is. */
function disabledReason(c: Control, d: CellDesign): string | null {
  if (c.id === "vacuole" && !d.living) return "เซลล์ที่ตายแล้วไม่มีแวคิวโอล";
  if (c.id === "lignified" && !hasSecondaryWall(d)) return "ลิกนินสะสมในผนังทุติยภูมิ ต้องมีผนังทุติยภูมิก่อน";
  return null;
}

export function ControlsPanel({ controls, design, onChange }: Props) {
  const groups = (Object.keys(CONTROL_GROUPS) as ControlGroup[])
    .map((g) => ({ g, items: controls.map((id) => CONTROLS[id]).filter((c) => c.group === g) }))
    .filter((x) => x.items.length > 0);

  return (
    <div className="space-y-5">
      {groups.map(({ g, items }) => (
        <section key={g} className="space-y-3">
          <h3 className="text-xs font-semibold tracking-wide text-sage-600">{CONTROL_GROUPS[g]}</h3>
          <div className="space-y-4">
            {items.map((c) => (
              <ControlRow key={c.id} control={c} design={design} onChange={onChange} disabled={disabledReason(c, design)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ControlRow({
  control: c,
  design,
  onChange,
  disabled,
}: {
  control: Control;
  design: CellDesign;
  onChange: Props["onChange"];
  disabled: string | null;
}) {
  const inputId = `ctl-${c.id}`;
  return (
    <div className={cx("space-y-1.5", disabled && "opacity-70")}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {c.label}
          <span className="ml-1.5 text-xs font-normal text-faint">{c.labelEn}</span>
        </label>
        {c.kind === "slider" && <span className="shrink-0 text-xs font-medium text-sage-700">{c.describe(design[c.key])}</span>}
      </div>

      {c.kind === "slider" && (
        <input
          id={inputId}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={design[c.key]}
          disabled={!!disabled}
          aria-valuetext={c.describe(design[c.key])}
          onChange={(e) => onChange({ [c.key]: Number(e.target.value) } as Partial<CellDesign>)}
          className="range"
          style={{ ["--fill" as string]: `${design[c.key] * 100}%` }}
        />
      )}

      {c.kind === "choice" && (
        <div id={inputId} role="radiogroup" aria-label={c.label} className="grid grid-cols-3 gap-1.5">
          {c.options.map((o) => (
            <button
              key={o.value}
              role="radio"
              aria-checked={design.shape === o.value}
              onClick={() => onChange({ shape: o.value })}
              className={cx(
                "flex flex-col items-center gap-1 rounded-2xl border px-2 py-2 text-xs transition-colors",
                design.shape === o.value ? "border-sage-500 bg-sage-50 text-sage-900" : "border-line bg-white text-muted hover:border-sage-300",
              )}
            >
              <ShapeIcon shape={o.value} />
              {o.label}
            </button>
          ))}
        </div>
      )}

      {c.kind === "toggle" && (
        <div id={inputId} role="radiogroup" aria-label={c.label} className="grid grid-cols-2 gap-1.5">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              role="radio"
              aria-checked={design[c.key] === v}
              disabled={!!disabled}
              onClick={() => onChange({ [c.key]: v } as Partial<CellDesign>)}
              className={cx(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed",
                design[c.key] === v ? "border-sage-500 bg-sage-600 text-white" : "border-line bg-white text-muted hover:border-sage-300",
              )}
            >
              {v ? c.on : c.off}
            </button>
          ))}
        </div>
      )}

      <p className="flex gap-1.5 text-[11.5px] leading-snug text-faint">
        <Info className="mt-px h-3 w-3 shrink-0" />
        {disabled ?? c.help}
      </p>
    </div>
  );
}

function ShapeIcon({ shape }: { shape: CellDesign["shape"] }) {
  const common = "fill-sage-100 stroke-sage-600";
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      {shape === "polyhedral" && <path d="M16 3 27 9.5v13L16 29 5 22.5v-13Z" className={common} strokeWidth="2" strokeLinejoin="round" />}
      {shape === "rounded" && <circle cx="16" cy="16" r="12" className={common} strokeWidth="2" />}
      {shape === "elongated" && <rect x="10" y="2" width="12" height="28" rx="4" className={common} strokeWidth="2" />}
    </svg>
  );
}
