/**
 * The cell design: every value a student can change in the studio.
 *
 * The same object drives three things, so they can never disagree:
 *   1. the 3D model geometry   (src/three/*)
 *   2. the tissue preview      (src/tissue/*)
 *   3. the performance rules   (src/simulation/rules/*)
 *
 * Slider values are 0–1 positions, not measurements. Where a value maps to a
 * real-world size it is converted in one place below (e.g. sizeMicrometres).
 */

export type CellShape = "polyhedral" | "rounded" | "elongated";
export type PlastidKind = "none" | "amyloplast" | "chloroplast";

export interface CellDesign {
  /** 0 = small (~20 µm) … 1 = large (~150 µm) */
  size: number;
  shape: CellShape;
  /** Primary wall thickness, 0 = very thin … 1 = very thick */
  primaryWall: number;
  /** Extra primary-wall thickening at the cell corners (angular collenchyma). 0 = even wall */
  cornerThickening: number;
  /** Secondary wall thickness. 0 = no secondary wall */
  secondaryWall: number;
  /** Lignin deposited in the secondary wall (only meaningful when secondaryWall > 0) */
  lignified: boolean;
  /** Vacuole share of the protoplast, 0 = tiny … 1 = very large central vacuole */
  vacuole: number;
  /** Intercellular space in the tissue, 0 = tightly packed … 1 = large spaces */
  intercellularSpace: number;
  /** Living protoplast at maturity */
  living: boolean;
  /** Plastids shown in the cytoplasm (set by the mission scenario, not a slider) */
  plastids: PlastidKind;
}

export type ControlId =
  | "shape"
  | "size"
  | "primaryWall"
  | "cornerThickening"
  | "secondaryWall"
  | "lignified"
  | "vacuole"
  | "intercellularSpace"
  | "living";

export type ControlGroup = "form" | "wall" | "inside" | "tissue";

export const CONTROL_GROUPS: Record<ControlGroup, string> = {
  form: "รูปร่างและขนาด",
  wall: "ผนังเซลล์",
  inside: "ภายในเซลล์",
  tissue: "การจัดเรียงในเนื้อเยื่อ",
};

interface BaseControl {
  id: ControlId;
  group: ControlGroup;
  label: string;
  labelEn: string;
  help: string;
}

export interface SliderControl extends BaseControl {
  kind: "slider";
  key: "size" | "primaryWall" | "cornerThickening" | "secondaryWall" | "vacuole" | "intercellularSpace";
  describe: (value: number) => string;
}

export interface ChoiceControl extends BaseControl {
  kind: "choice";
  key: "shape";
  options: { value: CellShape; label: string; labelEn: string }[];
}

export interface ToggleControl extends BaseControl {
  kind: "toggle";
  key: "living" | "lignified";
  on: string;
  off: string;
}

export type Control = SliderControl | ChoiceControl | ToggleControl;

/** Qualitative wording for a 0–1 slider position. */
export function band(value: number, words: [string, string, string, string, string]): string {
  if (value < 0.2) return words[0];
  if (value < 0.4) return words[1];
  if (value < 0.65) return words[2];
  if (value < 0.85) return words[3];
  return words[4];
}

/** Approximate cell diameter for the size slider (typical plant cells span ~20–150 µm). */
export function sizeMicrometres(size: number): number {
  return Math.round((20 + 130 * size) / 5) * 5;
}

export const CONTROLS: Record<ControlId, Control> = {
  shape: {
    id: "shape",
    kind: "choice",
    key: "shape",
    group: "form",
    label: "รูปร่างเซลล์",
    labelEn: "Cell shape",
    help: "รูปร่างของเซลล์มีผลต่อการเรียงตัวและช่องว่างระหว่างเซลล์",
    options: [
      { value: "polyhedral", label: "หลายเหลี่ยม", labelEn: "Polyhedral" },
      { value: "rounded", label: "ค่อนข้างกลม", labelEn: "Rounded" },
      { value: "elongated", label: "ยาว", labelEn: "Elongated" },
    ],
  },
  size: {
    id: "size",
    kind: "slider",
    key: "size",
    group: "form",
    label: "ขนาดเซลล์",
    labelEn: "Cell size",
    help: "ขนาดโดยประมาณของเซลล์ เมื่อเซลล์ใหญ่ขึ้น ปริมาตรภายในเซลล์เพิ่มขึ้นมาก",
    describe: (v) => `${band(v, ["เล็กมาก", "เล็ก", "ปานกลาง", "ใหญ่", "ใหญ่มาก"])} · ≈ ${sizeMicrometres(v)} µm`,
  },
  primaryWall: {
    id: "primaryWall",
    kind: "slider",
    key: "primaryWall",
    group: "wall",
    label: "ความหนาผนังปฐมภูมิ",
    labelEn: "Primary wall thickness",
    help: "ผนังปฐมภูมิสร้างขึ้นขณะเซลล์ยังขยายขนาด มีเซลลูโลสเป็นหลัก ยืดขยายได้",
    describe: (v) => band(v, ["บางมาก", "บาง", "ปานกลาง", "หนา", "หนามาก"]),
  },
  cornerThickening: {
    id: "cornerThickening",
    kind: "slider",
    key: "cornerThickening",
    group: "wall",
    label: "การหนาตัวไม่สม่ำเสมอ (ที่มุมเซลล์)",
    labelEn: "Uneven wall thickening",
    help: "ผนังปฐมภูมิหนาขึ้นเฉพาะบางบริเวณ เช่น ตรงมุมที่เซลล์หลายเซลล์มาชนกัน",
    describe: (v) => band(v, ["ไม่มี", "เล็กน้อย", "ปานกลาง", "ชัดเจน", "ชัดเจนมาก"]),
  },
  secondaryWall: {
    id: "secondaryWall",
    kind: "slider",
    key: "secondaryWall",
    group: "wall",
    label: "ผนังทุติยภูมิ",
    labelEn: "Secondary cell wall",
    help: "ผนังชั้นที่สร้างเพิ่มด้านในผนังปฐมภูมิ หลังเซลล์หยุดขยายขนาดแล้ว",
    describe: (v) => (v < 0.05 ? "ไม่มี" : band(v, ["บาง", "บาง", "ปานกลาง", "หนา", "หนามาก"])),
  },
  lignified: {
    id: "lignified",
    kind: "toggle",
    key: "lignified",
    group: "wall",
    label: "การสะสมลิกนิน",
    labelEn: "Lignification",
    help: "ลิกนินทำให้ผนังแข็งและน้ำซึมผ่านได้น้อย สะสมได้เมื่อมีผนังทุติยภูมิ",
    on: "มีลิกนิน",
    off: "ไม่มีลิกนิน",
  },
  vacuole: {
    id: "vacuole",
    kind: "slider",
    key: "vacuole",
    group: "inside",
    label: "ขนาดแวคิวโอล",
    labelEn: "Vacuole size",
    help: "แวคิวโอลเก็บน้ำและสารละลาย เช่น น้ำตาล ไอออน และรงควัตถุ",
    describe: (v) => band(v, ["เล็กมาก", "เล็ก", "ปานกลาง", "ใหญ่", "ใหญ่มาก"]),
  },
  intercellularSpace: {
    id: "intercellularSpace",
    kind: "slider",
    key: "intercellularSpace",
    group: "tissue",
    label: "ช่องว่างระหว่างเซลล์",
    labelEn: "Intercellular space",
    help: "ช่องว่างเกิดตรงมุมที่เซลล์มาบรรจบกัน เป็นทางให้แก๊สแพร่ผ่านเนื้อเยื่อ",
    describe: (v) => band(v, ["แทบไม่มี", "น้อย", "ปานกลาง", "มาก", "มากที่สุด"]),
  },
  living: {
    id: "living",
    kind: "toggle",
    key: "living",
    group: "inside",
    label: "สภาพเมื่อเจริญเต็มที่",
    labelEn: "Living / Dead at maturity",
    help: "เซลล์ที่ตายเมื่อเจริญเต็มที่ไม่มีโพรโทพลาสต์ (ไม่มีนิวเคลียส ไซโทพลาซึม และแวคิวโอล)",
    on: "มีชีวิต",
    off: "ตาย",
  },
};

export const DEFAULT_DESIGN: CellDesign = {
  size: 0.45,
  shape: "polyhedral",
  primaryWall: 0.25,
  cornerThickening: 0,
  secondaryWall: 0,
  lignified: false,
  vacuole: 0.6,
  intercellularSpace: 0.3,
  living: true,
  plastids: "none",
};

/** Human-readable summary of each control value, used on the results page. */
export function describeControl(control: Control, design: CellDesign): string {
  switch (control.kind) {
    case "slider":
      return control.describe(design[control.key]);
    case "choice":
      return control.options.find((o) => o.value === design.shape)?.label ?? design.shape;
    case "toggle":
      return design[control.key] ? control.on : control.off;
  }
}

export function hasProtoplast(design: CellDesign): boolean {
  return design.living;
}

export function hasSecondaryWall(design: CellDesign): boolean {
  return design.secondaryWall >= 0.05;
}

/**
 * Rounded cells cannot pack without gaps: wherever three or more round cells
 * meet, a space is left at the corner. The tissue preview and the rules both
 * use this value so the picture and the explanation agree.
 */
export const ROUNDED_MIN_SPACE = 0.3;

export function effectiveSpace(design: CellDesign): number {
  return design.shape === "rounded" ? Math.max(design.intercellularSpace, ROUNDED_MIN_SPACE) : design.intercellularSpace;
}
