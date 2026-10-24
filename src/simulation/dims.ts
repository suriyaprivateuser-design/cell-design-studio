/**
 * Model dimensions for a design, shared by the 3D model and the 2D tissue
 * section so both pictures always match.
 *
 * Units: the cell's mean radius is 1 × scale. Wall thicknesses are exaggerated
 * relative to the cell so they are visible (a real primary wall is ~0.1–1 µm
 * on a 20–150 µm cell); a thicker slider value is always a thicker wall.
 */
import { hasSecondaryWall, type CellDesign } from "./design";

export interface CellDims {
  scale: number;
  middleLamella: number;
  primary: number;
  corner: number;
  secondary: number;
  membraneGap: number;
  /** linear scale of the vacuole relative to the protoplast */
  vacuoleScale: number;
  nucleusRadius: number;
}

export function cellDims(d: CellDesign): CellDims {
  const vacuoleVolume = 0.1 + 0.78 * d.vacuole;
  return {
    scale: 0.62 + 0.6 * d.size,
    middleLamella: 0.012,
    primary: 0.016 + 0.1 * d.primaryWall,
    corner: 0.2 * d.cornerThickening,
    secondary: hasSecondaryWall(d) ? 0.03 + 0.17 * d.secondaryWall : 0,
    membraneGap: 0.006,
    vacuoleScale: Math.cbrt(vacuoleVolume),
    nucleusRadius: 0.15,
  };
}

