"use client";

import { getMission } from "@/content/missions";
import { getTissue } from "@/content/tissues";
import { TissueSection } from "@/tissue/TissueSection";
import { SceneArt } from "./SceneArt";

/** Card picture for a tissue: its modelled section if written, else the plant situation. */
export function TissueThumb({ tissueId }: { tissueId: string }) {
  const tissue = getTissue(tissueId);
  if (tissue?.reference) {
    return <TissueSection design={tissue.reference} view="cross" width={240} height={160} simple showScale={false} className="h-full w-full" />;
  }
  const mission = tissue?.missionId ? getMission(tissue.missionId) : undefined;
  return mission ? <SceneArt scene={mission.scene} className="h-full w-full" /> : null;
}
