/**
 * Cell surface geometry.
 *
 * A cell is described as a closed convex surface around its centre. For every
 * direction u we solve for the radius r where the surface is crossed, so any
 * inner layer (primary wall, secondary wall, plasma membrane…) is the same
 * surface pushed inwards by a thickness. Because thicknesses are measured along
 * the surface normal, a thicker wall really is thicker everywhere, and corner
 * thickening (angular collenchyma) can be added where the surface bends.
 *
 * Shapes:
 *  - polyhedral: truncated octahedron (14 faces), the classic model of a
 *    packed parenchyma cell (Lewis's orthic tetrakaidecahedron)
 *  - rounded:    near-sphere
 *  - elongated:  hexagonal prism with its long axis on y
 * Edges are rounded with a smooth maximum; more intercellular space = rounder
 * corners, which is where the spaces open up in real tissue.
 */
import type { CellShape } from "@/simulation/design";

type Vec3 = [number, number, number];
interface Plane {
  n: Vec3;
  d: number;
}

export interface ShapeField {
  kind: CellShape;
  planes: Plane[];
  /** Smoothness of the edges (higher = sharper) */
  k: number;
  /** Sphere radius for the rounded shape */
  radius: number;
}

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
};

function truncatedOctahedron(): Plane[] {
  // Vertices are permutations of (0, ±1, ±2); square faces at distance 2,
  // hexagonal faces at distance √3. Scaled so the mean radius is about 1.
  const s = 1 / 1.82;
  const planes: Plane[] = [];
  const axes: Vec3[] = [
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ];
  for (const a of axes) planes.push({ n: a, d: 2 * s });
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) planes.push({ n: norm([x, y, z]), d: Math.sqrt(3) * s });
  return planes;
}

function hexPrism(): Plane[] {
  const planes: Plane[] = [];
  const apothem = 0.6;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + Math.PI / 6;
    planes.push({ n: [Math.cos(a), 0, Math.sin(a)], d: apothem });
  }
  planes.push({ n: [0, 1, 0], d: 1.55 });
  planes.push({ n: [0, -1, 0], d: 1.55 });
  return planes;
}

const POLY = truncatedOctahedron();
const PRISM = hexPrism();

export function makeField(kind: CellShape, space: number): ShapeField {
  // Sharp, space-filling corners when packed; rounder as spaces open up.
  const k = 30 - 22 * Math.min(1, Math.max(0, space));
  if (kind === "rounded") return { kind, planes: [], k, radius: 0.95 };
  return { kind, planes: kind === "polyhedral" ? POLY : PRISM, k, radius: 1 };
}

export interface FieldSample {
  /** signed distance-like value (0 on the surface, negative inside) */
  f: number;
  /** unit normal */
  n: Vec3;
  /** 0 on a flat face, rising towards edges and corners */
  corner: number;
}

export function sampleField(field: ShapeField, x: number, y: number, z: number): FieldSample {
  if (field.planes.length === 0) {
    const l = Math.hypot(x, y, z) || 1e-6;
    return { f: l - field.radius, n: [x / l, y / l, z / l], corner: 0 };
  }
  const { planes, k } = field;
  let m = -Infinity;
  const v = new Array<number>(planes.length);
  for (let i = 0; i < planes.length; i++) {
    const p = planes[i];
    v[i] = p.n[0] * x + p.n[1] * y + p.n[2] * z - p.d;
    if (v[i] > m) m = v[i];
  }
  let s = 0;
  let wMax = 0;
  let gx = 0,
    gy = 0,
    gz = 0;
  for (let i = 0; i < planes.length; i++) {
    const w = Math.exp(k * (v[i] - m));
    s += w;
    gx += w * planes[i].n[0];
    gy += w * planes[i].n[1];
    gz += w * planes[i].n[2];
    if (w > wMax) wMax = w;
  }
  const gl = Math.hypot(gx, gy, gz) || 1e-6;
  return { f: m + Math.log(s) / k, n: [gx / gl, gy / gl, gz / gl], corner: 1 - wMax / s };
}

export interface RaySample {
  /** radius of the outer surface along this direction (unit cell) */
  r: number;
  /** 1 / cos(angle between ray and surface normal): converts a wall thickness into a radial step */
  stretch: number;
  corner: number;
}

/** Find where a ray from the centre leaves the cell surface. */
export function castRay(field: ShapeField, u: Vec3): RaySample {
  let lo = 0;
  let hi = 2.2;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (sampleField(field, u[0] * mid, u[1] * mid, u[2] * mid).f > 0) hi = mid;
    else lo = mid;
  }
  const r = (lo + hi) / 2;
  const s = sampleField(field, u[0] * r, u[1] * r, u[2] * r);
  const cos = Math.max(0.35, u[0] * s.n[0] + u[1] * s.n[1] + u[2] * s.n[2]);
  return { r, stretch: 1 / cos, corner: s.corner };
}

/** Corner weighting used for uneven (angular) wall thickening: 0 on faces, ~1 at edges/corners. */
export function cornerWeight(corner: number): number {
  return Math.min(1, Math.max(0, (corner - 0.05) / 0.45));
}
