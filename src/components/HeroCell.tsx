"use client";

import { CellViewer } from "./CellViewer";
import { PARENCHYMA_REFERENCE } from "@/content/tissues";

/** Large cut-away plant cell on the home page. */
export function HeroCell() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-gradient-to-b from-white to-sage-50 shadow-lift md:aspect-[1.05]">
      <CellViewer
        design={PARENCHYMA_REFERENCE}
        view="long"
        showLabels={false}
        showLayers
        sway
        interactive={false}
        bare
        className="h-full w-full"
      />
      <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-xs text-muted shadow-soft">
        แบบจำลองเซลล์พืชผ่าครึ่งตามยาว
      </p>
    </div>
  );
}
