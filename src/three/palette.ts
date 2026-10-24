/** Colours shared by the 3D model, the tissue section and the legend. */
export const CELL_COLORS = {
  middleLamella: "#b49a6a",
  primaryWall: "#cfe2b2",
  wallPlain: "#cfe2b2",
  secondaryWall: "#e6d6a8",
  lignin: "#d1765a",
  membrane: "#7fa36c",
  cytoplasm: "#f2ead0",
  vacuole: "#cfe7ef",
  tonoplast: "#86b9cc",
  nucleus: "#9a88c4",
  nucleolus: "#5f4d92",
  amyloplast: "#fffdf4",
  amyloplastEdge: "#cbbf96",
  chloroplast: "#5d9a4a",
  lumen: "#f6f2e6",
  space: "#fbfdf8",
} as const;

export const LEGEND: { key: keyof typeof CELL_COLORS; th: string; en: string }[] = [
  { key: "middleLamella", th: "มิดเดิลลาเมลลา", en: "Middle lamella" },
  { key: "primaryWall", th: "ผนังปฐมภูมิ", en: "Primary wall" },
  { key: "secondaryWall", th: "ผนังทุติยภูมิ", en: "Secondary wall" },
  { key: "lignin", th: "ผนังที่มีลิกนิน", en: "Lignified wall" },
  { key: "cytoplasm", th: "ไซโทพลาซึม", en: "Cytoplasm" },
  { key: "vacuole", th: "แวคิวโอล", en: "Vacuole" },
  { key: "nucleus", th: "นิวเคลียส", en: "Nucleus" },
  { key: "amyloplast", th: "อะไมโลพลาสต์", en: "Amyloplast" },
  { key: "lumen", th: "ลูเมน (ไม่มีโพรโทพลาสต์)", en: "Lumen" },
];
