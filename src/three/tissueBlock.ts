/**
 * 3D tissue block: a thick slice of many cells, built by extruding the same
 * tissue section the 2D preview draws. Every slider therefore changes the
 * block too (cell size and number, wall thickness, lignin, vacuole size,
 * intercellular spaces, living/dead, plastid type).
 *
 * Walls are extruded full height so they stand as rims; the protoplast sits a
 * little lower, with a domed vacuole, a nucleus in the cytoplasm and plastids
 * lining the wall. Geometry is merged per material to keep draw calls low.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { hasSecondaryWall, type CellDesign } from "@/simulation/design";
import { buildSection, type Pt } from "@/tissue/section";

const FIELD = 240; // section units
export const BLOCK_SIZE = 3.4; // world units across
export const BLOCK_DEPTH = 0.55;
const VAC_DOME = 0.1;
const S = BLOCK_SIZE / FIELD;

export type BlockPart = "ml" | "pw" | "sw" | "cytoplasm" | "vacuole" | "lumenFloor";

export interface TissueBlockParts {
  meshes: Partial<Record<BlockPart, THREE.BufferGeometry>>;
  nuclei: { position: THREE.Vector3; radius: number }[];
  plastids: { position: THREE.Vector3; rotation: number; rx: number; ry: number }[];
  anchors: Record<string, THREE.Vector3>;
}

/** Section point → world (block centred on the origin, top face up). */
function toWorld(p: Pt, y: number) {
  return new THREE.Vector3((p[0] - FIELD / 2) * S, y, (p[1] - FIELD / 2) * S);
}

function shapeOf(outline: Pt[], holes: Pt[][] = []) {
  const shape = new THREE.Shape(outline.map((p) => new THREE.Vector2((p[0] - FIELD / 2) * S, -(p[1] - FIELD / 2) * S)));
  for (const h of holes) {
    if (h.length > 2) shape.holes.push(new THREE.Path(h.map((p) => new THREE.Vector2((p[0] - FIELD / 2) * S, -(p[1] - FIELD / 2) * S))));
  }
  return shape;
}

/** Extrude a shape upward from y0 by `depth`, optionally with a rounded (bevelled) top. */
function slab(shape: THREE.Shape, y0: number, depth: number, bevel = 0) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel * 0.7,
    // Keep the base of the dome on the outline instead of spreading past it.
    bevelOffset: -bevel * 0.7,
    bevelSegments: 6,
    curveSegments: 4,
  });
  // Shape space XY → world XZ, extrusion → +Y.
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + (bevel > 0 ? bevel : 0), 0);
  return g;
}

export function buildTissueBlock(d: CellDesign): TissueBlockParts {
  const section = buildSection(d, "cross", FIELD, FIELD, 17, { targetCells: 64, clipToField: true, plastidsPerCell: d.plastids === "chloroplast" ? 26 : 16 });
  const H = BLOCK_DEPTH;
  const parts: Record<BlockPart, THREE.BufferGeometry[]> = { ml: [], pw: [], sw: [], cytoplasm: [], vacuole: [], lumenFloor: [] };
  const nuclei: TissueBlockParts["nuclei"] = [];
  const plastids: TissueBlockParts["plastids"] = [];
  const secondary = hasSecondaryWall(d);

  for (const c of section.cells) {
    const sh = c.shapes;
    if (sh.outer.length < 3) continue;
    parts.ml.push(slab(shapeOf(sh.outer, [sh.primary]), 0, H));
    parts.pw.push(slab(shapeOf(sh.primary, [sh.pwInner]), 0, H));
    if (secondary) parts.sw.push(slab(shapeOf(sh.pwInner, [sh.lumen]), 0, H));

    if (d.living && sh.vacuole) {
      parts.cytoplasm.push(slab(shapeOf(sh.lumen, [sh.vacuole]), 0, H * 0.93));
      // Domed, glossy top: the vacuole bulges up to the rim of the walls.
      // Cells cut by the block face keep a flat top so the sides read as a clean slice.
      if (sh.vacuole.length > 2) parts.vacuole.push(c.edge ? slab(shapeOf(sh.vacuole), 0, H * 0.9) : slab(shapeOf(sh.vacuole), 0, H * 0.62, VAC_DOME));
      if (c.nucleus) {
        // The nucleus sits in the cytoplasm at the top of the slice, above the vacuole.
        const r = c.nucleus.r * S * 1.3;
        nuclei.push({ position: toWorld(c.nucleus.c, H * 0.62 + 2 * VAC_DOME - r * 0.3), radius: r });
      }
      for (const p of c.plastids) {
        // Chloroplasts are drawn a little larger so the green lining reads at block scale.
        const k = d.plastids === "chloroplast" ? 1.5 : 1.15;
        plastids.push({ position: toWorld(p.c, H * 0.94), rotation: (-p.angle * Math.PI) / 180, rx: p.rx * S * k, ry: p.ry * S * k });
      }
    } else {
      // Dead cell: an empty lumen, seen as a floor deep inside the walls.
      parts.lumenFloor.push(slab(shapeOf(sh.lumen), 0, H * 0.12));
    }
  }

  const meshes: TissueBlockParts["meshes"] = {};
  (Object.keys(parts) as BlockPart[]).forEach((k) => {
    if (parts[k].length) {
      meshes[k] = mergeGeometries(parts[k]) ?? undefined;
      parts[k].forEach((g) => g.dispose());
    }
  });

  // Each label goes on a cell in a different part of the block so they do not pile up.
  const inner = section.cells.filter((c) => !c.edge);
  const pick = (want: (c: (typeof inner)[number]) => boolean, avoid: Set<number>, at: Pt) => {
    const c = inner
      .filter((x) => !avoid.has(x.id) && want(x))
      .sort((p, q) => Math.hypot(p.centre[0] - at[0], p.centre[1] - at[1]) - Math.hypot(q.centre[0] - at[0], q.centre[1] - at[1]))[0];
    if (c) avoid.add(c.id);
    return c;
  };
  const F = FIELD;
  const used = new Set<number>();
  const anchors: Record<string, THREE.Vector3> = {};
  const centreOf = (poly: Pt[]) => poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]) as Pt;
  if (d.living) {
    const v = pick((c) => !!c.shapes.vacuole, used, [F * 0.3, F * 0.3]);
    if (v?.shapes.vacuole) anchors.vacuole = toWorld(centreOf(v.shapes.vacuole), H * 0.62 + 2 * VAC_DOME);
    const n = pick((c) => !!c.nucleus, used, [F * 0.72, F * 0.28]);
    if (n?.nucleus) anchors.nucleus = toWorld(n.nucleus.c, H * 0.62 + 2 * VAC_DOME + n.nucleus.r * S);
    const p = pick((c) => c.plastids.length > 0, used, [F * 0.7, F * 0.62]);
    if (p) anchors.plastid = toWorld(p.plastids[Math.floor(p.plastids.length / 3)].c, H * 0.95);
  } else {
    const l = pick(() => true, used, [F * 0.5, F * 0.4]);
    if (l) anchors.lumen = toWorld(l.centre, H * 0.12);
  }
  const w = pick(() => true, used, [F * 0.25, F * 0.62]);
  if (w) anchors.wall = toWorld(w.shapes.primary[Math.floor(w.shapes.primary.length * 0.6)], H);
  // A gap between cells near the middle: the midpoint between two neighbouring cell centres.
  const space = spaceAnchor(section.cells.map((c) => c.centre));
  if (space && d.intercellularSpace > 0.05) anchors.space = toWorld(space, H * 0.5);

  return { meshes, nuclei, plastids, anchors };
}

/** Centre of three mutually close cells (where an intercellular space opens), nearest the middle. */
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
