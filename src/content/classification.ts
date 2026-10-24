/**
 * LESSON CONTENT — Plant Tissue Classification page.
 *
 * Permanent tissues are shown under TWO separate criteria, because they are
 * different ways of grouping the same tissues:
 *   1. by the kinds of cells in the tissue (simple / complex)
 *   2. by tissue system (dermal / ground / vascular)
 */

export interface ClassNode {
  id: string;
  th: string;
  en: string;
  info: string;
  /** Library entry to open, if any */
  tissueId?: string;
  children?: ClassNode[];
  /** Marks a point where textbooks differ; shown with a note */
  note?: string;
}

export const MERISTEM_TREE: ClassNode = {
  id: "meristem",
  th: "เนื้อเยื่อเจริญ",
  en: "Meristematic tissue",
  info: "เซลล์แบ่งตัวได้ตลอด เซลล์เล็ก ผนังปฐมภูมิบาง นิวเคลียสใหญ่ ไซโทพลาซึมหนาแน่น แวคิวโอลเล็ก จำแนกตามตำแหน่งที่พบ",
  tissueId: "meristem",
  children: [
    {
      id: "apical",
      th: "เนื้อเยื่อเจริญส่วนปลาย",
      en: "Apical meristem",
      info: "อยู่ที่ปลายยอดและปลายราก แบ่งเซลล์ทำให้ลำต้นและรากยาวขึ้น เป็นการเจริญขั้นแรก (primary growth)",
    },
    {
      id: "lateral",
      th: "เนื้อเยื่อเจริญด้านข้าง",
      en: "Lateral meristem",
      info: "อยู่ด้านข้างของลำต้นและราก ทำให้ขยายขนาดออกด้านข้าง เป็นการเจริญขั้นที่สอง (secondary growth) พบมากในพืชใบเลี้ยงคู่และพืชเมล็ดเปลือย",
      children: [
        {
          id: "vascular-cambium",
          th: "วาสคิวลาร์แคมเบียม",
          en: "Vascular cambium",
          info: "แบ่งเซลล์สร้างไซเล็มทุติยภูมิทางด้านใน และโฟลเอ็มทุติยภูมิทางด้านนอก",
        },
        {
          id: "cork-cambium",
          th: "คอร์กแคมเบียม (เฟลโลเจน)",
          en: "Cork cambium (Phellogen)",
          info: "แบ่งเซลล์สร้างเฟลเลม (คอร์ก) ทางด้านนอก และเฟลโลเดิร์มทางด้านใน รวมเป็นเพริเดิร์ม",
          tissueId: "periderm",
        },
      ],
    },
    {
      id: "intercalary",
      th: "เนื้อเยื่อเจริญเหนือข้อ",
      en: "Intercalary meristem",
      info: "อยู่บริเวณโคนปล้องเหนือข้อ พบมากในพืชใบเลี้ยงเดี่ยว เช่น หญ้า ข้าว ไผ่ ทำให้ปล้องยืดยาวขึ้น",
    },
  ],
};

export const BY_CELL_TYPES: ClassNode[] = [
  {
    id: "simple",
    th: "เนื้อเยื่อถาวรเชิงเดี่ยว",
    en: "Simple permanent tissue",
    info: "ประกอบด้วยเซลล์ชนิดเดียวเป็นหลัก",
    children: [
      { id: "s-parenchyma", th: "พาเรงคิมา", en: "Parenchyma", info: "เซลล์มีชีวิต ผนังปฐมภูมิบาง แวคิวโอลใหญ่", tissueId: "parenchyma" },
      { id: "s-collenchyma", th: "คอลเลงคิมา", en: "Collenchyma", info: "เซลล์มีชีวิต ผนังปฐมภูมิหนาไม่สม่ำเสมอ", tissueId: "collenchyma" },
      { id: "s-sclerenchyma", th: "สเกลอเรงคิมา", en: "Sclerenchyma", info: "ผนังทุติยภูมิหนา มีลิกนิน (ไฟเบอร์และสเกลอรีด)", tissueId: "sclerenchyma" },
    ],
  },
  {
    id: "complex",
    th: "เนื้อเยื่อถาวรเชิงซ้อน",
    en: "Complex permanent tissue",
    info: "ประกอบด้วยเซลล์หลายชนิดทำงานร่วมกัน",
    children: [
      { id: "c-xylem", th: "ไซเล็ม", en: "Xylem", info: "เทรคีด เวสเซลเมมเบอร์ ไซเล็มพาเรงคิมา ไซเล็มไฟเบอร์", tissueId: "xylem" },
      { id: "c-phloem", th: "โฟลเอ็ม", en: "Phloem", info: "ซีฟทิวบ์เมมเบอร์ เซลล์คอมพาเนียน โฟลเอ็มพาเรงคิมา โฟลเอ็มไฟเบอร์", tissueId: "phloem" },
    ],
  },
  {
    id: "debated",
    th: "จัดต่างกันในแต่ละตำรา",
    en: "Classified differently",
    info: "เอพิเดอร์มิสและเพริเดิร์มประกอบด้วยเซลล์หลายชนิด (เช่น เซลล์คุม ขน) บางตำราจัดเป็นเนื้อเยื่อเชิงเดี่ยว บางตำราจัดเป็นเชิงซ้อน",
    note: "ให้ยึดตามหนังสือเรียนที่ใช้สอน และตรวจสอบกับหนังสือเรียน สสวท.",
    children: [
      { id: "d-epidermis", th: "เอพิเดอร์มิส", en: "Epidermis", info: "เซลล์ผิว เซลล์คุม ขน ขนราก", tissueId: "epidermis" },
      { id: "d-periderm", th: "เพริเดิร์ม", en: "Periderm", info: "เฟลเลม เฟลโลเจน เฟลโลเดิร์ม", tissueId: "periderm" },
    ],
  },
];

export const BY_TISSUE_SYSTEM: ClassNode[] = [
  {
    id: "dermal",
    th: "ระบบเนื้อเยื่อผิว",
    en: "Dermal tissue system",
    info: "ปกคลุมและป้องกันส่วนต่าง ๆ ของพืช",
    children: [
      { id: "t-epidermis", th: "เอพิเดอร์มิส", en: "Epidermis", info: "ผิวของพืชในการเจริญขั้นแรก", tissueId: "epidermis" },
      { id: "t-periderm", th: "เพริเดิร์ม", en: "Periderm", info: "ผิวที่เกิดแทนเอพิเดอร์มิสเมื่อมีการเจริญขั้นที่สอง", tissueId: "periderm" },
    ],
  },
  {
    id: "ground",
    th: "ระบบเนื้อเยื่อพื้น",
    en: "Ground tissue system",
    info: "อยู่ระหว่างเนื้อเยื่อผิวกับเนื้อเยื่อท่อลำเลียง ทำหน้าที่สะสม สังเคราะห์ด้วยแสง และค้ำจุน",
    children: [
      { id: "g-parenchyma", th: "พาเรงคิมา", en: "Parenchyma", info: "สะสมสาร สังเคราะห์ด้วยแสง", tissueId: "parenchyma" },
      { id: "g-collenchyma", th: "คอลเลงคิมา", en: "Collenchyma", info: "ค้ำจุนอวัยวะที่ยังเจริญ", tissueId: "collenchyma" },
      { id: "g-sclerenchyma", th: "สเกลอเรงคิมา", en: "Sclerenchyma", info: "ค้ำจุนให้แข็งแรง", tissueId: "sclerenchyma" },
    ],
  },
  {
    id: "vascular",
    th: "ระบบเนื้อเยื่อท่อลำเลียง",
    en: "Vascular tissue system",
    info: "ลำเลียงน้ำ แร่ธาตุ และอาหารไปทั่วต้น",
    children: [
      { id: "v-xylem", th: "ไซเล็ม", en: "Xylem", info: "ลำเลียงน้ำและแร่ธาตุ", tissueId: "xylem" },
      { id: "v-phloem", th: "โฟลเอ็ม", en: "Phloem", info: "ลำเลียงอาหาร", tissueId: "phloem" },
    ],
  },
];
