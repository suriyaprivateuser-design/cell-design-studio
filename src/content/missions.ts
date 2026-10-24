/**
 * LESSON CONTENT — missions.
 *
 * Teachers can edit the Thai text here (problem, goals, captions) without
 * touching any UI or simulation code. Goal `id`s must match the goal ids in
 * the mission's rules file (src/simulation/missions/missionXX.ts).
 *
 * Mission ids are plain numbers on purpose: the URL must not reveal the
 * tissue name while Student Discovery Mode is on.
 */
import type { CellDesign, ControlId } from "@/simulation/design";
import { DEFAULT_DESIGN } from "@/simulation/design";

export type SceneId =
  | "tuber"
  | "young-stem"
  | "hard-shell"
  | "shoot-tip"
  | "leaf-surface"
  | "stoma"
  | "tall-tree"
  | "sugar-transport"
  | "bark";

export interface Mission {
  id: string;
  number: string;
  title: string;
  titleEn: string;
  /** Tissue the mission leads to; hidden in Discovery Mode until the mission is done */
  tissueId: string;
  scene: SceneId;
  /** Short caption under the scene picture */
  sceneCaption: string;
  problem: string;
  goals: { id: string; text: string }[];
  /** Controls shown in the studio, in display order. Only what the mission needs. */
  controls: ControlId[];
  startDesign: CellDesign;
  /** "available": studio works now. "planned": problem screen only, studio arrives in a later phase */
  studio: "available" | "planned";
  plannedPhase?: number;
  /** Shown after the test once the design fits the problem */
  discovery?: string;
}

export const MISSIONS: Mission[] = [
  {
    id: "1",
    number: "01",
    title: "สะสมสารอาหาร",
    titleEn: "Food storage",
    tissueId: "parenchyma",
    scene: "tuber",
    sceneCaption: "หัวมันฝรั่งผ่าครึ่ง เนื้อด้านในเก็บแป้งไว้มาก",
    problem:
      "หัวมันฝรั่งต้องเก็บน้ำและแป้งไว้ใช้ตอนงอกเป็นต้นใหม่ เซลล์ส่วนใหญ่อยู่ลึกจากผิว แต่ยังต้องได้รับออกซิเจน นักเรียนจะออกแบบเซลล์อย่างไร?",
    goals: [
      { id: "store", text: "เก็บน้ำ แป้ง และสารละลายไว้ในเซลล์ได้มาก" },
      { id: "alive", text: "เซลล์ยังทำกิจกรรมได้ สร้างแป้งและนำแป้งกลับมาใช้ได้" },
      { id: "oxygen", text: "ออกซิเจนแพร่ถึงเซลล์ที่อยู่ด้านในได้" },
    ],
    controls: ["shape", "size", "primaryWall", "secondaryWall", "lignified", "vacuole", "intercellularSpace", "living"],
    startDesign: {
      ...DEFAULT_DESIGN,
      size: 0.3,
      shape: "polyhedral",
      primaryWall: 0.55,
      secondaryWall: 0,
      lignified: false,
      vacuole: 0.3,
      intercellularSpace: 0.08,
      living: true,
      plastids: "amyloplast",
    },
    studio: "available",
    discovery:
      "เซลล์ที่มีชีวิต ผนังปฐมภูมิบาง แวคิวโอลใหญ่ และมีช่องว่างระหว่างเซลล์ คือลักษณะของพาเรงคิมา (Parenchyma) ซึ่งเป็นเนื้อเยื่อพื้นที่พบมากที่สุดในพืช ทำหน้าที่สะสมสาร และยังสังเคราะห์ด้วยแสงได้เมื่อมีคลอโรพลาสต์",
  },
  {
    id: "2",
    number: "02",
    title: "ค้ำจุนลำต้นอ่อน",
    titleEn: "Support a growing stem",
    tissueId: "collenchyma",
    scene: "young-stem",
    sceneCaption: "ยอดอ่อนและก้านใบที่ยังยืดยาวได้",
    problem:
      "ลำต้นอ่อนต้องตั้งตรง ทนต่อการโค้งงอ และยังเจริญเติบโตได้ นักเรียนจะออกแบบเซลล์อย่างไร?",
    goals: [
      { id: "support", text: "ช่วยให้ลำต้นอ่อนตั้งตรงและไม่หักง่ายเมื่อโค้งงอ" },
      { id: "grow", text: "เซลล์ยังขยายขนาดตามการยืดยาวของลำต้นได้" },
      { id: "alive", text: "เซลล์ยังมีชีวิต" },
    ],
    controls: ["shape", "primaryWall", "cornerThickening", "secondaryWall", "lignified", "intercellularSpace", "living"],
    startDesign: { ...DEFAULT_DESIGN },
    studio: "planned",
    plannedPhase: 3,
  },
  {
    id: "3",
    number: "03",
    title: "ค้ำจุนให้แข็งแรง",
    titleEn: "Strong, rigid support",
    tissueId: "sclerenchyma",
    scene: "hard-shell",
    sceneCaption: "ลำต้นที่หยุดยืดยาวแล้ว และกะลามะพร้าว",
    problem:
      "ส่วนของพืชที่หยุดยืดยาวแล้ว และเปลือกแข็งหุ้มเมล็ด ต้องแข็งแรงมาก ทนแรงกดได้แม้ขาดน้ำ นักเรียนจะออกแบบเซลล์อย่างไร?",
    goals: [
      { id: "strong", text: "ผนังเซลล์แข็งแรงมาก ทนแรงกดและแรงดึง" },
      { id: "shape", text: "คงรูปได้แม้ไม่มีแรงดันเต่ง" },
    ],
    controls: ["shape", "size", "primaryWall", "secondaryWall", "lignified", "vacuole", "living"],
    startDesign: { ...DEFAULT_DESIGN },
    studio: "planned",
    plannedPhase: 3,
  },
  {
    id: "4",
    number: "04",
    title: "เพิ่มจำนวนเซลล์",
    titleEn: "Make new cells",
    tissueId: "meristem",
    scene: "shoot-tip",
    sceneCaption: "ปลายยอดและปลายรากที่ยาวขึ้นทุกวัน",
    problem:
      "ปลายยอดและปลายรากต้องสร้างเซลล์ใหม่อยู่ตลอดเวลาเพื่อให้พืชยาวขึ้น นักเรียนจะออกแบบเซลล์อย่างไร?",
    goals: [
      { id: "divide", text: "แบ่งเซลล์ได้ต่อเนื่องและรวดเร็ว" },
      { id: "compact", text: "เซลล์เรียงชิด ใช้พื้นที่น้อย" },
    ],
    controls: ["size", "primaryWall", "vacuole", "intercellularSpace", "living"],
    startDesign: { ...DEFAULT_DESIGN },
    studio: "planned",
    plannedPhase: 4,
  },
  {
    id: "5",
    number: "05",
    title: "ป้องกันและลดการสูญเสียน้ำ",
    titleEn: "Protect and save water",
    tissueId: "epidermis",
    scene: "leaf-surface",
    sceneCaption: "ผิวใบกลางแดดและลม",
    problem:
      "ใบอยู่กลางแดดและลม น้ำระเหยออกทางผิวใบได้ง่าย แต่แสงยังต้องผ่านเข้าไปถึงเซลล์ด้านใน นักเรียนจะออกแบบชั้นผิวอย่างไร?",
    goals: [
      { id: "cover", text: "ปกคลุมผิวต่อเนื่อง ไม่มีช่องว่างระหว่างเซลล์" },
      { id: "water", text: "ลดการระเหยของน้ำออกจากผิว" },
      { id: "light", text: "แสงผ่านเข้าไปถึงเซลล์ด้านในได้" },
    ],
    controls: ["shape", "primaryWall", "intercellularSpace", "living"],
    startDesign: { ...DEFAULT_DESIGN },
    studio: "planned",
    plannedPhase: 4,
  },
  {
    id: "6",
    number: "06",
    title: "ควบคุมการเปิดปิดปากใบ",
    titleEn: "Open and close stomata",
    tissueId: "guard-cell",
    scene: "stoma",
    sceneCaption: "ปากใบบนผิวใบ",
    problem:
      "ใบต้องรับ CO₂ เข้าไปใช้สังเคราะห์ด้วยแสง แต่ไม่ควรเสียน้ำมากเกินไปในช่วงที่ร้อนจัด นักเรียนจะออกแบบเซลล์ที่ทำให้ช่องเปิดปิดได้อย่างไร?",
    goals: [
      { id: "open", text: "ช่องเปิดกว้างเมื่อเซลล์เต่ง" },
      { id: "close", text: "ช่องปิดเมื่อเซลล์สูญเสียน้ำ" },
    ],
    controls: ["shape", "primaryWall", "vacuole", "living"],
    startDesign: { ...DEFAULT_DESIGN },
    studio: "planned",
    plannedPhase: 4,
  },
  {
    id: "7",
    number: "07",
    title: "ลำเลียงน้ำและแร่ธาตุ",
    titleEn: "Carry water and minerals",
    tissueId: "xylem",
    scene: "tall-tree",
    sceneCaption: "ต้นไม้สูงหลายเมตร",
    problem:
      "ต้นไม้สูงหลายเมตรต้องส่งน้ำและแร่ธาตุจากรากขึ้นไปถึงใบบนยอด ท่อต้องไม่แฟบแม้น้ำถูกดึงขึ้นด้วยแรงตึง นักเรียนจะออกแบบเซลล์อย่างไร?",
    goals: [
      { id: "flow", text: "น้ำไหลต่อเนื่องจากเซลล์หนึ่งไปอีกเซลล์หนึ่งได้ดี" },
      { id: "rigid", text: "ผนังแข็งแรง ท่อไม่แฟบ" },
    ],
    controls: ["shape", "size", "secondaryWall", "lignified", "living"],
    startDesign: { ...DEFAULT_DESIGN },
    studio: "planned",
    plannedPhase: 4,
  },
  {
    id: "8",
    number: "08",
    title: "ลำเลียงอาหาร",
    titleEn: "Carry sugars",
    tissueId: "phloem",
    scene: "sugar-transport",
    sceneCaption: "น้ำตาลจากใบส่งไปยังราก ผล และยอดอ่อน",
    problem:
      "น้ำตาลที่ใบสร้างขึ้นต้องถูกส่งไปยังราก ผล และยอดอ่อน ทั้งขึ้นและลง นักเรียนจะออกแบบเซลล์ลำเลียงอย่างไร?",
    goals: [
      { id: "flow", text: "สารละลายน้ำตาลเคลื่อนผ่านจากเซลล์สู่เซลล์ได้ดี" },
      { id: "alive", text: "เซลล์ลำเลียงยังมีชีวิตและได้รับการดูแลจากเซลล์ข้างเคียง" },
    ],
    controls: ["shape", "size", "primaryWall", "living"],
    startDesign: { ...DEFAULT_DESIGN },
    studio: "planned",
    plannedPhase: 4,
  },
  {
    id: "9",
    number: "09",
    title: "สร้างเนื้อเยื่อผิวทดแทน",
    titleEn: "Replace the outer skin",
    tissueId: "periderm",
    scene: "bark",
    sceneCaption: "เปลือกของลำต้นที่ขยายขนาดออกด้านข้าง",
    problem:
      "เมื่อลำต้นขยายขนาดออกด้านข้าง ผิวเดิมยืดตามไม่ได้จนปริแตก พืชต้องสร้างชั้นผิวใหม่ที่กันน้ำและป้องกันอันตราย นักเรียนจะออกแบบชั้นเซลล์อย่างไร?",
    goals: [
      { id: "replace", text: "สร้างเซลล์ชั้นใหม่ทดแทนผิวเดิมได้ต่อเนื่อง" },
      { id: "seal", text: "ชั้นนอกกันน้ำและป้องกันการบาดเจ็บ" },
    ],
    controls: ["shape", "secondaryWall", "intercellularSpace", "living"],
    startDesign: { ...DEFAULT_DESIGN },
    studio: "planned",
    plannedPhase: 4,
  },
];

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}

export function nextMission(id: string): Mission | undefined {
  const i = MISSIONS.findIndex((m) => m.id === id);
  return i >= 0 ? MISSIONS[i + 1] : undefined;
}
