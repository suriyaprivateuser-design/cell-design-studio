/**
 * 3D tissue block: a thick slice of many cells, built by extruding the same
 * tissue section the 2D preview draws. Every slider therefore changes the
 * block too (cell size and number, wall thickness, lignin, vacuole size,
 * intercellular spaces, living/dead, plastid type).
 *
 * Walls stand full height as rims; the protoplast sits a little lower, with a
 * glossy domed vacuole, a nucleus at the top of the cytoplasm and plastids
 * lining the wall (also on the block's cut sides). Options let other tissues
 * (collenchyma, sclerenchyma, meristem) reuse the same builder.
 */
import * as THREE from "three";
import { hasSecondaryWall, type CellDesign } from "@/simulation/design";
import { area, buildSection, perimeter, pointAlong, roundedInset, type Pt, type SectionCell } from "@/tissue/section";
import { CELL_COLORS as C } from "./palette";
import { ModelBuilder, mat, rng, shape2, prism, type P2, type ToonModel } from "./toon/kit";

const FIELD = 240; // section units
export const BLOCK_SIZE = 3.4; // world units across
export const BLOCK_DEPTH = 0.55;
const S = BLOCK_SIZE / FIELD;

export interface BlockOptions {
  /** Cells across the field for the smallest cell size */
  targetCells?: number;
  /** Every cell shows its nucleus, centred and large (meristem) */
  nucleusInEveryCell?: boolean;
  nucleusScale?: number;
  cytoplasmColor?: string;
  wallColor?: string;
  /** "dome": one large glossy vacuole; "small": a few tiny vacuoles; "none" */
  vacuoleMode?: "dome" | "small" | "none";
  /** Multiplies wall thickness / corner thickening (see SectionOptions) */
  wallScale?: number;
  cornerScale?: number;
  /** Text for the wall label */
  wallLabel?: string;
  /** Extra geometry drawn per cell (e.g. pit canals in sclereids) */
  extra?: (b: ModelBuilder, cell: SectionCell, toWorld: (p: Pt, y: number) => THREE.Vector3) => void;
  seed?: number;
}

/** Section point → world (block centred on the origin, top face up). */
export function toWorld(p: Pt, y: number) {
  return new THREE.Vector3((p[0] - FIELD / 2) * S, y, (p[1] - FIELD / 2) * S);
}
const w2 = (poly: Pt[]): P2[] => poly.map((p) => [(p[0] - FIELD / 2) * S, (p[1] - FIELD / 2) * S]);
const shapeOf = (outline: Pt[], holes: Pt[][] = []) => shape2(w2(outline), holes.filter((h) => h.length > 2).map(w2));
/** Extruded outline, or null when the outline has collapsed (e.g. a lumen filled by a thick wall). */
const slab = (outline: Pt[], holes: Pt[][], y0: number, h: number, dome = 0) => (outline.length > 2 ? prism(shapeOf(outline, holes), y0, h, dome) : null);
export const SECTION_TO_WORLD = S;

export function buildTissueBlock(d: CellDesign, opts: BlockOptions = {}): ToonModel {
  const { targetCells = 64, nucleusInEveryCell = false, nucleusScale = 1.3, vacuoleMode = "dome", seed = 17 } = opts;
  const section = buildSection(d, "cross", FIELD, FIELD, seed, {
    targetCells,
    clipToField: true,
    plastidsPerCell: 0,
    wallScale: opts.wallScale,
    cornerScale: opts.cornerScale,
  });
  // Ink lines scale with the cells so small cells are not swamped by their outlines.
  const sizes = section.cells.map((c) => Math.sqrt(Math.abs(area(c.shapes.outer))) * S).sort((a, b) => a - b);
  const INK = Math.min(0.009, Math.max(0.0025, (sizes[Math.floor(sizes.length / 2)] ?? 0.6) * 0.014));
  const H = BLOCK_DEPTH;
  const dome = 0.09;
  const vacDepth = H * 0.6;
  const vacTop = vacDepth + 2 * dome;
  const b = new ModelBuilder();
  const rand = rng(seed * 31 + 7);
  const secondary = hasSecondaryWall(d);
  const lignified = secondary && d.lignified;
  const cytoColor = opts.cytoplasmColor ?? C.cytoplasm;
  const half = BLOCK_SIZE / 2;

  // Floor: what shows through the intercellular spaces.
  b.add("floor", C.space, prism(shape2([[-half, -half], [half, -half], [half, half], [-half, half]]), -0.02, 0.025), { outline: 0 });

  for (const c of section.cells) {
    const sh = c.shapes;
    if (sh.outer.length < 3) continue;
    const cellSize = Math.sqrt(Math.abs(area(sh.outer)));
    b.add("ml", C.middleLamella, slab(sh.outer, [sh.primary], 0, H), { outline: INK });
    b.add("pw", opts.wallColor ?? C.primaryWall, slab(sh.primary, [sh.pwInner], 0, H), { outline: 0 });
    if (secondary) b.add("sw", lignified ? C.lignin : C.secondaryWall, slab(sh.pwInner, [sh.lumen], 0, H), { outline: 0 });
    opts.extra?.(b, c, toWorld);

    if (!d.living || !sh.membrane) {
      // Dead cell: an empty lumen, seen as a floor deep inside the walls.
      b.add("lumen", C.lumen, slab(sh.lumen, [], 0, H * 0.12), { outline: 0 });
      continue;
    }

    const vac = vacuoleMode === "dome" ? sh.vacuole : null;
    const cytoTop = H * 0.92;
    b.add("cyto", cytoColor, slab(sh.lumen, vac && vac.length > 2 ? [vac] : [], 0, cytoTop), { outline: 0 });

    if (vac && vac.length > 2) {
      if (c.edge) {
        b.add("vac", C.vacuole, slab(vac, [], 0, H * 0.9), { outline: 0 });
      } else {
        b.add("vac", C.vacuole, slab(vac, [], 0, vacDepth, dome), { outline: INK * 0.7 });
        // Anime gloss: a soft white streak and a dot on the light side of the dome.
        const cc = vac.reduce((a, p) => [a[0] + p[0] / vac.length, a[1] + p[1] / vac.length], [0, 0]) as Pt;
        const r = Math.sqrt(Math.abs(area(vac)) / Math.PI) * S;
        const hl = toWorld(cc, vacTop + 0.004).add(new THREE.Vector3(-r * 0.35, 0, -r * 0.3));
        b.instance("gloss-disc", "#ffffff", "disc", mat(hl, [r * 0.34, 1, r * 0.13], [0, 0.6, 0]), { flat: true });
        b.instance("gloss-disc", "#ffffff", "disc", mat(hl.clone().add(new THREE.Vector3(r * 0.32, 0, r * 0.18)), [r * 0.06, 1, r * 0.06]), { flat: true });
      }
    } else if (vacuoleMode === "small" && !c.edge) {
      // A few tiny vacuoles in dense cytoplasm (young, dividing cells).
      for (let k = 0; k < 3; k++) {
        const a = rand() * Math.PI * 2;
        const dist = cellSize * (0.22 + rand() * 0.1);
        const p = toWorld([c.centre[0] + Math.cos(a) * dist, c.centre[1] + Math.sin(a) * dist], cytoTop);
        b.instance("smallvac", C.vacuole, "sphere", mat(p, [cellSize * S * 0.07, cellSize * S * 0.03, cellSize * S * 0.07]), { outline: INK * 0.5 });
      }
    }

    // Nucleus: a speckled sphere with a highlight, at the top of the cytoplasm.
    const nuc = nucleusInEveryCell ? (c.edge ? null : { c: c.centre, r: Math.sqrt(Math.abs(area(sh.lumen)) / Math.PI) * 0.4 }) : c.nucleus;
    if (nuc) {
      const r = nucleusInEveryCell ? nuc.r * S : nuc.r * S * nucleusScale;
      const top = vacuoleMode === "dome" ? vacTop : cytoTop;
      const p = toWorld(nuc.c, top - r * 0.25);
      b.instance("nucleus", C.nucleus, "sphere", mat(p, r), { outline: INK });
      b.instance("nucleolus", C.nucleolus, "sphere", mat(p.clone().add(new THREE.Vector3(r * 0.15, r * 0.62, r * 0.12)), r * 0.36));
      for (let k = 0; k < 5; k++) {
        const a = rand() * Math.PI * 2;
        const e = 0.35 + rand() * 0.5;
        const dir = new THREE.Vector3(Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e));
        b.instance("chromatin", "#8a6fd0", "sphere", mat(p.clone().add(dir.multiplyScalar(r * 0.93)), r * 0.13));
      }
      b.instance("gloss-dot", "#ffffff", "sphere", mat(p.clone().add(new THREE.Vector3(-r * 0.4, r * 0.75, r * 0.3)), r * 0.16), { flat: true });
    }

    if (d.plastids !== "none") addPlastids(b, d, c, cellSize, H, rand, INK);
  }

  addLabels(b, d, section.cells, H, vacTop, opts);
  return b.build(new THREE.Vector3(0.6, 6.2, 4.4), new THREE.Vector3(0, 0.2, 0), -0.03);
}

/** Plastids lining the wall: one or two rows on top, and columns on the block's cut sides. */
function addPlastids(b: ModelBuilder, d: CellDesign, c: SectionCell, cellSize: number, H: number, rand: () => number, INK: number) {
  const membrane = c.shapes.membrane;
  if (!membrane) return;
  const chloro = d.plastids === "chloroplast";
  const size = cellSize * (chloro ? 0.042 : 0.05);
  const color = chloro ? C.chloroplast : C.amyloplast;
  const key = chloro ? "chloroplast" : "amyloplast";
  const rows = chloro ? [1.05, 3.1] : [1.2];
  rows.forEach((inset, row) => {
    const ring = roundedInset(membrane, size * inset, size);
    if (ring.length < 3) return;
    const per = perimeter(ring);
    const step = size * (chloro ? 2.25 : 3.1) * (row ? 1.15 : 1);
    const n = Math.floor(per / step);
    const off = rand();
    for (let k = 0; k < n; k++) {
      if (row && rand() < 0.35) continue;
      const [p, ang] = pointAlong(ring, ((k + off + row * 0.5) / n) * per);
      if (c.nucleus && Math.hypot(p[0] - c.nucleus.c[0], p[1] - c.nucleus.c[1]) < c.nucleus.r * 1.3 + size) continue;
      const v = toWorld(p, H * 0.93);
      const k2 = chloro ? 0.9 + rand() * 0.25 : 0.75 + rand() * 0.6;
      const sx = size * S * k2 * (chloro ? 1.45 : 1);
      const sz = size * S * k2 * (chloro ? 0.75 : 0.9);
      b.instance(key, color, "sphere", mat(v, [sx, Math.min(sx, sz) * (chloro ? 0.6 : 0.9), sz], [0, -ang, 0]), { outline: INK * 0.6 });
    }
  });

  // On the cut sides of the block the plastids show as columns lining the wall.
  if (!c.edge) return;
  const ring = roundedInset(membrane, size * 1.05, size);
  const per = perimeter(ring);
  const step = size * 2.4;
  for (let t = 0; t < per; t += step) {
    const [p] = pointAlong(ring, t);
    const side = sideOf(p, size * 1.6);
    if (!side) continue;
    for (let h = 0.16; h < 0.86; h += chloro ? 0.13 : 0.2) {
      const v = toWorld(p, H * h);
      v.add(side.clone().multiplyScalar(0.004));
      const sx = size * S * (chloro ? 1.35 : 1);
      b.instance(key, color, "sphere", mat(v, [side.x ? sx * 0.45 : sx, size * S * 0.8, side.z ? sx * 0.45 : sx]), { outline: INK * 0.6 });
    }
  }
}

/** Outward direction of the block face a point lies on, if it lies on one. */
function sideOf(p: Pt, tol: number): THREE.Vector3 | null {
  if (p[0] < tol) return new THREE.Vector3(-1, 0, 0);
  if (p[0] > FIELD - tol) return new THREE.Vector3(1, 0, 0);
  if (p[1] < tol) return new THREE.Vector3(0, 0, -1);
  if (p[1] > FIELD - tol) return new THREE.Vector3(0, 0, 1);
  return null;
}

function addLabels(b: ModelBuilder, d: CellDesign, cells: SectionCell[], H: number, vacTop: number, opts: BlockOptions) {
  // Each label goes on a cell in a different part of the block so they do not pile up.
  const inner = cells.filter((c) => !c.edge);
  const used = new Set<number>();
  const F = FIELD;
  const pick = (want: (c: SectionCell) => boolean, at: Pt) => {
    const c = inner
      .filter((x) => !used.has(x.id) && want(x))
      .sort((p, q) => Math.hypot(p.centre[0] - at[0], p.centre[1] - at[1]) - Math.hypot(q.centre[0] - at[0], q.centre[1] - at[1]))[0];
    if (c) used.add(c.id);
    return c;
  };
  const centreOf = (poly: Pt[]) => poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]) as Pt;
  const mode = opts.vacuoleMode ?? "dome";
  if (d.living) {
    if (mode === "dome") {
      const v = pick((c) => !!c.shapes.vacuole, [F * 0.3, F * 0.3]);
      if (v?.shapes.vacuole) b.label("vacuole", "แวคิวโอล · Vacuole", toWorld(centreOf(v.shapes.vacuole), vacTop));
    }
    const n = pick((c) => !!opts.nucleusInEveryCell || !!c.nucleus, [F * 0.72, F * 0.28]);
    if (n) b.label("nucleus", "นิวเคลียส · Nucleus", toWorld(opts.nucleusInEveryCell ? n.centre : (n.nucleus?.c ?? n.centre), (mode === "dome" ? vacTop : H) + 0.06));
    if (d.plastids !== "none") {
      const p = pick((c) => !!c.shapes.membrane, [F * 0.7, F * 0.62]);
      if (p?.shapes.membrane) {
        const m = p.shapes.membrane;
        b.label("plastid", d.plastids === "chloroplast" ? "คลอโรพลาสต์ · Chloroplast" : "อะไมโลพลาสต์ (เม็ดแป้ง) · Amyloplast", toWorld(m[Math.floor(m.length / 3)], H * 0.95));
      }
    }
    if (mode !== "dome") {
      const cy = pick(() => true, [F * 0.3, F * 0.3]);
      if (cy?.shapes.membrane) {
        const m = cy.shapes.membrane;
        b.label("cytoplasm", "ไซโทพลาซึมหนาแน่น · Dense cytoplasm", toWorld(m[Math.floor(m.length / 6)], H * 0.93));
      }
    }
  } else {
    const l = pick(() => true, [F * 0.5, F * 0.4]);
    if (l) b.label("lumen", "ลูเมน: ไม่มีโพรโทพลาสต์ · Lumen", toWorld(l.centre, H * 0.12));
  }
  const w = pick(() => true, [F * 0.25, F * 0.62]);
  const lignified = hasSecondaryWall(d) && d.lignified;
  if (w) {
    const ring = lignified ? w.shapes.pwInner : w.shapes.primary;
    b.label(
      "wall",
      opts.wallLabel ?? (lignified ? "ผนังทุติยภูมิที่มีลิกนิน · Lignified secondary wall" : "ผนังเซลล์ · Cell wall"),
      toWorld(ring[Math.floor(ring.length * 0.6)], H),
    );
  }
  const space = spaceAnchor(cells.map((c) => c.centre));
  if (space && d.intercellularSpace > 0.05) b.label("space", "ช่องว่างระหว่างเซลล์ · Intercellular space", toWorld(space, H * 0.5));
}

/** Centre of three mutually close cells (where an intercellular space opens). */
function spaceAnchor(centres: Pt[]): Pt | null {
  let best: Pt | null = null;
  let bestD = Infinity;
  for (let i = 0; i < centres.length; i++) {
    for (let j = i + 1; j < centres.length; j++) {
      for (let k = j + 1; k < centres.length; k++) {
        const [a, b, c] = [centres[i], centres[j], centres[k]];
        const m: Pt = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3];
        const spread = Math.max(Math.hypot(a[0] - m[0], a[1] - m[1]), Math.hypot(b[0] - m[0], b[1] - m[1]), Math.hypot(c[0] - m[0], c[1] - m[1]));
        const score = spread * 3 + Math.hypot(m[0] - FIELD * 0.5, m[1] - FIELD * 0.82);
        if (score < bestD) {
          bestD = score;
          best = m;
        }
      }
    }
  }
  return best;
}
