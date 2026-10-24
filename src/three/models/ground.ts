/**
 * Ground tissues and meristem as tissue blocks (same builder as parenchyma):
 * collenchyma, sclerenchyma (fibres, sclereids) and apical meristem.
 */
import * as THREE from "three";
import { DEFAULT_DESIGN, type CellDesign } from "@/simulation/design";
import { area, centroid, pointAlong, perimeter, type Pt } from "@/tissue/section";
import { BLOCK_DEPTH, buildTissueBlock, toWorld } from "../tissueBlock";
import { CELL_COLORS as C, MODEL_COLORS as M } from "../palette";
import { mat, prism, shape2, type ToonModel } from "../toon/kit";

/** Angular collenchyma: living cells, primary walls thickened at the corners, few spaces. */
export const COLLENCHYMA_DESIGN: CellDesign = {
  ...DEFAULT_DESIGN,
  shape: "polyhedral",
  size: 0.3,
  primaryWall: 0.12,
  cornerThickening: 0.9,
  secondaryWall: 0,
  lignified: false,
  vacuole: 0.55,
  intercellularSpace: 0.02,
  living: true,
  plastids: "none",
};

export function collenchymaModel(): ToonModel {
  return buildTissueBlock(COLLENCHYMA_DESIGN, {
    targetCells: 70,
    wallLabel: "ผนังปฐมภูมิหนาตรงมุมเซลล์ · Thickened corners",
    // Collenchyma walls are pale and glistening (cellulose and pectin, no lignin).
    wallColor: "#f4f8de",
    cornerScale: 1.9,
    seed: 23,
  });
}

/** Fibres in cross-section: small cells, very thick lignified secondary walls, narrow lumen, dead. */
export const FIBER_DESIGN: CellDesign = {
  ...DEFAULT_DESIGN,
  shape: "polyhedral",
  size: 0.08,
  primaryWall: 0.1,
  secondaryWall: 0.95,
  lignified: true,
  vacuole: 0,
  intercellularSpace: 0,
  living: false,
  plastids: "none",
};

export function fiberModel(): ToonModel {
  return buildTissueBlock(FIBER_DESIGN, { targetCells: 70, seed: 31, wallScale: 1.9 });
}

/** Sclereids (stone cells): isodiametric, very thick layered lignified walls crossed by pit canals. */
export const SCLEREID_DESIGN: CellDesign = { ...FIBER_DESIGN, size: 0.42, secondaryWall: 1, intercellularSpace: 0.04 };

export function sclereidModel(): ToonModel {
  const H = BLOCK_DEPTH;
  const model = buildTissueBlock(SCLEREID_DESIGN, {
    targetCells: 70,
    seed: 41,
    wallScale: 1.7,
    extra: (b, cell) => {
      const sh = cell.shapes;
      if (cell.edge || sh.lumen.length < 3 || sh.pwInner.length < 3) return;
      // Concentric growth layers of the secondary wall.
      for (const k of [0.35, 0.7]) {
        const outer = blend(sh.pwInner, sh.lumen, k);
        const inner = blend(sh.pwInner, sh.lumen, k + 0.06);
        b.add("sw-layer", "#b35f3d", prism(shape2(outer.map(w), [inner.map(w)]), H, 0.004), { outline: 0 });
      }
      // Simple pit canals running from the lumen out through the thick wall.
      const per = perimeter(sh.lumen);
      for (let i = 0; i < 7; i++) {
        const [p] = pointAlong(sh.lumen, (i / 7) * per);
        const c = centroid(sh.lumen);
        const dir = [p[0] - c[0], p[1] - c[1]];
        const len = Math.hypot(dir[0], dir[1]) || 1;
        const reach = Math.sqrt(Math.abs(area(sh.pwInner)) / Math.PI) - len;
        const from = toWorld(p, H + 0.006);
        const to = toWorld([p[0] + (dir[0] / len) * reach * 0.85, p[1] + (dir[1] / len) * reach * 0.85], H + 0.006);
        const mid = from.clone().add(to).multiplyScalar(0.5);
        const ang = Math.atan2(to.z - from.z, to.x - from.x);
        b.instance("pit-canal", C.lumen, "box", mat(mid, [from.distanceTo(to), 0.004, 0.018], [0, -ang, 0]), { flat: true });
      }
    },
  });
  return model;
}

/** Apical meristem: small, tightly packed cells, thin walls, large central nucleus, dense cytoplasm. */
export const MERISTEM_DESIGN: CellDesign = {
  ...DEFAULT_DESIGN,
  shape: "polyhedral",
  size: 0.05,
  primaryWall: 0.02,
  cornerThickening: 0,
  secondaryWall: 0,
  vacuole: 0,
  intercellularSpace: 0,
  living: true,
  plastids: "none",
};

export function meristemModel(): ToonModel {
  return buildTissueBlock(MERISTEM_DESIGN, {
    targetCells: 60,
    seed: 53,
    nucleusInEveryCell: true,
    vacuoleMode: "small",
    cytoplasmColor: M.denseCytoplasm,
    wallLabel: "ผนังปฐมภูมิบาง · Thin primary wall",
  });
}

const w = (p: Pt): [number, number] => {
  const v = toWorld(p, 0);
  return [v.x, v.z];
};

/** Outline part-way between two outlines with the same shape (resampled by arc length). */
function blend(a: Pt[], b: Pt[], k: number): Pt[] {
  const n = 48;
  const ca = centroid(a);
  const cb = centroid(b);
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const ra = rayHit(a, ca, ang);
    const rb = rayHit(b, cb, ang);
    out.push([ra[0] + (rb[0] - ra[0]) * k, ra[1] + (rb[1] - ra[1]) * k]);
  }
  return out;
}

/** Point where a ray from c at angle ang leaves a convex outline. */
function rayHit(poly: Pt[], c: Pt, ang: number): Pt {
  const d = new THREE.Vector2(Math.cos(ang), Math.sin(ang));
  let best = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const ex = q[0] - p[0];
    const ey = q[1] - p[1];
    const den = d.x * ey - d.y * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((p[0] - c[0]) * ey - (p[1] - c[1]) * ex) / den;
    const u = ((p[0] - c[0]) * d.y - (p[1] - c[1]) * d.x) / den;
    if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
  }
  return [c[0] + d.x * best, c[1] + d.y * best];
}
