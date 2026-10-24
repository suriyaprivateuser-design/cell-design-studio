/**
 * 3D model of every tissue in the library, with its variants.
 * Parenchyma's models come from designs (so they match the studio);
 * the others are built directly from anatomy.
 */
import { CHLORENCHYMA_REFERENCE, PARENCHYMA_REFERENCE } from "@/content/tissues";
import { buildTissueBlock } from "../tissueBlock";
import type { ToonModel } from "../toon/kit";
import { collenchymaModel, fiberModel, meristemModel, sclereidModel } from "./ground";
import { leafEpidermisModel, rootHairModel, stomaModel } from "./dermal";
import { peridermModel } from "./periderm";
import { phloemModel, xylemModel } from "./vascular";

export interface ModelVariant {
  id: string;
  label: string;
  build: () => ToonModel;
}

export const TISSUE_MODELS: Record<string, ModelVariant[]> = {
  parenchyma: [
    { id: "storage", label: "สะสมแป้ง (หัวมันฝรั่ง)", build: () => buildTissueBlock(PARENCHYMA_REFERENCE) },
    { id: "chlorenchyma", label: "คลอเรงคิมา (ใบ)", build: () => buildTissueBlock(CHLORENCHYMA_REFERENCE) },
  ],
  collenchyma: [{ id: "angular", label: "แบบหนาตามมุม (Angular)", build: collenchymaModel }],
  sclerenchyma: [
    { id: "fiber", label: "ไฟเบอร์ (Fiber)", build: fiberModel },
    { id: "sclereid", label: "สเกลอรีด (Sclereid)", build: sclereidModel },
  ],
  meristem: [{ id: "apical", label: "เนื้อเยื่อเจริญส่วนปลาย", build: meristemModel }],
  epidermis: [
    { id: "leaf", label: "ผิวใบ (มีปากใบ)", build: leafEpidermisModel },
    { id: "root", label: "ผิวราก (ขนราก)", build: rootHairModel },
  ],
  "guard-cell": [
    { id: "open", label: "ปากใบเปิด", build: () => stomaModel(true) },
    { id: "closed", label: "ปากใบปิด", build: () => stomaModel(false) },
  ],
  xylem: [{ id: "elements", label: "องค์ประกอบของไซเล็ม", build: xylemModel }],
  phloem: [{ id: "elements", label: "องค์ประกอบของโฟลเอ็ม", build: phloemModel }],
  periderm: [{ id: "layers", label: "ชั้นของเพริเดิร์ม", build: peridermModel }],
};
