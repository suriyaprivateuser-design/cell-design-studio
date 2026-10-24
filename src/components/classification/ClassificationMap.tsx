"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { BY_CELL_TYPES, BY_TISSUE_SYSTEM, MERISTEM_TREE, type ClassNode } from "@/content/classification";
import { Card, cx } from "../ui";

const ROOT: ClassNode = {
  id: "root",
  th: "เนื้อเยื่อพืช",
  en: "Plant tissue",
  info: "แบ่งตามความสามารถในการแบ่งเซลล์ได้ 2 กลุ่ม คือ เนื้อเยื่อเจริญ ซึ่งแบ่งเซลล์ได้ และเนื้อเยื่อถาวร ซึ่งเปลี่ยนแปลงไปทำหน้าที่เฉพาะและโดยทั่วไปไม่แบ่งเซลล์แล้ว",
};

const PERMANENT: ClassNode = {
  id: "permanent",
  th: "เนื้อเยื่อถาวร",
  en: "Permanent tissue",
  info: "เจริญมาจากเนื้อเยื่อเจริญ เซลล์เปลี่ยนแปลงไปทำหน้าที่เฉพาะ จำแนกได้หลายเกณฑ์ ในแผนผังนี้แสดง 2 เกณฑ์ซึ่งเป็นการจำแนกคนละแบบ",
};

export function ClassificationMap() {
  const [selected, setSelected] = useState<ClassNode>(ROOT);
  const select = (n: ClassNode) => setSelected(n);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-5">
        <div className="flex justify-center">
          <NodeButton node={ROOT} selected={selected} onSelect={select} size="lg" />
        </div>
        <div className="mx-auto h-5 w-px bg-sage-300" />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)]">
          {/* Meristematic */}
          <Card className="space-y-3 p-4">
            <NodeButton node={MERISTEM_TREE} selected={selected} onSelect={select} size="md" />
            <p className="text-xs text-muted">จำแนกตามตำแหน่งที่พบ</p>
            <Branch nodes={MERISTEM_TREE.children!} selected={selected} onSelect={select} />
          </Card>

          {/* Permanent */}
          <Card className="space-y-3 p-4">
            <NodeButton node={PERMANENT} selected={selected} onSelect={select} size="md" />
            <div className="flex gap-2 rounded-2xl bg-mid-soft/60 px-3 py-2 text-xs leading-relaxed text-ink">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-mid" />
              <span>
                เกณฑ์ที่ 1 และเกณฑ์ที่ 2 เป็นการจำแนก<strong>คนละแบบ</strong> เนื้อเยื่อชนิดเดียวกันจึงปรากฏได้ทั้งสองฝั่ง
                เช่น พาเรงคิมาเป็นทั้งเนื้อเยื่อถาวรเชิงเดี่ยว และอยู่ในระบบเนื้อเยื่อพื้น
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-2xl border border-line p-3">
                <p className="text-xs font-semibold text-sage-700">เกณฑ์ที่ 1 · ชนิดของเซลล์ที่เป็นองค์ประกอบ</p>
                <Branch nodes={BY_CELL_TYPES} selected={selected} onSelect={select} />
              </div>
              <div className="space-y-2 rounded-2xl border border-line p-3">
                <p className="text-xs font-semibold text-sage-700">เกณฑ์ที่ 2 · ระบบเนื้อเยื่อ (Tissue system)</p>
                <Branch nodes={BY_TISSUE_SYSTEM} selected={selected} onSelect={select} />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="lg:sticky lg:top-20 lg:self-start">
        <AnimatePresence mode="wait">
          <motion.div key={selected.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            <Card className="space-y-3 p-5">
              <p className="text-xs font-semibold text-sage-600">รายละเอียด</p>
              <p className="text-xl font-semibold text-ink">
                {selected.th}
                <span className="block text-sm font-normal text-muted">{selected.en}</span>
              </p>
              <p className="text-[14.5px] leading-relaxed text-ink">{selected.info}</p>
              {selected.note && (
                <p className="flex gap-2 rounded-2xl bg-mid-soft/60 px-3 py-2 text-xs text-ink">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-mid" />
                  {selected.note}
                </p>
              )}
              {selected.tissueId && (
                <Link href={`/library/${selected.tissueId}`} className="inline-flex items-center gap-1 text-sm font-medium text-sage-700 hover:text-sage-900">
                  เปิดในคลังเนื้อเยื่อ <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>
        <p className="mt-3 px-1 text-xs text-faint">กดที่กล่องในแผนผังเพื่อดูข้อมูลเพิ่มเติม</p>
      </div>
    </div>
  );
}

function Branch({ nodes, selected, onSelect }: { nodes: ClassNode[]; selected: ClassNode; onSelect: (n: ClassNode) => void }) {
  return (
    <ul className="space-y-2 border-l-2 border-sage-200 pl-3">
      {nodes.map((n) => (
        <li key={n.id} className="relative space-y-2">
          <span className="absolute top-4 -left-3 h-0.5 w-3 bg-sage-200" />
          <NodeButton node={n} selected={selected} onSelect={onSelect} size="sm" />
          {n.children && <Branch nodes={n.children} selected={selected} onSelect={onSelect} />}
        </li>
      ))}
    </ul>
  );
}

function NodeButton({ node, selected, onSelect, size }: { node: ClassNode; selected: ClassNode; onSelect: (n: ClassNode) => void; size: "sm" | "md" | "lg" }) {
  const active = selected.id === node.id;
  return (
    <button
      onClick={() => onSelect(node)}
      aria-pressed={active}
      className={cx(
        "rounded-2xl border text-left transition-colors",
        size === "lg" ? "px-6 py-3" : "w-full",
        size === "md" && "px-4 py-2.5",
        size === "sm" && "px-3 py-2",
        active ? "border-sage-500 bg-sage-600 text-white" : "border-line bg-white text-ink hover:border-sage-300 hover:bg-sage-50",
        node.note && !active && "border-dashed",
      )}
    >
      <span className={cx("block font-semibold", size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm")}>{node.th}</span>
      <span className={cx("block text-xs", active ? "text-white/80" : "text-faint")}>{node.en}</span>
    </button>
  );
}
