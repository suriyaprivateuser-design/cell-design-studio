/**
 * Periderm in cross-section of an old stem (outside at the top).
 *
 * The phellogen (cork cambium) divides parallel to the surface, so its
 * products line up in radial files: phellem (cork) outward, phelloderm inward.
 * Phellem cells are dead at maturity, with suberised walls; phellogen cells
 * are thin-walled and meristematic; phelloderm cells are living parenchyma-like.
 */
import * as THREE from "three";
import { CELL_COLORS as C, MODEL_COLORS as M } from "../palette";
import { ModelBuilder, mat, prismZ, rng, roundedRect, type ToonModel } from "../toon/kit";

const INK = 0.01;
const DEPTH = 1.2;
const Z0 = -DEPTH / 2;

type Layer = "epidermis" | "phellem" | "phellogen" | "phelloderm" | "cortex";

export function peridermModel(): ToonModel {
  const b = new ModelBuilder();
  const rand = rng(103);
  const cols = 8;
  const width = 3.3;
  const cw = width / cols;
  const x0 = -width / 2;

  // Layers from the inside (bottom) out.
  const rows: { layer: Layer; h: number }[] = [
    { layer: "cortex", h: 0.5 },
    { layer: "phelloderm", h: 0.24 },
    { layer: "phelloderm", h: 0.24 },
    { layer: "phellogen", h: 0.13 },
    { layer: "phellem", h: 0.2 },
    { layer: "phellem", h: 0.2 },
    { layer: "phellem", h: 0.2 },
    { layer: "phellem", h: 0.2 },
  ];
  let y = -1.0;
  const layerY: Partial<Record<Layer, number>> = {};
  for (const row of rows) {
    const yc = y + row.h / 2;
    layerY[row.layer] = yc;
    // Cortex cells are larger and not in files; the periderm layers stay aligned in radial files.
    const n = row.layer === "cortex" ? 5 : cols;
    const w = width / n;
    for (let i = 0; i < n; i++) {
      const xc = x0 + w * (i + 0.5) + (row.layer === "cortex" ? (rand() - 0.5) * 0.06 : 0);
      cell(b, row.layer, xc, yc, w - 0.012, row.h - 0.012, rand);
    }
    y += row.h;
  }
  // Remains of the old epidermis, torn and pushed off on the outside.
  for (let i = 0; i < 4; i++) {
    const xc = x0 + 0.35 + i * 0.85 + rand() * 0.1;
    const outline = roundedRect(xc, y + 0.04, 0.55, 0.07, 0.03);
    b.add("old-epidermis", "#c9b98b", prismZ(outline, Z0, DEPTH * 0.98), { outline: INK });
  }

  const front = DEPTH / 2 + 0.02;
  b.label("phellem", "เฟลเลม (คอร์ก): ตาย ผนังมีซูเบอริน · Phellem (cork)", new THREE.Vector3(x0 + cw * 2.5, layerY.phellem!, front));
  b.label("phellogen", "เฟลโลเจน: แบ่งเซลล์ได้ · Phellogen", new THREE.Vector3(x0 + cw * 1.5, layerY.phellogen!, front));
  b.label("phelloderm", "เฟลโลเดิร์ม: มีชีวิต · Phelloderm", new THREE.Vector3(x0 + cw * 4.5, layerY.phelloderm!, front));
  b.label("cortex", "คอร์เทกซ์ · Cortex", new THREE.Vector3(x0 + cw * 2.2, layerY.cortex!, front));
  b.label("epidermis", "เอพิเดอร์มิสเดิมที่หลุดลอก · Old epidermis", new THREE.Vector3(x0 + 0.35, y + 0.08, front - 0.1));
  return b.build(new THREE.Vector3(1.6, 1.5, 5.6), new THREE.Vector3(0, 0, 0), -1.02);
}

function cell(b: ModelBuilder, layer: Layer, x: number, y: number, w: number, h: number, rand: () => number) {
  const r = Math.min(w, h) * 0.22;
  const outer = roundedRect(x, y, w, h, r);
  if (layer === "phellem") {
    // Dead cork cell: thick suberised wall, empty (air-filled) lumen.
    const inner = roundedRect(x, y, w - 0.07, h - 0.07, r * 0.6);
    b.add("phellem-wall", M.suberin, prismZ(outer, Z0, DEPTH, [inner]), { outline: INK });
    b.add("phellem-lumen", M.corkLumen, prismZ(inner, Z0, DEPTH * 0.55), { outline: 0 });
    return;
  }
  const wall = layer === "phellogen" ? 0.02 : 0.04;
  const inner = roundedRect(x, y, w - wall * 2, h - wall * 2, r * 0.8);
  b.add(`${layer}-wall`, layer === "phellogen" ? M.thinWall : C.primaryWall, prismZ(outer, Z0, DEPTH, [inner]), { outline: INK });
  if (layer === "phellogen") {
    // Meristematic: dense cytoplasm, prominent nucleus, little vacuole.
    b.add("phellogen-cyto", M.denseCytoplasm, prismZ(inner, Z0, DEPTH * 0.96), { outline: 0 });
    b.instance("nucleus", C.nucleus, "sphere", mat([x, y, DEPTH / 2 + 0.01], [Math.min(w, h) * 0.3, Math.min(w, h) * 0.3, 0.035]), { outline: INK });
    return;
  }
  const vac = roundedRect(x, y, (w - wall * 2) * 0.7, (h - wall * 2) * 0.6, r * 0.8);
  b.add(`${layer}-cyto`, C.cytoplasm, prismZ(inner, Z0, DEPTH * 0.95, [vac]), { outline: 0 });
  b.add("vac", C.vacuole, prismZ(vac, Z0, DEPTH * 0.85, [], 0.04), { outline: INK * 0.6 });
  if (rand() < 0.75) {
    b.instance("nucleus", C.nucleus, "sphere", mat([x + (rand() - 0.5) * w * 0.5, y + h * 0.3, DEPTH / 2 + 0.01], [0.045, 0.045, 0.03]), { outline: INK });
  }
  if (layer === "cortex" || layer === "phelloderm") {
    // Cortex and phelloderm of young stems often hold chloroplasts.
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + rand();
      b.instance("chloroplast", C.chloroplast, "sphere", mat([x + Math.cos(a) * w * 0.4, y + Math.sin(a) * h * 0.38, DEPTH / 2 + 0.005], [0.028, 0.018, 0.012], [0, 0, a]), { outline: INK * 0.5 });
    }
  }
}
