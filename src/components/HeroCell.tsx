"use client";

import { CellViewer } from "./CellViewer";
import { CHLORENCHYMA_REFERENCE } from "@/content/tissues";

/** Large 3D block of plant tissue on the home page. */
export function HeroCell() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-sage-50 shadow-lift md:aspect-[1.05]">
      <CellViewer
        design={CHLORENCHYMA_REFERENCE}
        view="tissue"
        showLabels={false}
        showLayers
        sway
        interactive={false}
        distanceScale={1.1}
        bare
        className="h-full w-full"
      />
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs text-muted shadow-soft">
        แบบจำลองเนื้อเยื่อพืช 3 มิติ
      </p>
    </div>
  );
}
