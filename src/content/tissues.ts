/**
 * LESSON CONTENT — plant tissues (Tissue Library, Knowledge, Discovery).
 *
 * Scope follows the สสวท. upper-secondary biology unit on the structure and
 * growth of flowering plants. Teachers can edit any text here.
 *
 * `reference` is the scientifically typical design used for the reference
 * model, thumbnails and comparison. `detail: "full"` means the knowledge page
 * and 3D model are written; "summary" tissues show only the short description
 * until their mission is built.
 */
import { DEFAULT_DESIGN, effectiveSpace, hasSecondaryWall, type CellDesign } from "@/simulation/design";

export type TissueGroup = "meristem" | "ground" | "dermal" | "vascular";

export const GROUP_TEXT: Record<TissueGroup, { th: string; en: string }> = {
  meristem: { th: "เนื้อเยื่อเจริญ", en: "Meristematic tissue" },
  ground: { th: "เนื้อเยื่อพื้น", en: "Ground tissue" },
  dermal: { th: "เนื้อเยื่อผิว", en: "Dermal tissue" },
  vascular: { th: "เนื้อเยื่อท่อลำเลียง", en: "Vascular tissue" },
};

/**
 * A real light-microscope photograph. Only add images whose licence allows
 * classroom use, and fill in every field: the page shows the credit and links
 * the source. Never add AI-generated pictures here.
 */
export interface Micrograph {
  /** Path under /public, e.g. "/micrographs/potato-parenchyma.jpg" */
  src: string;
  caption: string;
  credit: string;
  license: string;
  sourceUrl: string;
}

/** A feature of the real tissue, checked against the student's design on the compare page. */
export interface Trait {
  text: string;
  matches: (d: CellDesign) => boolean;
  /** Shown when the design differs */
  differs: string;
}

export interface Tissue {
  id: string;
  nameTh: string;
  nameEn: string;
  group: TissueGroup;
  missionId?: string;
  summary: string;
  detail: "full" | "summary";
  reference?: CellDesign;
  /** Other forms of the same tissue the library can switch between (e.g. storage vs chlorenchyma) */
  variants?: { id: string; label: string; design: CellDesign }[];
  traits?: Trait[];
  micrographs?: Micrograph[];
  knowledge?: {
    overview: string[];
    structure: string[];
    function: string[];
    location: string[];
    /** Key features students should be able to name */
    keyFeatures: string[];
  };
}

export const PARENCHYMA_REFERENCE: CellDesign = {
  ...DEFAULT_DESIGN,
  size: 0.62,
  shape: "polyhedral",
  primaryWall: 0.18,
  cornerThickening: 0,
  secondaryWall: 0,
  lignified: false,
  vacuole: 0.82,
  intercellularSpace: 0.42,
  living: true,
  plastids: "amyloplast",
};

/**
 * Chlorenchyma: parenchyma with chloroplasts (leaf mesophyll). Same cell type,
 * different plastids. Shown on the home page and as a variant in the library.
 */
export const CHLORENCHYMA_REFERENCE: CellDesign = {
  ...PARENCHYMA_REFERENCE,
  size: 0.45,
  vacuole: 0.72,
  intercellularSpace: 0.5,
  plastids: "chloroplast",
};

/** Used only as a contrasting picture in quiz questions (full model arrives with Mission 03). */
export const SCLERENCHYMA_FIBER_PICTURE: CellDesign = {
  ...DEFAULT_DESIGN,
  size: 0.25,
  shape: "elongated",
  primaryWall: 0.15,
  secondaryWall: 0.85,
  lignified: true,
  vacuole: 0,
  intercellularSpace: 0,
  living: false,
  plastids: "none",
};

export const TISSUES: Tissue[] = [
  {
    id: "parenchyma",
    nameTh: "พาเรงคิมา",
    nameEn: "Parenchyma",
    group: "ground",
    missionId: "1",
    summary: "เซลล์มีชีวิต ผนังปฐมภูมิบาง แวคิวโอลใหญ่ ทำหน้าที่สะสมสาร สังเคราะห์ด้วยแสง และซ่อมแซมบาดแผล",
    detail: "full",
    reference: PARENCHYMA_REFERENCE,
    variants: [
      { id: "storage", label: "สะสมแป้ง (หัวมันฝรั่ง)", design: PARENCHYMA_REFERENCE },
      { id: "chlorenchyma", label: "คลอเรงคิมา (ใบ)", design: CHLORENCHYMA_REFERENCE },
    ],
    traits: [
      { text: "เซลล์มีชีวิต", matches: (d) => d.living, differs: "แบบของนักเรียนเป็นเซลล์ที่ตาย ส่วนพาเรงคิมาจริงยังมีชีวิต" },
      { text: "ผนังปฐมภูมิค่อนข้างบาง", matches: (d) => d.primaryWall <= 0.4, differs: "ผนังปฐมภูมิของแบบนักเรียนหนากว่าพาเรงคิมาทั่วไป" },
      { text: "โดยทั่วไปไม่มีผนังทุติยภูมิ", matches: (d) => !hasSecondaryWall(d), differs: "แบบของนักเรียนมีผนังทุติยภูมิ ซึ่งพาเรงคิมาทั่วไปไม่มี" },
      { text: "แวคิวโอลขนาดใหญ่", matches: (d) => !d.living || d.vacuole >= 0.6, differs: "แวคิวโอลของแบบนักเรียนเล็กกว่าพาเรงคิมาที่เก็บสาร" },
      { text: "มีช่องว่างระหว่างเซลล์", matches: (d) => effectiveSpace(d) >= 0.2, differs: "แบบของนักเรียนเรียงชิดกว่า พาเรงคิมามักมีช่องว่างระหว่างเซลล์" },
      {
        text: "รูปร่างหลายเหลี่ยมหรือค่อนข้างกลม",
        matches: (d) => d.shape !== "elongated",
        differs: "แบบของนักเรียนเป็นเซลล์ยาว พาเรงคิมาบางแห่งยาวได้ (เช่น แพลิเซดในใบ) แต่ในหัวมันฝรั่งส่วนใหญ่เป็นทรงหลายเหลี่ยม",
      },
    ],
    // Add licensed light-microscope photographs here (see Micrograph above).
    micrographs: [],
    knowledge: {
      overview: [
        "พาเรงคิมา (Parenchyma) เป็นเนื้อเยื่อถาวรที่พบมากที่สุดในพืช และเป็นส่วนใหญ่ของเนื้อเยื่อพื้น (ground tissue)",
        "จัดเป็นเนื้อเยื่อถาวรเชิงเดี่ยว (simple permanent tissue) เพราะประกอบด้วยเซลล์ชนิดเดียว",
        "เซลล์ยังมีชีวิตเมื่อเจริญเต็มที่ จึงทำหน้าที่ได้หลากหลาย และยังกลับมาแบ่งเซลล์ได้เมื่อจำเป็น",
      ],
      structure: [
        "เซลล์มีชีวิต มีนิวเคลียส ไซโทพลาซึม และแวคิวโอลขนาดใหญ่",
        "รูปร่างมีหลายแบบ ส่วนใหญ่เป็นทรงหลายเหลี่ยม (ประมาณ 14 หน้าเมื่ออัดกันแน่น) หรือค่อนข้างกลม",
        "ผนังเซลล์เป็นผนังปฐมภูมิ ค่อนข้างบาง หนาสม่ำเสมอ โดยทั่วไปไม่มีผนังทุติยภูมิ",
        "มักมีช่องว่างระหว่างเซลล์ (intercellular space) ตรงมุมที่เซลล์มาบรรจบกัน",
        "ชนิดของพลาสทิดขึ้นกับหน้าที่ เช่น อะไมโลพลาสต์ในเซลล์ที่เก็บแป้ง คลอโรพลาสต์ในเซลล์ที่สังเคราะห์ด้วยแสง ไม่ใช่ทุกเซลล์ที่มีคลอโรพลาสต์",
      ],
      function: [
        "สะสมสาร เช่น แป้งในอะไมโลพลาสต์ น้ำและสารละลายในแวคิวโอล",
        "สังเคราะห์ด้วยแสง เมื่อมีคลอโรพลาสต์ เรียกว่า คลอเรงคิมา (chlorenchyma)",
        "ช่องว่างระหว่างเซลล์ช่วยให้แก๊สแพร่ผ่านเนื้อเยื่อ ในพืชน้ำบางชนิดช่องว่างมีขนาดใหญ่มาก เรียกว่า แอเรงคิมา (aerenchyma)",
        "ซ่อมแซมบาดแผลและกลับมาแบ่งเซลล์ได้ใหม่",
        "ช่วยพยุงอวัยวะอ่อนเมื่อเซลล์เต่ง (turgor)",
      ],
      location: [
        "คอร์เทกซ์ (cortex) และพิท (pith) ของลำต้นและราก",
        "มีโซฟิลล์ (mesophyll) ของใบ ซึ่งเป็นคลอเรงคิมา",
        "เนื้อผลไม้ หัวมันฝรั่ง และใบเลี้ยงของเมล็ดถั่ว",
        "อยู่ในเนื้อเยื่อท่อลำเลียงด้วย ได้แก่ ไซเล็มพาเรงคิมา และโฟลเอ็มพาเรงคิมา",
      ],
      keyFeatures: ["เซลล์มีชีวิต", "ผนังปฐมภูมิบาง", "แวคิวโอลใหญ่", "มีช่องว่างระหว่างเซลล์"],
    },
  },
  {
    id: "collenchyma",
    nameTh: "คอลเลงคิมา",
    nameEn: "Collenchyma",
    group: "ground",
    missionId: "2",
    summary: "เซลล์มีชีวิต ผนังปฐมภูมิหนาไม่สม่ำเสมอ (มักหนาที่มุม) ค้ำจุนอวัยวะที่ยังเจริญเติบโต",
    detail: "summary",
  },
  {
    id: "sclerenchyma",
    nameTh: "สเกลอเรงคิมา",
    nameEn: "Sclerenchyma",
    group: "ground",
    missionId: "3",
    summary: "ผนังทุติยภูมิหนา มีลิกนิน เซลล์มักตายเมื่อเจริญเต็มที่ แบ่งเป็นไฟเบอร์ (fiber) และสเกลอรีด (sclereid)",
    detail: "summary",
  },
  {
    id: "meristem",
    nameTh: "เนื้อเยื่อเจริญ",
    nameEn: "Meristematic tissue",
    group: "meristem",
    missionId: "4",
    summary: "เซลล์เล็ก ผนังบาง นิวเคลียสใหญ่ ไซโทพลาซึมหนาแน่น แวคิวโอลเล็ก แบ่งเซลล์ได้ตลอด",
    detail: "summary",
  },
  {
    id: "epidermis",
    nameTh: "เอพิเดอร์มิส",
    nameEn: "Epidermis",
    group: "dermal",
    missionId: "5",
    summary: "เซลล์ชั้นนอกสุดเรียงต่อเนื่อง ส่วนที่อยู่เหนือดินมีคิวทินเคลือบ มีเซลล์คุม ขน และขนราก",
    detail: "summary",
  },
  {
    id: "guard-cell",
    nameTh: "เซลล์คุม",
    nameEn: "Guard cells",
    group: "dermal",
    missionId: "6",
    summary: "เซลล์เอพิเดอร์มิสที่เปลี่ยนแปลงไป อยู่เป็นคู่รอบปากใบ ผนังหนาไม่เท่ากัน ควบคุมการเปิดปิดปากใบ",
    detail: "summary",
  },
  {
    id: "xylem",
    nameTh: "ไซเล็ม",
    nameEn: "Xylem",
    group: "vascular",
    missionId: "7",
    summary: "ลำเลียงน้ำและแร่ธาตุ ประกอบด้วยเทรคีด เวสเซลเมมเบอร์ ไซเล็มพาเรงคิมา และไซเล็มไฟเบอร์",
    detail: "summary",
  },
  {
    id: "phloem",
    nameTh: "โฟลเอ็ม",
    nameEn: "Phloem",
    group: "vascular",
    missionId: "8",
    summary: "ลำเลียงอาหาร ประกอบด้วยซีฟทิวบ์เมมเบอร์ เซลล์คอมพาเนียน โฟลเอ็มพาเรงคิมา และโฟลเอ็มไฟเบอร์",
    detail: "summary",
  },
  {
    id: "periderm",
    nameTh: "เพริเดิร์ม",
    nameEn: "Periderm",
    group: "dermal",
    missionId: "9",
    summary: "เนื้อเยื่อผิวที่เกิดแทนเอพิเดอร์มิสเมื่อมีการเจริญทุติยภูมิ ประกอบด้วยเฟลเลม (คอร์ก) เฟลโลเจน และเฟลโลเดิร์ม",
    detail: "summary",
  },
];

export function getTissue(id: string): Tissue | undefined {
  return TISSUES.find((t) => t.id === id);
}
