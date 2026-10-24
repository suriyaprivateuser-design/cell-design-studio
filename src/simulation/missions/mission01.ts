import { effectiveSpace, hasSecondaryWall, ROUNDED_MIN_SPACE } from "../design";
import type { MissionRules } from "../rules";

/**
 * Mission 01 — สะสมสารอาหาร (storage).
 * Target tissue: parenchyma (revealed only after the test).
 *
 * Thresholds are 0–1 slider positions. Every sentence here is what students
 * read as the reason for a level, so keep each one a correct, checkable
 * statement about plant cells.
 */
export const mission01Rules: MissionRules = {
  metrics: [
    {
      id: "storage",
      label: "การสะสมสาร",
      labelEn: "Storage suitability",
      about: "เก็บน้ำ แป้ง และสารละลายไว้ภายในเซลล์ได้มากเพียงใด",
      gate: {
        when: (d) => !d.living,
        text: "เซลล์ที่ตายแล้วไม่มีไซโทพลาซึม พลาสทิด และแวคิวโอล จึงสร้างแป้งและเก็บสารละลายไว้ไม่ได้",
        hint: "การสร้างและเก็บแป้งต้องอาศัยอะไมโลพลาสต์ในเซลล์ที่มีชีวิต",
      },
      factors: [
        {
          when: (d) => d.vacuole >= 0.6,
          effect: 1,
          text: "แวคิวโอลขนาดใหญ่เก็บน้ำและสารละลาย เช่น น้ำตาลและไอออน ได้มาก",
        },
        {
          when: (d) => d.vacuole < 0.35,
          effect: -1,
          text: "แวคิวโอลเล็ก พื้นที่เก็บน้ำและสารละลายจึงมีน้อย",
          hint: "ลองเพิ่มขนาดแวคิวโอล แล้วสังเกตพื้นที่ภายในเซลล์",
        },
        {
          when: (d) => d.primaryWall <= 0.35,
          effect: 1,
          text: "ผนังปฐมภูมิบาง เหลือพื้นที่ภายในเซลล์มาก และสารเคลื่อนเข้าออกเซลล์ได้สะดวก",
        },
        {
          when: (d) => d.primaryWall >= 0.65,
          effect: -1,
          text: "ผนังปฐมภูมิหนาเกินความจำเป็นสำหรับการเก็บสาร และกินพื้นที่ภายในเซลล์",
          hint: "ลองลดความหนาผนังปฐมภูมิ แล้วดูภาพตัดขวางว่าพื้นที่ภายในเปลี่ยนไปอย่างไร",
        },
        {
          when: (d) => hasSecondaryWall(d),
          effect: -1,
          text: "ผนังทุติยภูมิสร้างซ้อนเข้ามาด้านในผนังปฐมภูมิ ทำให้พื้นที่ภายในเซลล์ลดลง",
          hint: "เซลล์ที่ทำหน้าที่เก็บสารส่วนใหญ่มีเพียงผนังปฐมภูมิ",
        },
        {
          when: (d) => hasSecondaryWall(d) && d.lignified,
          effect: -1,
          text: "ลิกนินทำให้ผนังแข็งและน้ำซึมผ่านได้น้อย สารเคลื่อนเข้าออกเซลล์ได้ยากขึ้น",
          hint: "ลิกนินเหมาะกับเซลล์ที่ต้องการความแข็งแรง มากกว่าเซลล์ที่เก็บสาร",
        },
        {
          when: (d) => d.size >= 0.5,
          effect: 1,
          text: "เซลล์ขนาดใหญ่มีปริมาตรภายในมาก จึงเก็บสารได้มาก",
        },
        {
          when: (d) => d.size < 0.25,
          effect: -1,
          text: "เซลล์ขนาดเล็กมีปริมาตรภายในน้อย เก็บสารได้น้อย",
          hint: "ลองเพิ่มขนาดเซลล์",
        },
        {
          when: (d) => d.living && d.plastids === "amyloplast",
          effect: 0,
          text: "อะไมโลพลาสต์ในไซโทพลาซึมสร้างและเก็บแป้ง (เม็ดแป้ง) ไว้ภายในเซลล์",
        },
      ],
      thresholds: { high: 2, low: -1 },
    },
    {
      id: "gas",
      label: "การแพร่ของแก๊สในเนื้อเยื่อ",
      labelEn: "Gas diffusion",
      about: "O₂ และ CO₂ แพร่ไปถึงเซลล์ที่อยู่ลึกในเนื้อเยื่อได้ดีเพียงใด",
      factors: [
        {
          when: (d) => effectiveSpace(d) >= 0.45,
          effect: 2,
          text: "ช่องว่างระหว่างเซลล์มาก เชื่อมต่อกันเป็นทางให้แก๊สแพร่ถึงเซลล์ที่อยู่ลึกได้เร็ว",
        },
        {
          when: (d) => effectiveSpace(d) >= 0.2 && effectiveSpace(d) < 0.45,
          effect: 1,
          text: "มีช่องว่างระหว่างเซลล์พอให้แก๊สแพร่ผ่านเนื้อเยื่อได้",
        },
        {
          when: (d) => effectiveSpace(d) < 0.2,
          effect: -1,
          text: "เซลล์เรียงชิดแทบไม่มีช่องว่าง แก๊สต้องแพร่ผ่านเซลล์ทีละเซลล์ซึ่งช้ากว่าการแพร่ในอากาศมาก",
          hint: "ลองเพิ่มช่องว่างระหว่างเซลล์ แล้วดูภาพเนื้อเยื่อ (Tissue Preview)",
        },
        {
          when: (d) => d.shape === "rounded" && d.intercellularSpace < ROUNDED_MIN_SPACE,
          effect: 0,
          text: "เซลล์รูปร่างค่อนข้างกลมเรียงกันอย่างไรก็ยังเหลือช่องว่างตรงมุม",
        },
      ],
      thresholds: { high: 2, low: -1 },
    },
    {
      id: "activity",
      label: "กิจกรรมของเซลล์ที่มีชีวิต",
      labelEn: "Living activity",
      about: "สร้าง เปลี่ยนแปลง และนำสารที่เก็บไว้กลับมาใช้ได้หรือไม่",
      gate: {
        when: (d) => !d.living,
        text: "เซลล์ที่ตายแล้วไม่มีโพรโทพลาสต์ จึงไม่มีเมแทบอลิซึม เปลี่ยนแป้งกลับเป็นน้ำตาลไม่ได้",
        hint: "ลองเปลี่ยนสภาพเมื่อเจริญเต็มที่เป็น “มีชีวิต”",
      },
      factors: [
        {
          when: (d) => d.living,
          effect: 1,
          text: "เซลล์มีนิวเคลียส ไซโทพลาซึม และออร์แกเนลล์ จึงสร้าง สะสม และสลายแป้งเพื่อนำไปใช้ได้",
        },
        {
          when: (d) => d.living && d.primaryWall <= 0.5 && !hasSecondaryWall(d),
          effect: 1,
          text: "ผนังปฐมภูมิบางและไม่มีผนังทุติยภูมิ เซลล์จึงยังกลับมาแบ่งเซลล์ได้ เช่น เมื่อเกิดบาดแผล",
        },
        {
          when: (d) => hasSecondaryWall(d) && d.lignified,
          effect: -1,
          text: "ผนังที่สะสมลิกนินทำให้แลกเปลี่ยนสารกับเซลล์ข้างเคียงได้น้อยลง",
          hint: "เซลล์ที่ยังต้องแลกเปลี่ยนสารบ่อยมักไม่มีลิกนินในผนัง",
        },
      ],
      thresholds: { high: 2, low: 0 },
    },
    {
      id: "support",
      label: "การค้ำจุนโครงสร้าง",
      labelEn: "Structural support",
      about: "ความแข็งแรงของผนังเซลล์ (ข้อมูลเปรียบเทียบ ไม่ใช่เป้าหมายของภารกิจนี้)",
      tradeOff: true,
      factors: [
        {
          when: (d) => hasSecondaryWall(d),
          effect: 1,
          text: "ผนังทุติยภูมิเพิ่มความแข็งแรงให้ผนังเซลล์",
        },
        {
          when: (d) => hasSecondaryWall(d) && d.lignified,
          effect: 1,
          text: "ลิกนินทำให้ผนังแข็ง ทนแรงกดได้ดี",
        },
        {
          when: (d) => d.primaryWall >= 0.65,
          effect: 1,
          text: "ผนังปฐมภูมิหนาช่วยให้เซลล์คงรูปได้ดีขึ้น",
        },
        {
          when: (d) => d.primaryWall < 0.35 && !hasSecondaryWall(d),
          effect: -1,
          text: "ผนังบาง เซลล์จึงคงรูปได้ไม่ดีเมื่อขาดน้ำ",
        },
        {
          when: (d) => d.living && d.vacuole >= 0.6 && !hasSecondaryWall(d),
          effect: 0,
          text: "เมื่อแวคิวโอลมีน้ำเต็ม เซลล์เต่ง (turgor) ช่วยพยุงอวัยวะอ่อนได้บ้าง แต่จะเหี่ยวเมื่อขาดน้ำ",
        },
      ],
      thresholds: { high: 2, low: -1 },
    },
  ],
  goals: [
    {
      id: "store",
      check: (m) => m.storage.level === "high",
      pass: "เซลล์มีพื้นที่ภายในมากพอเก็บน้ำ แป้ง และสารละลาย",
      fail: "พื้นที่เก็บสารยังไม่พอ ลองพิจารณาขนาดเซลล์ ขนาดแวคิวโอล และความหนาของผนัง",
    },
    {
      id: "alive",
      check: (m, d) => d.living && m.activity.level !== "low",
      pass: "เซลล์ยังมีชีวิต จึงสร้างแป้งและนำแป้งกลับมาใช้ได้เมื่อพืชต้องการ",
      fail: "เซลล์ต้องมีชีวิตจึงจะสร้างแป้งและเปลี่ยนแป้งกลับเป็นน้ำตาลได้",
    },
    {
      id: "oxygen",
      check: (m) => m.gas.level !== "low",
      pass: "มีช่องว่างระหว่างเซลล์ให้ O₂ แพร่ถึงเซลล์ด้านในเพื่อใช้ในการหายใจระดับเซลล์",
      fail: "เซลล์ด้านในอาจขาด O₂ เพราะเซลล์เรียงชิดเกินไป ลองเพิ่มช่องว่างระหว่างเซลล์",
    },
  ],
};
