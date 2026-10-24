/**
 * Toolkit for the cel-shaded tissue models.
 *
 * A model is a list of parts (merged geometry per colour) plus instanced
 * small bodies (plastids, highlights, pits…), label anchors and a camera.
 * Builders in src/three/models/* produce one; <ToonScene> renders it.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

export interface ModelLabel {
  key: string;
  text: string;
  pos: THREE.Vector3;
}

export interface ToonPart {
  key: string;
  color: string;
  geometry: THREE.BufferGeometry;
  /** Ink outline thickness in world units (0 = none) */
  outline: number;
  opacity: number;
  doubleSide: boolean;
  /** Unlit flat colour (highlights, dark gaps) */
  flat: boolean;
}

export type InstanceShape = "sphere" | "disc" | "box" | "cylinder";

export interface ToonInstances {
  key: string;
  color: string;
  shape: InstanceShape;
  matrices: THREE.Matrix4[];
  outline: number;
  flat: boolean;
}

export interface ToonModel {
  parts: ToonPart[];
  instances: ToonInstances[];
  labels: ModelLabel[];
  camera: THREE.Vector3;
  target: THREE.Vector3;
  /** Height of the contact shadow under the model */
  floorY: number;
}

interface PartOpts {
  outline?: number;
  opacity?: number;
  doubleSide?: boolean;
  flat?: boolean;
}

/** Same attributes everywhere so geometries can be merged: non-indexed, position + normal. */
function normalise(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const out = g.index ? g.toNonIndexed() : g;
  for (const name of Object.keys(out.attributes)) {
    if (name !== "position" && name !== "normal") out.deleteAttribute(name);
  }
  if (!out.getAttribute("normal")) out.computeVertexNormals();
  out.clearGroups();
  if (out !== g) g.dispose();
  return out;
}

export class ModelBuilder {
  private parts = new Map<string, { color: string; geoms: THREE.BufferGeometry[]; opts: Required<PartOpts> }>();
  private inst = new Map<string, Omit<ToonInstances, "key">>();
  private labelList: ModelLabel[] = [];

  /** Add geometry to the part `key` (created with `color` on first use). */
  add(key: string, color: string, geometry: THREE.BufferGeometry | null, opts: PartOpts = {}) {
    if (!geometry) return;
    let p = this.parts.get(key);
    if (!p) {
      p = { color, geoms: [], opts: { outline: opts.outline ?? 0.012, opacity: opts.opacity ?? 1, doubleSide: opts.doubleSide ?? false, flat: opts.flat ?? false } };
      this.parts.set(key, p);
    }
    p.geoms.push(normalise(geometry));
  }

  instance(name: string, color: string, shape: InstanceShape, matrix: THREE.Matrix4, opts: { outline?: number; flat?: boolean } = {}) {
    // Grouped by shape too: one instanced mesh can only draw one geometry.
    const key = `${name}:${shape}`;
    let i = this.inst.get(key);
    if (!i) {
      i = { color, shape, matrices: [], outline: opts.outline ?? 0, flat: opts.flat ?? false };
      this.inst.set(key, i);
    }
    i.matrices.push(matrix);
  }

  label(key: string, text: string, pos: THREE.Vector3) {
    if (!this.labelList.some((l) => l.key === key)) this.labelList.push({ key, text, pos });
  }

  build(camera: THREE.Vector3, target = new THREE.Vector3(), floorY = 0): ToonModel {
    const parts: ToonPart[] = [];
    for (const [key, p] of this.parts) {
      if (!p.geoms.length) continue;
      const geometry = p.geoms.length === 1 ? p.geoms[0] : mergeGeometries(p.geoms);
      if (p.geoms.length > 1) p.geoms.forEach((g) => g.dispose());
      if (geometry) parts.push({ key, color: p.color, geometry, ...p.opts });
    }
    const instances = [...this.inst].map(([key, i]) => ({ key, ...i }));
    return { parts, instances, labels: this.labelList, camera, target, floorY };
  }
}

// ------------------------------------------------------------- shape helpers

export type P2 = [number, number];

/** A flat outline (in the XZ plane) as a THREE.Shape. Shape Y is world −Z. */
export function shape2(outline: P2[], holes: P2[][] = []): THREE.Shape {
  const s = new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const h of holes) if (h.length > 2) s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))));
  return s;
}

/** Extrude an XZ outline upward from y0. Optional rounded (domed) top. */
export function prism(shape: THREE.Shape, y0: number, height: number, dome = 0): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    steps: 1,
    bevelEnabled: dome > 0,
    bevelThickness: dome,
    bevelSize: dome * 0.7,
    bevelOffset: -dome * 0.7,
    bevelSegments: 6,
    curveSegments: 6,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + (dome > 0 ? dome : 0), 0);
  return g;
}

export function ellipse(cx: number, cz: number, rx: number, rz: number, n = 40, rot = 0): P2[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    const z = Math.sin(a) * rz;
    return [cx + x * Math.cos(rot) - z * Math.sin(rot), cz + x * Math.sin(rot) + z * Math.cos(rot)] as P2;
  });
}

/** Rounded rectangle outline in XZ. */
export function roundedRect(cx: number, cz: number, w: number, d: number, r: number, n = 6): P2[] {
  const out: P2[] = [];
  const rr = Math.min(r, w / 2, d / 2);
  const corners: [number, number, number][] = [
    [cx + w / 2 - rr, cz + d / 2 - rr, 0],
    [cx - w / 2 + rr, cz + d / 2 - rr, Math.PI / 2],
    [cx - w / 2 + rr, cz - d / 2 + rr, Math.PI],
    [cx + w / 2 - rr, cz - d / 2 + rr, (3 * Math.PI) / 2],
  ];
  for (const [x, z, a0] of corners) {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      out.push([x + Math.cos(a) * rr, z + Math.sin(a) * rr]);
    }
  }
  return out;
}

/** Matrix from position, Euler rotation and scale. */
export function mat(pos: THREE.Vector3 | [number, number, number], scale: [number, number, number] | number = 1, rot: [number, number, number] = [0, 0, 0]) {
  const p = Array.isArray(pos) ? new THREE.Vector3(...pos) : pos;
  const s = typeof scale === "number" ? new THREE.Vector3(scale, scale, scale) : new THREE.Vector3(...scale);
  return new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), s);
}

/** Matrix that orients the +Y axis along `dir`. */
export function matAlong(pos: THREE.Vector3, dir: THREE.Vector3, scale: [number, number, number]) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return new THREE.Matrix4().compose(pos, q, new THREE.Vector3(...scale));
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Darker shade of a colour for its ink outline. */
export function inkOf(color: string, k = 0.42): string {
  const c = new THREE.Color(color);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  return "#" + new THREE.Color().setHSL(hsl.h, Math.min(1, hsl.s * 1.1), hsl.l * k).getHexString();
}

/** Extrude an outline drawn in the XY plane (side view) toward +Z from z0. Optional domed front. */
export function prismZ(outline: P2[], z0: number, depth: number, holes: P2[][] = [], dome = 0): THREE.BufferGeometry {
  const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const h of holes) if (h.length > 2) s.holes.push(new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x, y))));
  const g = new THREE.ExtrudeGeometry(s, {
    depth,
    steps: 1,
    bevelEnabled: dome > 0,
    bevelThickness: dome,
    bevelSize: dome * 0.7,
    bevelOffset: -dome * 0.7,
    bevelSegments: 5,
    curveSegments: 6,
  });
  g.translate(0, 0, z0 + (dome > 0 ? dome : 0));
  return g;
}

/** Spindle-shaped cell (tracheid, fibre) along Y: full width in the middle, tapering to points. */
export function spindle(radius: number, length: number, taper = 0.32, segments = 28): THREE.BufferGeometry {
  const pts: THREE.Vector2[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const y = -length / 2 + (i / n) * length;
    const fromEnd = (length / 2 - Math.abs(y)) / (length * taper);
    const r = radius * Math.min(1, Math.sin(Math.min(1, fromEnd) * (Math.PI / 2)));
    pts.push(new THREE.Vector2(Math.max(0.002, r), y));
  }
  return new THREE.LatheGeometry(pts, segments);
}

/** Point on the surface of a spindle (see `spindle`) at height y and angle a around it. */
export function spindlePoint(radius: number, length: number, taper: number, y: number, a: number) {
  const fromEnd = (length / 2 - Math.abs(y)) / (length * taper);
  const r = radius * Math.min(1, Math.sin(Math.min(1, fromEnd) * (Math.PI / 2)));
  return { pos: new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r), normal: new THREE.Vector3(Math.sin(a), 0, Math.cos(a)) };
}

/** Open tube wall along Y; `arc` < 2π leaves it cut open toward +Z so the inside shows. */
export function tubeWall(radius: number, length: number, arc = Math.PI * 2, y0 = 0): THREE.BufferGeometry {
  // Cylinder angle θ puts a point at (sin θ, cos θ): centre the arc on θ = π (the back),
  // so the gap faces the camera (+Z).
  const start = Math.PI - arc / 2;
  const g = new THREE.CylinderGeometry(radius, radius, length, 40, 1, true, start, arc);
  g.translate(0, y0 + length / 2, 0);
  return g;
}

/** Flat ring in the XZ plane at height y (perforation rims, wall bands). */
export function ring(inner: number, outer: number, y: number, arc = Math.PI * 2): THREE.BufferGeometry {
  // After rotateX(−π/2) a ring angle φ lands at (cos φ, −sin φ), i.e. cylinder θ = φ + π/2.
  const start = Math.PI / 2 - arc / 2;
  const g = new THREE.RingGeometry(inner, outer, 40, 1, start, arc);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}
