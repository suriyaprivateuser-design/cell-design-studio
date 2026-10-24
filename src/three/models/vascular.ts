/**
 * Vascular tissues in longitudinal view (long axis = Y), cut open where the
 * inside matters.
 *
 * Xylem: tracheid with bordered pits, vessel elements joined end to end by
 * open perforation plates, a protoxylem vessel with helical thickening,
 * xylem parenchyma and a xylem fibre.
 * Phloem: sieve-tube elements joined by sieve plates, each beside its
 * companion cell (connected by plasmodesmata), phloem parenchyma and a fibre.
 */
import * as THREE from "three";
import { CELL_COLORS as C, MODEL_COLORS as M } from "../palette";
import { ModelBuilder, mat, matAlong, prismZ, ring, rng, roundedRect, spindle, spindlePoint, tubeWall, type ToonModel } from "../toon/kit";

const INK = 0.01;
const LEN = 3.0;
const BOTTOM = -LEN / 2;

/** A column of short living cells (xylem or phloem parenchyma), seen from the front with the wall cut away. */
function parenchymaColumn(b: ModelBuilder, x: number, w: number, n: number, rand: () => number) {
  const h = LEN / n;
  for (let i = 0; i < n; i++) {
    const y = BOTTOM + h * (i + 0.5);
    const outer = roundedRect(x, y, w, h - 0.02, 0.05);
    const inner = roundedRect(x, y, w - 0.05, h - 0.07, 0.04);
    const vac = roundedRect(x, y, w * 0.6, h * 0.6, w * 0.2);
    b.add("par-wall", C.primaryWall, prismZ(outer, -w / 2, w, [inner]), { outline: INK });
    b.add("par-cyto", C.cytoplasm, prismZ(inner, -w / 2, w * 0.94, [vac]), { outline: 0 });
    b.add("par-vac", C.vacuole, prismZ(vac, -w / 2, w * 0.84, [], 0.04), { outline: INK * 0.6 });
    b.instance("nucleus", C.nucleus, "sphere", mat([x + (rand() - 0.5) * w * 0.3, y + h * 0.33, w / 2 + 0.02], [0.05, 0.05, 0.035]), { outline: INK });
  }
}

/** A long, narrow fibre with a thick lignified wall; the top end is cut to show the tiny lumen. */
function fibre(b: ModelBuilder, x: number, r: number) {
  const g = spindle(r, LEN * 0.98, 0.3);
  g.translate(x, 0, 0);
  b.add("fibre", C.lignin, g, { outline: INK });
  // Simple pits: small slits on the surface.
  for (let i = 0; i < 6; i++) {
    const y = -0.9 + i * 0.36;
    const { pos, normal } = spindlePoint(r, LEN * 0.98, 0.3, y, 0.2);
    b.instance("fibre-pit", M.pitHole, "disc", matAlong(pos.add(new THREE.Vector3(x, 0, 0)).add(normal.clone().multiplyScalar(0.003)), normal, [0.012, 1, 0.03]), { flat: true });
  }
}

export function xylemModel(): ToonModel {
  const b = new ModelBuilder();
  const rand = rng(91);

  // Tracheid: long, tapered, dead, lignified; water passes through bordered pits.
  const tx = -1.35;
  const tr = 0.17;
  const tg = spindle(tr, LEN * 0.98, 0.28);
  tg.translate(tx, 0, 0);
  b.add("tracheid", C.lignin, tg, { outline: INK });
  for (let row = 0; row < 9; row++) {
    for (const a of [-0.55, 0, 0.55]) {
      const y = -1.1 + row * 0.27 + (a === 0 ? 0.13 : 0);
      const { pos, normal } = spindlePoint(tr, LEN * 0.98, 0.28, y, a);
      const p = pos.add(new THREE.Vector3(tx, 0, 0)).add(normal.clone().multiplyScalar(0.003));
      b.instance("pit-border", M.pitBorder, "disc", matAlong(p, normal, [0.035, 1, 0.035]), { outline: 0.004 });
      b.instance("pit-hole", M.pitHole, "disc", matAlong(p.clone().add(normal.clone().multiplyScalar(0.002)), normal, [0.012, 1, 0.012]), { flat: true });
    }
  }

  // Vessel: three vessel elements end to end, cut open; the end walls are open perforation plates.
  const vx = -0.42;
  const vr = 0.38;
  const seg = LEN / 3;
  for (let i = 0; i < 3; i++) {
    const y0 = BOTTOM + i * seg;
    const wall = tubeWall(vr, seg - 0.02, Math.PI * 1.15, y0 + 0.01);
    wall.translate(vx, 0, 0);
    b.add("vessel", C.lignin, wall, { outline: INK, doubleSide: true });
    // Pits on the inside of the wall.
    for (let k = 0; k < 14; k++) {
      const a = Math.PI * (0.62 + rand() * 0.76);
      const y = y0 + 0.12 + rand() * (seg - 0.24);
      const n = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      const p = new THREE.Vector3(vx, y, 0).add(n.clone().multiplyScalar(vr - 0.004));
      b.instance("vessel-pit", M.pitHole, "disc", matAlong(p, n.clone().negate(), [0.018, 1, 0.028]), { flat: true });
    }
  }
  for (let i = 1; i < 3; i++) {
    const y = BOTTOM + i * seg;
    const rim = ring(vr * 0.72, vr, y, Math.PI * 1.15);
    rim.translate(vx, 0, 0);
    b.add("perforation", "#b8603e", rim, { outline: 0, doubleSide: true });
  }

  // Protoxylem vessel: thin primary wall strengthened by a lignified helix.
  const px = 0.32;
  const pr = 0.17;
  const thin = tubeWall(pr, LEN * 0.98, Math.PI * 2, BOTTOM + 0.03);
  thin.translate(px, 0, 0);
  b.add("proto-wall", M.thinWall, thin, { outline: INK, opacity: 0.45, doubleSide: true });
  const helix: THREE.Vector3[] = [];
  for (let i = 0; i <= 300; i++) {
    const t = i / 300;
    const a = t * Math.PI * 2 * 11;
    helix.push(new THREE.Vector3(px + Math.sin(a) * (pr - 0.02), BOTTOM + 0.06 + t * (LEN * 0.95), Math.cos(a) * (pr - 0.02)));
  }
  b.add("helix", C.lignin, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 400, 0.022, 8, false), { outline: INK * 0.6 });

  parenchymaColumn(b, 0.86, 0.36, 4, rand);
  fibre(b, 1.38, 0.1);

  b.label("tracheid", "เทรคีด · Tracheid", new THREE.Vector3(tx, 0.95, tr));
  b.label("pit", "รูพิตมีขอบ · Bordered pit", new THREE.Vector3(tx + 0.09, -1.0, tr));
  b.label("vessel", "เวสเซลเมมเบอร์ · Vessel element", new THREE.Vector3(vx - vr * 0.6, 0.75, -vr * 0.5));
  b.label("perforation", "แผ่นทะลุ (ไม่มีผนังกั้น) · Perforation plate", new THREE.Vector3(vx + vr * 0.6, BOTTOM + seg, 0.15));
  b.label("helix", "ผนังหนาแบบเกลียว · Helical thickening", new THREE.Vector3(px, -0.3, pr));
  b.label("parenchyma", "ไซเล็มพาเรงคิมา (มีชีวิต) · Xylem parenchyma", new THREE.Vector3(0.86, 0.38, 0.2));
  b.label("fibre", "ไซเล็มไฟเบอร์ · Xylem fibre", new THREE.Vector3(1.38, -0.75, 0.1));
  return b.build(new THREE.Vector3(0.3, 0.8, 7.2), new THREE.Vector3(0, 0, 0), BOTTOM - 0.02);
}

export function phloemModel(): ToonModel {
  const b = new ModelBuilder();
  const rand = rng(97);
  const sx = -0.75;
  const sr = 0.36;
  const seg = LEN / 3;

  for (let i = 0; i < 3; i++) {
    const y0 = BOTTOM + i * seg;
    // Sieve-tube element: living, thin primary wall, a thin layer of cytoplasm, no nucleus.
    const wall = tubeWall(sr, seg - 0.02, Math.PI * 1.15, y0 + 0.01);
    wall.translate(sx, 0, 0);
    b.add("sieve-wall", M.thinWall, wall, { outline: INK, doubleSide: true });
    const lining = tubeWall(sr - 0.03, seg - 0.06, Math.PI * 1.12, y0 + 0.03);
    lining.translate(sx, 0, 0);
    b.add("sieve-cyto", M.sieveCytoplasm, lining, { outline: 0, doubleSide: true });

    // Companion cell alongside: narrow, dense cytoplasm, large nucleus.
    const cx = sx + sr + 0.15;
    const outer = roundedRect(cx, y0 + seg / 2, 0.24, seg - 0.03, 0.08);
    const inner = roundedRect(cx, y0 + seg / 2, 0.2, seg - 0.07, 0.07);
    b.add("comp-wall", M.thinWall, prismZ(outer, -0.12, 0.24, [inner]), { outline: INK });
    b.add("comp-cyto", M.companionCytoplasm, prismZ(inner, -0.12, 0.23), { outline: 0 });
    b.instance("nucleus", C.nucleus, "sphere", mat([cx, y0 + seg * 0.55, 0.13], [0.075, 0.1, 0.045]), { outline: INK });
    for (let k = 0; k < 6; k++) {
      b.instance("mito", "#c9e86e", "sphere", mat([cx + (rand() - 0.5) * 0.12, y0 + 0.12 + rand() * (seg - 0.24), 0.12], [0.016, 0.026, 0.01]));
    }
    // Plasmodesmata: fine channels through the shared wall.
    for (let k = 0; k < 4; k++) {
      const y = y0 + 0.2 + k * ((seg - 0.4) / 3);
      b.instance("plasmodesma", M.plasmodesma, "cylinder", mat([sx + sr + 0.02, y, -0.02], [0.012, 0.09, 0.012], [0, 0, Math.PI / 2]), { outline: 0 });
    }
  }
  // Sieve plates: end walls perforated by many sieve pores.
  for (let i = 1; i < 3; i++) {
    const y = BOTTOM + i * seg;
    const plate = new THREE.Shape();
    plate.absarc(0, 0, sr - 0.01, 0, Math.PI * 2, false);
    for (let k = 0; k < 19; k++) {
      const r = k === 0 ? 0 : k < 7 ? 0.14 : 0.27;
      const a = k === 0 ? 0 : k < 7 ? (k / 6) * Math.PI * 2 : ((k - 7) / 12) * Math.PI * 2 + 0.2;
      const hole = new THREE.Path();
      hole.absarc(Math.cos(a) * r, Math.sin(a) * r, 0.045, 0, Math.PI * 2, true);
      plate.holes.push(hole);
    }
    const g = new THREE.ExtrudeGeometry(plate, { depth: 0.03, bevelEnabled: false, curveSegments: 10 });
    g.rotateX(-Math.PI / 2);
    g.translate(sx, y - 0.015, 0);
    b.add("sieve-plate", "#c9d27a", g, { outline: INK * 0.7 });
  }

  parenchymaColumn(b, 0.55, 0.36, 4, rand);
  fibre(b, 1.15, 0.1);

  b.label("sieve", "ซีฟทิวบ์เมมเบอร์ (ไม่มีนิวเคลียส) · Sieve-tube element", new THREE.Vector3(sx - sr * 0.6, 1.2, -sr * 0.4));
  b.label("plate", "แผ่นตะแกรง · Sieve plate", new THREE.Vector3(sx, BOTTOM + seg + 0.02, 0.12));
  b.label("companion", "เซลล์คอมพาเนียน · Companion cell", new THREE.Vector3(sx + sr + 0.15, 0.2, 0.12));
  b.label("plasmodesma", "พลาสโมเดสมาตา · Plasmodesmata", new THREE.Vector3(sx + sr + 0.02, -0.45, 0.05));
  b.label("parenchyma", "โฟลเอ็มพาเรงคิมา · Phloem parenchyma", new THREE.Vector3(0.55, 0.38, 0.2));
  b.label("fibre", "โฟลเอ็มไฟเบอร์ · Phloem fibre", new THREE.Vector3(1.15, -0.75, 0.1));
  return b.build(new THREE.Vector3(0.3, 0.8, 7.0), new THREE.Vector3(0, 0, 0), BOTTOM - 0.02);
}
