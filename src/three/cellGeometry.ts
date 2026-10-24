/**
 * Turns a CellDesign into real geometry: wall layers, protoplast, nucleus and
 * plastids, plus the cut faces for the cross-section and longitudinal views.
 *
 * Wall thicknesses are exaggerated relative to the cell so they are visible
 * (a real primary wall is ~0.1–1 µm on a 20–150 µm cell). The ratios between
 * designs are kept: a thicker slider value is always a thicker wall.
 */
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { effectiveSpace, hasSecondaryWall, type CellDesign } from "@/simulation/design";
import { cellDims, type CellDims } from "@/simulation/dims";
import { castRay, cornerWeight, makeField, type RaySample } from "./shape";

export type CutView = "cross" | "long";
/** Single-cell views, plus "tissue": a 3D block of many cells. */
export type View = "whole" | CutView | "tissue";

export const VIEW_LABEL: Record<View, { th: string; en: string }> = {
  whole: { th: "ทั้งเซลล์", en: "3D" },
  cross: { th: "ภาคตัดขวาง", en: "Cross-section" },
  long: { th: "ภาคตัดตามยาว", en: "Longitudinal" },
  tissue: { th: "เนื้อเยื่อ 3D", en: "Tissue block" },
};

/** Normal of the cut plane for each view; the half on the positive side is removed. */
export const CUT_NORMAL: Record<CutView, THREE.Vector3> = {
  cross: new THREE.Vector3(0, 1, 0),
  long: new THREE.Vector3(0, 0, 1),
};

/** Inset (distance in from the outer surface) of each boundary, for one ray. */
function insets(dims: CellDims, ray: RaySample) {
  const ml = dims.middleLamella;
  const pw = ml + dims.primary + dims.corner * cornerWeight(ray.corner);
  const sw = pw + dims.secondary;
  return { outer: 0, ml, pw, sw, membrane: sw + dims.membraneGap };
}

type Boundary = "outer" | "ml" | "pw" | "sw" | "membrane";

function radiusAt(dims: CellDims, ray: RaySample, boundary: Boundary): number {
  const t = insets(dims, ray)[boundary];
  return Math.max(0.04, dims.scale * ray.r - t * ray.stretch);
}

// --------------------------------------------------------------- ray caches

interface SphereBase {
  index: THREE.BufferAttribute;
  dirs: Float32Array;
  count: number;
}

let sphereBase: SphereBase | null = null;
function getSphereBase(): SphereBase {
  if (sphereBase) return sphereBase;
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, 22);
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  g = mergeVertices(g);
  const pos = g.getAttribute("position");
  const dirs = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize();
    dirs.set([v.x, v.y, v.z], i * 3);
  }
  sphereBase = { index: g.getIndex()!, dirs, count: pos.count };
  return sphereBase;
}

const rayCache = new Map<string, RaySample[]>();
function fieldKey(d: CellDesign) {
  return `${d.shape}:${effectiveSpace(d).toFixed(2)}`;
}

function surfaceRays(d: CellDesign): RaySample[] {
  const key = fieldKey(d);
  const hit = rayCache.get(key);
  if (hit) return hit;
  const field = makeField(d.shape, effectiveSpace(d));
  const base = getSphereBase();
  const rays: RaySample[] = [];
  for (let i = 0; i < base.count; i++) {
    rays.push(castRay(field, [base.dirs[i * 3], base.dirs[i * 3 + 1], base.dirs[i * 3 + 2]]));
  }
  if (rayCache.size > 24) rayCache.clear();
  rayCache.set(key, rays);
  return rays;
}

const RING = 220;
const ringCache = new Map<string, { dirs: THREE.Vector3[]; rays: RaySample[] }>();

/** Basis of the cut plane: two in-plane axes. */
function planeBasis(view: CutView): [THREE.Vector3, THREE.Vector3] {
  return view === "cross"
    ? [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1)]
    : [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)];
}

function ringRays(d: CellDesign, view: CutView) {
  const key = `${fieldKey(d)}:${view}`;
  const hit = ringCache.get(key);
  if (hit) return hit;
  const field = makeField(d.shape, effectiveSpace(d));
  const [e1, e2] = planeBasis(view);
  const dirs: THREE.Vector3[] = [];
  const rays: RaySample[] = [];
  for (let i = 0; i < RING; i++) {
    const a = (i / RING) * Math.PI * 2;
    const u = e1.clone().multiplyScalar(Math.cos(a)).add(e2.clone().multiplyScalar(Math.sin(a)));
    dirs.push(u);
    rays.push(castRay(field, [u.x, u.y, u.z]));
  }
  if (ringCache.size > 48) ringCache.clear();
  const out = { dirs, rays };
  ringCache.set(key, out);
  return out;
}

// ------------------------------------------------------------ geometry makers

function surfaceGeometry(d: CellDesign, dims: CellDims, radius: (ray: RaySample) => number): THREE.BufferGeometry {
  const base = getSphereBase();
  const rays = surfaceRays(d);
  const pos = new Float32Array(base.count * 3);
  for (let i = 0; i < base.count; i++) {
    const r = radius(rays[i]);
    pos[i * 3] = base.dirs[i * 3] * r;
    pos[i * 3 + 1] = base.dirs[i * 3 + 1] * r;
    pos[i * 3 + 2] = base.dirs[i * 3 + 2] * r;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(base.index);
  g.computeVertexNormals();
  return g;
}

/** Flat ring (or disk when inner is null) lying in the cut plane. */
function capGeometry(
  d: CellDesign,
  view: CutView,
  outer: (ray: RaySample) => number,
  inner: ((ray: RaySample) => number) | null,
  lift: number,
): THREE.BufferGeometry {
  const { dirs, rays } = ringRays(d, view);
  const n = CUT_NORMAL[view];
  const offset = n.clone().multiplyScalar(-0.002 + lift);
  const pos: number[] = [];
  const idx: number[] = [];
  if (inner) {
    for (let i = 0; i < RING; i++) {
      const ro = outer(rays[i]);
      const ri = Math.min(inner(rays[i]), ro);
      const po = dirs[i].clone().multiplyScalar(ro).add(offset);
      const pi = dirs[i].clone().multiplyScalar(ri).add(offset);
      pos.push(po.x, po.y, po.z, pi.x, pi.y, pi.z);
    }
    for (let i = 0; i < RING; i++) {
      const j = (i + 1) % RING;
      const a = i * 2,
        b = i * 2 + 1,
        c = j * 2,
        e = j * 2 + 1;
      idx.push(a, c, b, b, c, e);
    }
  } else {
    pos.push(offset.x, offset.y, offset.z);
    for (let i = 0; i < RING; i++) {
      const p = dirs[i].clone().multiplyScalar(outer(rays[i])).add(offset);
      pos.push(p.x, p.y, p.z);
    }
    for (let i = 0; i < RING; i++) idx.push(0, 1 + i, 1 + ((i + 1) % RING));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  // Face the camera side of the cut plane.
  const normals = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) normals.set([n.x, n.y, n.z], i);
  g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  fixWinding(g, n);
  return g;
}

function fixWinding(g: THREE.BufferGeometry, n: THREE.Vector3) {
  const index = g.getIndex()!;
  const p = g.getAttribute("position");
  // Check the first non-degenerate triangle and flip all if it faces away from n.
  for (let t = 0; t < index.count; t += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(p, index.getX(t));
    const b = new THREE.Vector3().fromBufferAttribute(p, index.getX(t + 1));
    const c = new THREE.Vector3().fromBufferAttribute(p, index.getX(t + 2));
    const fn = b.sub(a).cross(c.sub(a));
    if (fn.lengthSq() < 1e-12) continue;
    if (fn.dot(n) < 0) {
      const arr = index.array as Uint16Array | Uint32Array;
      for (let i = 0; i < arr.length; i += 3) {
        const tmp = arr[i + 1];
        arr[i + 1] = arr[i + 2];
        arr[i + 2] = tmp;
      }
      index.needsUpdate = true;
    }
    return;
  }
}

// ------------------------------------------------------------- cell assembly

export interface Placed {
  position: THREE.Vector3;
  radius: number;
}

export interface Plastid {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  size: THREE.Vector3;
}

export interface CellParts {
  dims: CellDims;
  /** Outer surface of the cell (middle lamella outside) */
  outer: THREE.BufferGeometry;
  /** Innermost wall surface: the lumen boundary */
  wallInner: THREE.BufferGeometry;
  membrane: THREE.BufferGeometry | null;
  vacuole: THREE.BufferGeometry | null;
  nucleus: Placed | null;
  plastids: Plastid[];
  /** Points on the cell used to pin labels */
  anchors: Record<string, THREE.Vector3>;
}

/** Deterministic pseudo-random numbers so a design always looks the same. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function buildCell(d: CellDesign): CellParts {
  const dims = cellDims(d);
  const outer = surfaceGeometry(d, dims, (r) => radiusAt(dims, r, "outer"));
  const wallInner = surfaceGeometry(d, dims, (r) => radiusAt(dims, r, "sw"));
  const living = d.living;
  const membraneR = (r: RaySample) => radiusAt(dims, r, "membrane");
  const membrane = living ? surfaceGeometry(d, dims, membraneR) : null;
  const vacuole = living ? surfaceGeometry(d, dims, (r) => membraneR(r) * dims.vacuoleScale) : null;

  // Nucleus sits on the +x axis so both cut planes pass through its centre.
  // With a large vacuole it is pushed against the wall (parietal); with a
  // small vacuole it sits nearer the middle of the cell.
  const field = makeField(d.shape, effectiveSpace(d));
  const xRay = castRay(field, [1, 0, 0]);
  const memX = membraneR(xRay);
  const rn = Math.min(dims.nucleusRadius, memX * 0.42);
  const parietal = Math.max(0, memX - rn - 0.02);
  const pull = Math.pow(d.vacuole, 0.8);
  const nucleus: Placed | null = living ? { position: new THREE.Vector3(parietal * pull, 0, 0), radius: rn } : null;

  const plastids: Plastid[] = [];
  if (living && d.plastids !== "none") {
    const rand = rng(7);
    const base = getSphereBase();
    const rays = surfaceRays(d);
    const count = d.plastids === "amyloplast" ? 26 : 22;
    let guard = 0;
    while (plastids.length < count && guard++ < 600) {
      const i = Math.floor(rand() * base.count);
      const ray = rays[i];
      const u = new THREE.Vector3(base.dirs[i * 3], base.dirs[i * 3 + 1], base.dirs[i * 3 + 2]);
      const rm = membraneR(ray);
      const rv = rm * dims.vacuoleScale;
      const size = d.plastids === "amyloplast" ? 0.07 + 0.05 * rand() : 0.08;
      // Plastids live in the cytoplasm between the membrane and the vacuole.
      const room = rm - rv;
      const depth = room > size * 1.2 ? rv + size * 0.6 + rand() * (room - size * 1.2) : rm - size * 0.9;
      const pos = u.clone().multiplyScalar(depth);
      if (nucleus && pos.distanceTo(nucleus.position) < nucleus.radius + size) continue;
      if (plastids.some((p) => p.position.distanceTo(pos) < size * 1.6)) continue;
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), u);
      const s =
        d.plastids === "amyloplast"
          ? new THREE.Vector3(size, size * 0.85, size * 0.75)
          : new THREE.Vector3(size * 1.1, size * 0.65, size * 0.35);
      plastids.push({ position: pos, quaternion: q, size: s });
    }
  }

  const at = (u: [number, number, number], boundary: Boundary, k = 1) => {
    const v = new THREE.Vector3(...u).normalize();
    const ray = castRay(field, [v.x, v.y, v.z]);
    return v.multiplyScalar(radiusAt(dims, ray, boundary) * k);
  };

  const anchors: Record<string, THREE.Vector3> = {
    wall: at([-0.55, 0.7, 0.45], "outer"),
    vacuole: living ? at([-0.4, -0.1, 0.25], "membrane", dims.vacuoleScale * 0.55) : new THREE.Vector3(),
    cytoplasm: living ? at([-0.2, -0.85, 0.5], "membrane", 0.98) : new THREE.Vector3(),
  };
  if (!living) anchors.lumen = at([-0.3, -0.2, 0.2], "sw", 0.4);
  if (nucleus) anchors.nucleus = nucleus.position.clone().add(new THREE.Vector3(0, nucleus.radius * 0.8, nucleus.radius * 0.6));
  if (plastids[0]) anchors.plastid = plastids[0].position.clone();

  return { dims, outer, wallInner, membrane, vacuole, nucleus, plastids, anchors };
}

export interface CutFace {
  id: "ml" | "pw" | "sw" | "membrane" | "cytoplasm" | "tonoplast";
  geometry: THREE.BufferGeometry;
}

export interface CutParts {
  faces: CutFace[];
  /** Plastids crossing the cut plane, drawn flat on the cut face */
  plastidDiscs: { position: THREE.Vector3; rx: number; ry: number; angle: number }[];
  anchors: Record<string, THREE.Vector3>;
}

export function buildCut(d: CellDesign, parts: CellParts, view: CutView): CutParts {
  const dims = parts.dims;
  const R = (b: Boundary) => (r: RaySample) => radiusAt(dims, r, b);
  const faces: CutFace[] = [
    { id: "ml", geometry: capGeometry(d, view, R("outer"), R("ml"), 0) },
    { id: "pw", geometry: capGeometry(d, view, R("ml"), R("pw"), 0) },
  ];
  if (dims.secondary > 0) faces.push({ id: "sw", geometry: capGeometry(d, view, R("pw"), R("sw"), 0) });
  if (d.living) {
    const mem = R("membrane");
    const vac = (r: RaySample) => mem(r) * dims.vacuoleScale;
    faces.push({ id: "membrane", geometry: capGeometry(d, view, (r) => mem(r), (r) => mem(r) - 0.008, 0.0004) });
    faces.push({ id: "cytoplasm", geometry: capGeometry(d, view, (r) => mem(r) - 0.008, (r) => vac(r) + 0.006, 0) });
    faces.push({ id: "tonoplast", geometry: capGeometry(d, view, (r) => vac(r) + 0.006, vac, 0.0004) });
  }

  const n = CUT_NORMAL[view];
  const plastidDiscs: CutParts["plastidDiscs"] = [];
  for (const p of parts.plastids) {
    const dist = p.position.dot(n);
    const half = p.size.z;
    if (Math.abs(dist) < half * 1.8) {
      const onPlane = p.position.clone().sub(n.clone().multiplyScalar(dist + 0.0012));
      const shrink = Math.sqrt(Math.max(0.2, 1 - (dist / (half * 1.8)) ** 2));
      const [e1, e2] = planeBasis(view);
      const radial = new THREE.Vector2(onPlane.dot(e1), onPlane.dot(e2));
      plastidDiscs.push({
        position: onPlane,
        rx: p.size.x * shrink,
        ry: p.size.y * shrink,
        angle: Math.atan2(radial.y, radial.x) + Math.PI / 2,
      });
    }
  }

  // Label anchors on the cut face, spread around the ring so they do not overlap.
  const { dirs, rays } = ringRays(d, view);
  const ringPoint = (angleIndex: number, r: number) =>
    dirs[angleIndex % RING].clone().multiplyScalar(r).add(n.clone().multiplyScalar(0.01));
  const ia = Math.round(RING * 0.1);
  const ib = Math.round(RING * 0.2);
  const ic = Math.round(RING * 0.3);
  const ray = (i: number) => rays[i % RING];
  const anchors: Record<string, THREE.Vector3> = {
    ml: ringPoint(ia, (radiusAt(dims, ray(ia), "outer") + radiusAt(dims, ray(ia), "ml")) / 2),
    pw: ringPoint(ib, (radiusAt(dims, ray(ib), "ml") + radiusAt(dims, ray(ib), "pw")) / 2),
  };
  if (dims.secondary > 0) anchors.sw = ringPoint(ic, (radiusAt(dims, ray(ic), "pw") + radiusAt(dims, ray(ic), "sw")) / 2);
  const id = Math.round(RING * 0.62);
  if (d.living) {
    const mem = radiusAt(dims, ray(id), "membrane");
    anchors.cytoplasm = ringPoint(id, mem * (1 + dims.vacuoleScale) / 2);
    anchors.vacuole = ringPoint(Math.round(RING * 0.7), mem * dims.vacuoleScale * 0.45);
    anchors.membrane = ringPoint(Math.round(RING * 0.8), radiusAt(dims, ray(Math.round(RING * 0.8)), "membrane"));
  } else {
    anchors.lumen = ringPoint(Math.round(RING * 0.7), radiusAt(dims, ray(Math.round(RING * 0.7)), "sw") * 0.35);
  }
  if (parts.nucleus) anchors.nucleus = parts.nucleus.position.clone().add(n.clone().multiplyScalar(0.01));
  if (plastidDiscs[0]) anchors.plastid = plastidDiscs[0].position.clone().add(n.clone().multiplyScalar(0.01));
  return { faces, plastidDiscs, anchors };
}

export function cameraFor(view: View, d: CellDesign, distanceScale = 1): THREE.Vector3 {
  // The tissue block is a fixed size whatever the cells; view it from above at an angle.
  if (view === "tissue") return new THREE.Vector3(0.6, 6.2, 4.4).multiplyScalar(distanceScale);
  // Frame for the largest cell of this shape, not the current one, so changing
  // the size slider visibly changes the size of the cell on screen.
  const maxScale = cellDims({ ...d, size: 1 }).scale;
  // Half-size of what must fit in view: the long axis (y) is seen in every view but the cross-section.
  const halfLong = maxScale * (d.shape === "elongated" ? 1.6 : 1.05);
  const halfWide = maxScale * (d.shape === "elongated" ? 0.7 : 1.05);
  const extent = view === "cross" ? halfWide : Math.max(halfLong, halfWide);
  // fov is 34°, so an object of half-size e fills the height at distance e / tan(17°) ≈ 3.3·e.
  const dist = (0.9 + extent * 3.3) * distanceScale;
  const dir =
    view === "whole"
      ? new THREE.Vector3(0.55, 0.42, 0.72)
      : view === "cross"
        ? new THREE.Vector3(0.28, 0.92, 0.28)
        : new THREE.Vector3(0.3, 0.22, 0.93);
  return dir.normalize().multiplyScalar(dist);
}

// ------------------------------------------------------------------- labels

const LABELS: Record<string, string> = {
  wall: "ผนังเซลล์ · Cell wall",
  ml: "มิดเดิลลาเมลลา · Middle lamella",
  pw: "ผนังปฐมภูมิ · Primary wall",
  sw: "ผนังทุติยภูมิ · Secondary wall",
  swLignin: "ผนังทุติยภูมิที่มีลิกนิน · Lignified secondary wall",
  membrane: "เยื่อหุ้มเซลล์ · Plasma membrane",
  cytoplasm: "ไซโทพลาซึม · Cytoplasm",
  vacuole: "แวคิวโอล · Vacuole",
  nucleus: "นิวเคลียส · Nucleus",
  amyloplast: "อะไมโลพลาสต์ (เม็ดแป้ง) · Amyloplast",
  chloroplast: "คลอโรพลาสต์ · Chloroplast",
  lumen: "ลูเมน: ไม่มีโพรโทพลาสต์ · Lumen",
};

export interface CellLabel {
  key: string;
  text: string;
  pos: THREE.Vector3;
}

export function cellLabels(d: CellDesign, parts: CellParts, cut: CutParts | null, showLayers: boolean): CellLabel[] {
  const a = cut ? cut.anchors : parts.anchors;
  const out: CellLabel[] = [];
  const add = (key: string, text: string) => {
    if (a[key]) out.push({ key, text, pos: a[key] });
  };
  const lignified = d.lignified && hasSecondaryWall(d);
  if (cut) {
    if (showLayers) {
      add("ml", LABELS.ml);
      add("pw", LABELS.pw);
      add("sw", lignified ? LABELS.swLignin : LABELS.sw);
    } else {
      add("pw", LABELS.wall);
      if (lignified) add("sw", LABELS.swLignin);
    }
    add("membrane", LABELS.membrane);
  } else {
    add("wall", LABELS.wall);
  }
  add("cytoplasm", LABELS.cytoplasm);
  add("vacuole", LABELS.vacuole);
  add("nucleus", LABELS.nucleus);
  if (d.plastids !== "none") add("plastid", LABELS[d.plastids]);
  add("lumen", LABELS.lumen);
  return out;
}
