/** Colours shared by the 3D model, the tissue section and the legend. */
export const CELL_COLORS = {
  middleLamella: "#b3c057",
  primaryWall: "#dbe686",
  wallPlain: "#dbe686",
  secondaryWall: "#ead9a0",
  lignin: "#d27a54",
  membrane: "#8cbf5e",
  cytoplasm: "#a9da7c",
  vacuole: "#d6f6cc",
  tonoplast: "#8fcf86",
  nucleus: "#b49ce6",
  nucleolus: "#6a4bb3",
  amyloplast: "#fffaf0",
  amyloplastEdge: "#d4c38c",
  chloroplast: "#4f9e33",
  lumen: "#f3efde",
  space: "#8e8b78",
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

/** Extra colours for the tissue models beyond the designable cell. */
export const MODEL_COLORS = {
  denseCytoplasm: "#93cf68",
  companionCytoplasm: "#7cc457",
  sieveCytoplasm: "#d3ecb4",
  thinWall: "#e6edb4",
  cuticle: "#f4e48a",
  guardCell: "#b2df84",
  pavementCell: "#eef6d6",
  pore: "#46523a",
  suberin: "#a06b43",
  corkLumen: "#ead3ad",
  pitBorder: "#f3cfa8",
  pitHole: "#5b3524",
  plasmodesma: "#5f7d3a",
  chromosome: "#6a4bb3",
} as const;
