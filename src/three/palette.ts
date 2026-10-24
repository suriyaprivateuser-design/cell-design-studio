/** Colours shared by the 3D model, the tissue section and the legend. */
export const CELL_COLORS = {
  middleLamella: "#b8c46a",
  primaryWall: "#dfe995",
  wallPlain: "#dfe995",
  secondaryWall: "#e9dca6",
  lignin: "#d1765a",
  membrane: "#9cc46e",
  cytoplasm: "#e4f0bd",
  vacuole: "#cdeec6",
  tonoplast: "#9fd08f",
  nucleus: "#a88bd8",
  nucleolus: "#6e4fb3",
  amyloplast: "#fffbec",
  amyloplastEdge: "#d6c891",
  chloroplast: "#5aa437",
  lumen: "#f2efdf",
  space: "#a9a693",
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
