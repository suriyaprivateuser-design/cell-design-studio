/**
 * Dermal tissue models: leaf epidermis with stomata and cuticle, root
 * epidermis with a root hair, and a close-up of one stoma (open / closed).
 */
import * as THREE from "three";
import { DEFAULT_DESIGN } from "@/simulation/design";
import { buildSection, inradius, type Pt } from "@/tissue/section";
import { CELL_COLORS as C, MODEL_COLORS as M } from "../palette";
import { BLOCK_SIZE, SECTION_TO_WORLD as S, toWorld } from "../tissueBlock";
import { ModelBuilder, ellipse, mat, prism, prismZ, rng, roundedRect, shape2, type P2, type ToonModel } from "../toon/kit";

const INK = 0.009;
const FIELD = 240;

/** Smooth displacement that makes anticlinal walls wavy (jigsaw-like pavement cells of dicot leaves). */
function wavy(p: Pt): Pt {
  const a = 5;
  return [p[0] + a * Math.sin(p[1] * 0.26 + Math.sin(p[0] * 0.05) * 2), p[1] + a * Math.sin(p[0] * 0.24 + Math.cos(p[1] * 0.06) * 2)];
}
const wv = (poly: Pt[]) => poly.map(wavy);
const toXZ = (poly: Pt[]): P2[] => poly.map((p) => {
  const v = toWorld(p, 0);
  return [v.x, v.z];
});

interface Stoma {
  c: Pt;
  rx: number;
  rz: number;
  rot: number;
}

/** Two kidney-shaped guard cells around a pore, flat on the leaf surface. */
function addStoma(b: ModelBuilder, s: Stoma, y0: number, h: number, poreOpen: number, rand: () => number) {
  const c = toWorld(s.c, 0);
  const rx = s.rx * S;
  const rz = s.rz * S;
  const poreZ = rz * poreOpen;
  for (const sign of [1, -1]) {
    // Half of the ring between the outer ellipse and the pore, on one side of the pore.
    const outer: P2[] = [];
    const inner: P2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      outer.push(rotate([Math.cos(a) * rx, sign * Math.sin(a) * rz], s.rot, c));
      inner.push(rotate([Math.cos(Math.PI - a) * rx * 0.78, sign * Math.sin(Math.PI - a) * poreZ], s.rot, c));
    }
    const outline = [...outer, ...inner];
    b.add("guard", M.guardCell, prism(shape2(outline), y0, h, 0.05), { outline: INK });
    // Thick inner (ventral) wall along the pore.
    const lip: P2[] = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * Math.PI;
      lip.push(rotate([Math.cos(a) * rx * 0.8, sign * Math.sin(a) * (poreZ + rz * 0.1)], s.rot, c));
    }
    for (let i = 20; i >= 0; i--) {
      const a = (i / 20) * Math.PI;
      lip.push(rotate([Math.cos(a) * rx * 0.78, sign * Math.sin(a) * poreZ], s.rot, c));
    }
    b.add("guard-wall", "#9fb24a", prism(shape2(lip), y0, h + 0.1), { outline: 0 });
    // Chloroplasts and the nucleus inside each guard cell.
    for (let i = 0; i < 7; i++) {
      const a = 0.25 + (i / 6) * (Math.PI - 0.5);
      const r = 0.89 + rand() * 0.02;
      const p = rotate([Math.cos(a) * rx * r * 0.98, sign * Math.sin(a) * (rz * 0.5 + poreZ * 0.5)], s.rot, c);
      b.instance("guard-chloro", C.chloroplast, "sphere", mat([p[0], y0 + h + 0.1, p[1]], [rx * 0.07, rx * 0.04, rx * 0.045], [0, -s.rot - a, 0]), { outline: INK * 0.5 });
    }
    const n = rotate([0, sign * (rz * 0.55 + poreZ * 0.45)], s.rot, c);
    b.instance("guard-nucleus", C.nucleus, "sphere", mat([n[0], y0 + h + 0.08, n[1]], rx * 0.13), { outline: INK });
  }
  // The pore: a dark gap down into the air space below.
  b.add("pore", M.pore, prism(shape2(ellipse(c.x, c.z, rx * 0.78, Math.max(0.004, poreZ), 32, s.rot)), y0 - 0.02, 0.03), { outline: 0, flat: true });
}

function rotate([x, z]: P2, a: number, c: THREE.Vector3): P2 {
  return [c.x + x * Math.cos(a) - z * Math.sin(a), c.z + x * Math.sin(a) + z * Math.cos(a)];
}

/** Leaf epidermis seen from above: wavy pavement cells, two stomata, a cuticle over the top. */
export function leafEpidermisModel(): ToonModel {
  const design = { ...DEFAULT_DESIGN, shape: "polyhedral" as const, size: 0.75, primaryWall: 0.25, intercellularSpace: 0, vacuole: 0.85, plastids: "none" as const };
  const section = buildSection(design, "cross", FIELD, FIELD, 61, { targetCells: 64, clipToField: true, plastidsPerCell: 0 });
  const b = new ModelBuilder();
  const rand = rng(61);
  const H = 0.32;
  const half = BLOCK_SIZE / 2;
  b.add("floor", M.pore, prism(shape2([[-half, -half], [half, -half], [half, half], [-half, half]]), -0.02, 0.025), { outline: 0 });

  // Two stomata near the middle, each between pavement cells.
  const stomata: Stoma[] = [
    { c: [86, 98], rx: 23, rz: 16, rot: 0.5 },
    { c: [168, 160], rx: 23, rz: 16, rot: -0.3 },
  ];
  const nearStoma = (p: Pt) => stomata.some((s) => Math.hypot(p[0] - s.c[0], p[1] - s.c[1]) < s.rx * 1.25);

  for (const cell of section.cells) {
    const sh = cell.shapes;
    if (sh.outer.length < 3) continue;
    const stoma = stomata.find((s) => Math.hypot(cell.centre[0] - s.c[0], cell.centre[1] - s.c[1]) < inradius(sh.outer, cell.centre) * 1.6);
    const outer = wv(sh.outer);
    const primary = wv(sh.primary);
    const lumen = wv(sh.lumen);
    b.add("ml", C.middleLamella, prism(shape2(toXZ(outer), [toXZ(primary)]), 0, H), { outline: INK });
    b.add("pw", C.primaryWall, prism(shape2(toXZ(primary), [toXZ(lumen)]), 0, H), { outline: 0 });
    if (stoma) {
      // This cell's space holds the stoma; the guard cells sit in a pocket of the epidermis.
      b.add("pavement", M.pavementCell, prism(shape2(toXZ(lumen), [ellipse(toWorld(stoma.c, 0).x, toWorld(stoma.c, 0).z, stoma.rx * S * 1.12, stoma.rz * S * 1.12, 40, stoma.rot)]), 0, H * 0.9), { outline: 0 });
      addStoma(b, stoma, 0, H * 0.82, 0.32, rand);
      continue;
    }
    // Pavement cells: large clear vacuole, no chloroplasts, a nucleus against the wall.
    b.add("pavement", M.pavementCell, prism(shape2(toXZ(lumen)), 0, H * 0.9), { outline: 0 });
    if (cell.nucleus && !cell.edge && !nearStoma(cell.nucleus.c)) {
      const r = cell.nucleus.r * S * 1.2;
      const p = toWorld(wavy(cell.nucleus.c), H * 0.9);
      b.instance("nucleus", C.nucleus, "sphere", mat(p, [r, r * 0.6, r]), { outline: INK });
    }
  }
  // Cuticle: a waxy, transparent layer covering the outer surface.
  b.add("cuticle", M.cuticle, prism(shape2([[-half, -half], [half, -half], [half, half], [-half, half]]), H + 0.005, 0.05), { outline: 0, opacity: 0.32 });

  const st = toWorld(stomata[0].c, H);
  b.label("guard", "เซลล์คุม · Guard cell", st.clone().add(new THREE.Vector3(0, 0.12, -0.12)));
  b.label("stoma", "ปากใบ · Stoma", toWorld(stomata[1].c, H + 0.1));
  const pc = section.cells.find((c) => !c.edge && !nearStoma(c.centre) && c.centre[0] < 80 && c.centre[1] > 150);
  if (pc) b.label("pavement", "เซลล์เอพิเดอร์มิส (ไม่มีคลอโรพลาสต์) · Epidermal cell", toWorld(pc.centre, H));
  b.label("cuticle", "คิวทิเคิล · Cuticle", new THREE.Vector3(half * 0.6, H + 0.06, half * 0.75));
  const wc = section.cells.find((c) => !c.edge && c.centre[0] > 170 && c.centre[1] < 90);
  if (wc) b.label("wall", "ผนังเซลล์เป็นลอนต่อกันแน่น · Wavy, tightly joined walls", toWorld(wavy(wc.shapes.primary[0]), H));
  return b.build(new THREE.Vector3(0.6, 6.2, 4.4), new THREE.Vector3(0, 0.15, 0), -0.03);
}

/** Root epidermis in longitudinal section, with one cell growing a root hair. */
export function rootHairModel(): ToonModel {
  const b = new ModelBuilder();
  const rand = rng(71);
  const depth = 0.7;
  const z0 = -depth / 2;
  // Two rows of cells seen from the side: epidermis on top, cortex below.
  const cells: { x: number; y: number; w: number; h: number; layer: "epi" | "cortex" }[] = [];
  let x = -1.75;
  while (x < 1.75) {
    const w = 0.42 + rand() * 0.12;
    cells.push({ x: x + w / 2, y: 0.22, w, h: 0.42, layer: "epi" });
    x += w;
  }
  x = -1.75;
  while (x < 1.75) {
    const w = 0.55 + rand() * 0.15;
    cells.push({ x: x + w / 2, y: -0.32, w, h: 0.62, layer: "cortex" });
    x += w;
  }
  const hairCell = cells.filter((c) => c.layer === "epi")[3];
  for (const c of cells) {
    const outer = roundedRect(c.x, c.y, c.w, c.h, 0.06);
    const inner = roundedRect(c.x, c.y, c.w - 0.05, c.h - 0.05, 0.05);
    const vac = roundedRect(c.x, c.y - 0.01, c.w * 0.68, c.h * 0.62, Math.min(c.w, c.h) * 0.25);
    b.add("wall", C.primaryWall, prismZ(outer, z0, depth, [inner]), { outline: INK });
    b.add(c.layer === "epi" ? "epi-cyto" : "cortex-cyto", c.layer === "epi" ? "#c5e3a4" : C.cytoplasm, prismZ(inner, z0, depth * 0.94, [vac]), { outline: 0 });
    b.add("vac", C.vacuole, prismZ(vac, z0, depth * 0.84, [], 0.05), { outline: INK * 0.6 });
    const nx = c.x + (rand() - 0.5) * c.w * 0.4;
    const ny = c.y + (c.layer === "epi" ? c.h * 0.32 : -c.h * 0.3);
    if (c !== hairCell) b.instance("nucleus", C.nucleus, "sphere", mat([nx, ny, depth / 2 + 0.02], [0.06, 0.06, 0.04]), { outline: INK });
    if (c.layer === "cortex") {
      for (let i = 0; i < 4; i++) b.instance("amyloplast", C.amyloplast, "sphere", mat([c.x + (rand() - 0.5) * c.w * 0.7, c.y - c.h * 0.36, depth / 2 + 0.01], 0.025), { outline: INK * 0.5 });
    }
  }
  // The root hair: a long tube grown out of the epidermal cell, continuous with it.
  const top = hairCell.y + hairCell.h / 2;
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(hairCell.x, top - 0.05, 0),
    new THREE.Vector3(hairCell.x + 0.05, top + 0.5, 0.05),
    new THREE.Vector3(hairCell.x + 0.3, top + 1.1, 0.1),
    new THREE.Vector3(hairCell.x + 0.75, top + 1.55, 0.05),
  ]);
  const tube = (r: number) => {
    const g = new THREE.TubeGeometry(curve, 60, r, 18, false);
    return g;
  };
  b.add("hair-wall", C.primaryWall, tube(0.085), { outline: INK, opacity: 0.55 });
  b.add("hair-cyto", "#c5e3a4", tube(0.06), { outline: 0 });
  b.add("hair-vac", C.vacuole, tube(0.04), { outline: 0 });
  const tip = curve.getPoint(1);
  b.add("hair-tip", C.primaryWall, new THREE.SphereGeometry(0.085, 18, 12).translate(tip.x, tip.y, tip.z), { outline: INK, opacity: 0.55 });
  const nucleusPos = curve.getPoint(0.82);
  b.instance("nucleus", C.nucleus, "sphere", mat(nucleusPos, [0.055, 0.075, 0.055]), { outline: INK });

  b.label("hair", "ขนราก · Root hair", curve.getPoint(0.55));
  b.label("hair-nucleus", "นิวเคลียสอยู่ใกล้ปลายขน · Nucleus near the tip", nucleusPos);
  const epi = cells.filter((c) => c.layer === "epi")[1];
  b.label("epi", "เอพิเดอร์มิสของราก · Root epidermis", new THREE.Vector3(epi.x, epi.y + 0.1, depth / 2));
  const cx = cells.find((c) => c.layer === "cortex" && c.x > 0.6) ?? cells[cells.length - 1];
  b.label("cortex", "คอร์เทกซ์ · Cortex", new THREE.Vector3(cx.x, cx.y, depth / 2));
  return b.build(new THREE.Vector3(0.9, 1.4, 6.3), new THREE.Vector3(0, 0.45, 0), -0.68);
}

/** One stoma close up: two guard cells in a ring of epidermal cells, pore open or closed. */
export function stomaModel(open: boolean): ToonModel {
  const b = new ModelBuilder();
  const rand = rng(open ? 81 : 83);
  const H = 0.36;
  const half = 1.7;
  // Surrounding epidermal cells: a section around a central hole.
  const design = { ...DEFAULT_DESIGN, size: 0.45, primaryWall: 0.25, intercellularSpace: 0, vacuole: 0.85, plastids: "none" as const };
  const section = buildSection(design, "cross", FIELD, FIELD, 87, { targetCells: 64, clipToField: true, plastidsPerCell: 0 });
  const stoma: Stoma = { c: [120, 120], rx: 58, rz: 42, rot: 0 };
  b.add("floor", M.pore, prism(shape2([[-half, -half], [half, -half], [half, half], [-half, half]]), -0.02, 0.025), { outline: 0 });
  const hole = ellipse(0, 0, stoma.rx * S * 1.12, stoma.rz * S * 1.12, 48);
  for (const cell of section.cells) {
    const sh = cell.shapes;
    if (sh.outer.length < 3) continue;
    const pts = [...sh.outer];
    // Cells overlapping the stoma are cut back to make room for it.
    const inside = pts.some((p) => ((p[0] - 120) / (stoma.rx * 1.12)) ** 2 + ((p[1] - 120) / (stoma.rz * 1.12)) ** 2 < 1);
    if (inside) continue;
    b.add("ml", C.middleLamella, prism(shape2(toXZ(sh.outer), [toXZ(sh.primary)]), 0, H), { outline: INK });
    b.add("pw", C.primaryWall, prism(shape2(toXZ(sh.primary), [toXZ(sh.lumen)]), 0, H), { outline: 0 });
    b.add("pavement", M.pavementCell, prism(shape2(toXZ(sh.lumen)), 0, H * 0.9), { outline: 0 });
  }
  // Subsidiary ring of epidermis that the guard cells sit in.
  const ringOuter = ellipse(0, 0, stoma.rx * S * 1.75, stoma.rz * S * 1.9, 48);
  b.add("pavement-ring", M.pavementCell, prism(shape2(ringOuter, [hole]), 0, H * 0.9), { outline: INK });
  addStoma(b, stoma, 0, H * 0.82, open ? 0.42 : 0.06, rand);

  const c = toWorld(stoma.c, 0);
  b.label("guard", "เซลล์คุม (มีคลอโรพลาสต์) · Guard cell", new THREE.Vector3(c.x + stoma.rx * S * 0.2, H + 0.12, c.z - stoma.rz * S * 0.75));
  b.label("pore", open ? "รูปากใบเปิด: เซลล์คุมเต่ง · Open pore" : "รูปากใบปิด: เซลล์คุมเสียน้ำ · Closed pore", new THREE.Vector3(c.x, H * 0.5, c.z));
  b.label("inner-wall", "ผนังด้านติดรูหนากว่า · Thicker inner wall", new THREE.Vector3(c.x - stoma.rx * S * 0.55, H + 0.1, c.z + stoma.rz * S * (open ? 0.45 : 0.12)));
  b.label("epidermal", "เซลล์เอพิเดอร์มิส · Epidermal cell", new THREE.Vector3(-1.3, H, 1.1));
  return b.build(new THREE.Vector3(0.5, 4.8, 3.6), new THREE.Vector3(0, 0.1, 0), -0.03);
}
