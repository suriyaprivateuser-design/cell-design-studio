import type { MissionRules } from "../rules";
import { mission01Rules } from "./mission01";

/** Simulation rules per mission id. Missions without rules have no studio yet. */
export const MISSION_RULES: Record<string, MissionRules> = {
  "1": mission01Rules,
};

export function getMissionRules(missionId: string): MissionRules | undefined {
  return MISSION_RULES[missionId];
}
