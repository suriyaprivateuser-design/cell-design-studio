/**
 * 2D tissue section generator (what a thin slice of the tissue would look like
 * under a light microscope), built from the same CellDesign as the 3D model.
 *
 * Cells are the Voronoi regions of a jittered lattice, so neighbours share a
 * wall when the tissue is compact. Intercellular spaces open where cells round
 * off at their corners, which is where they form in real tissue. Wall
 * thickness uses the same exaggeration as the 3D model (cellDims).
 */
import { cellDims } from "@/simulation/dims";
import { effectiveSpace, type CellDesign } from "@/simulation/design";

export type Pt = [number, number];
export type SectionView = "cross" | "long";

export interface SectionCell {
  id: number;
  centre: Pt;
  outer: string;
  primary: string;
  secondary: string | null;
  lumen: string;
  membrane: string | null;
  vacuole: string | null;
  nucleus: { c: Pt; r: number } | null;
  plastids: { c: Pt; rx: number; ry: number; angle: number }[];
}

export interface Section {
  width: number;
  height: number;
  cells: SectionCell[];
  /** Length in view units of a 50 µm scale bar */
  scaleBar50: number;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Keep the part of a convex polygon on the side where n·p ≤ c. */
function clipHalfPlane(poly: Pt[], n: Pt, c: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = n[0] * a[0] + n[1] * a[1] - c;
    const db = n[0] * b[0] + n[1] * b[1] - c;
    if (da <= 0) out.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

function area(poly: Pt[]) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

function centroid(poly: Pt[]): Pt {
  let x = 0,
    y = 0;
  for (const p of poly) {
    x += p[0];
    y += p[1];
  }
  return [x / poly.length, y / poly.length];
}

/** Inset a convex CCW polygon by d (intersection of shifted edge half-planes). */
function inset(poly: Pt[], d: number): Pt[] {
  let out = poly;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const len = Math.hypot(ex, ey) || 1;
    // Outward normal of a CCW polygon (y up) is (ey, -ex).
    const n: Pt = [ey / len, -ex / len];
    const c = n[0] * a[0] + n[1] * a[1] - d;
    out = clipHalfPlane(out, n, c);
    if (out.length < 3) return [];
  }
  return out;
}

/** Inset by d with corners rounded to radius r (Minkowski sum of a smaller polygon and a disc). */
function roundedInset(poly: Pt[], d: number, r: number): Pt[] {
  let q = inset(poly, d + r);
  let rr = r;
  if (q.length < 3 || Math.abs(area(q)) < 1e-3) {
    // Too small for a polygon core: shrink the rounding until it fits, else a circle.
    for (let k = 0.75; k > 0.05; k -= 0.15) {
      rr = r * k;
      q = inset(poly, d + rr);
      if (q.length >= 3 && Math.abs(area(q)) > 1e-3) break;
    }
    if (q.length < 3) {
      const c = centroid(poly);
      const ri = Math.max(0.5, inradius(poly, c) - d);
      return circle(c, ri);
    }
  }
  const out: Pt[] = [];
  const steps = 5;
  for (let i = 0; i < q.length; i++) {
    const prev = q[(i - 1 + q.length) % q.length];
    const cur = q[i];
    const next = q[(i + 1) % q.length];
    const a0 = Math.atan2(-(cur[0] - prev[0]), cur[1] - prev[1]);
    let a1 = Math.atan2(-(next[0] - cur[0]), next[1] - cur[1]);
    while (a1 < a0) a1 += Math.PI * 2;
    for (let s = 0; s <= steps; s++) {
      const a = a0 + ((a1 - a0) * s) / steps;
      out.push([cur[0] + rr * Math.cos(a), cur[1] + rr * Math.sin(a)]);
    }
  }
  return out;
}

function inradius(poly: Pt[], c: Pt) {
  let m = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    m = Math.min(m, Math.abs(cross(a, b, c)) / len);
  }
  return m;
}

function circle(c: Pt, r: number, n = 28): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)] as Pt;
  });
}

function scaleAbout(poly: Pt[], c: Pt, k: number): Pt[] {
  return poly.map((p) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k]);
}

export function toPath(poly: Pt[]): string {
  if (poly.length === 0) return "";
  return "M" + poly.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join("L") + "Z";
}

/** Lattice spacing multipliers (x, y) per shape and view. */
function lattice(d: CellDesign, view: SectionView): { sx: number; sy: number; brick: boolean } {
  if (d.shape === "elongated") return view === "cross" ? { sx: 0.68, sy: 0.68, brick: false } : { sx: 0.68, sy: 2.1, brick: true };
  return { sx: 1, sy: 1, brick: false };
}

export function buildSection(d: CellDesign, view: SectionView, width = 320, height = 220, seed = 11): Section {
  const dims = cellDims(d);
  // Cell diameter in view units. A hexagonal cell covers ~0.87·D², so the smallest
  // cells give a field of about 80: enough to read the tissue, cheap to redraw while sliding.
  const D = Math.sqrt((width * height) / (0.87 * 80)) * (1 + 1.1 * d.size);
  const { sx, sy, brick } = lattice(d, view);
  const dx = D * sx;
  const dy = brick ? D * sy : D * sy * 0.866;
  const rand = rng(seed);
  const jitter = brick ? 0.05 : 0.13;

  const sites: Pt[] = [];
  const cols = Math.ceil(width / dx) + 3;
  const rows = Math.ceil(height / dy) + 3;
  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      const off = j % 2 ? dx / 2 : 0;
      sites.push([i * dx + off + (rand() - 0.5) * jitter * dx, j * dy + (rand() - 0.5) * jitter * dy]);
    }
  }

  const minD = Math.min(dx, dy);
  // Convert 3D model thickness (relative to cell radius) to section units.
  const unit = (t: number) => (t / (2 * dims.scale)) * minD * 1.15;
  const space = effectiveSpace(d);
  const gap = space * 0.2 * minD;
  const roundR = d.shape === "rounded" ? 0.5 * minD : 0.04 * minD + space * 0.32 * minD;
  const ml = unit(dims.middleLamella) * 0.5;
  const pw = unit(dims.primary);
  const sw = unit(dims.secondary);
  const cornerR = roundR + d.cornerThickening * 0.3 * minD;

  const cells: SectionCell[] = [];
  sites.forEach((s, idx) => {
    if (s[0] < -dx || s[0] > width + dx || s[1] < -dy || s[1] > height + dy) return;
    let poly: Pt[] = [
      [s[0] - 3 * dx, s[1] - 3 * dy],
      [s[0] + 3 * dx, s[1] - 3 * dy],
      [s[0] + 3 * dx, s[1] + 3 * dy],
      [s[0] - 3 * dx, s[1] + 3 * dy],
    ];
    for (let k = 0; k < sites.length; k++) {
      if (k === idx) continue;
      const o = sites[k];
      if (Math.abs(o[0] - s[0]) > 2.5 * dx || Math.abs(o[1] - s[1]) > 2.5 * dy) continue;
      const n: Pt = [o[0] - s[0], o[1] - s[1]];
      const mid: Pt = [(o[0] + s[0]) / 2, (o[1] + s[1]) / 2];
      poly = clipHalfPlane(poly, n, n[0] * mid[0] + n[1] * mid[1]);
    }
    if (poly.length < 3) return;
    if (area(poly) < 0) poly.reverse();

    const c = centroid(poly);
    const outer = roundedInset(poly, gap / 2, roundR);
    const primary = roundedInset(poly, gap / 2 + ml, roundR);
    const pwInner = roundedInset(poly, gap / 2 + ml + pw, cornerR);
    const swInner = sw > 0 ? roundedInset(poly, gap / 2 + ml + pw + sw, cornerR + sw * 0.6) : pwInner;
    const cell: SectionCell = {
      id: idx,
      centre: c,
      outer: toPath(outer),
      primary: toPath(primary),
      secondary: sw > 0 ? toPath(pwInner) : null,
      lumen: toPath(swInner),
      membrane: null,
      vacuole: null,
      nucleus: null,
      plastids: [],
    };

    if (d.living) {
      const membrane = roundedInset(poly, gap / 2 + ml + pw + sw + 0.6, cornerR + sw * 0.6);
      const cc = centroid(membrane);
      const vac = scaleAbout(membrane, cc, dims.vacuoleScale);
      cell.membrane = toPath(membrane);
      cell.vacuole = toPath(vac);
      const r = rng(seed * 997 + idx);
      const ri = inradius(membrane.length > 2 ? membrane : poly, cc);
      // A thin section cuts through the nucleus in only some of the cells.
      if (r() < 0.6) {
        const rn = Math.min(unit(dims.nucleusRadius) * 1.6, ri * 0.45);
        const a = r() * Math.PI * 2;
        const dist = Math.max(0, ri - rn - 0.8) * Math.pow(d.vacuole, 0.8);
        cell.nucleus = { c: [r2(cc[0] + Math.cos(a) * dist), r2(cc[1] + Math.sin(a) * dist)], r: r2(rn) };
      }
      if (d.plastids !== "none") {
        const count = d.plastids === "amyloplast" ? 4 : 5;
        const ring = Math.max(1.2, ri * (1 - dims.vacuoleScale) * 0.5 + 0.8);
        for (let k = 0; k < count; k++) {
          const a = r() * Math.PI * 2;
          const dist = Math.max(0, ri - ring);
          const p: Pt = [cc[0] + Math.cos(a) * dist, cc[1] + Math.sin(a) * dist];
          if (cell.nucleus && Math.hypot(p[0] - cell.nucleus.c[0], p[1] - cell.nucleus.c[1]) < cell.nucleus.r + 2) continue;
          const size = d.plastids === "amyloplast" ? 1.4 + r() * 1.4 : 1.8;
          cell.plastids.push({
            c: [r2(p[0]), r2(p[1])],
            rx: r2(size * (d.plastids === "amyloplast" ? 1 : 1.5)),
            ry: r2(size * (d.plastids === "amyloplast" ? 0.85 : 0.75)),
            angle: r2((a * 180) / Math.PI + 90),
          });
        }
      }
    }
    cells.push(cell);
  });

  const um = 20 + 130 * d.size;
  return { width, height, cells, scaleBar50: r2((D / um) * 50) };
}
