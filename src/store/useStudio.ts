"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { CellDesign } from "@/simulation/design";
import { getMission } from "@/content/missions";

/**
 * Everything the app remembers between visits, kept in localStorage
 * (no login, no backend in this version).
 *
 * Only designs are stored, never computed results: the results page re-runs
 * the current rules on the saved design, so edited rules apply to old attempts.
 */

export interface Attempt {
  id: string;
  missionId: string;
  design: CellDesign;
  at: number;
  fit: "good" | "partial" | "poor";
}

export interface QuizRecord {
  correct: number;
  total: number;
  at: number;
}

interface StudioState {
  /** Hide tissue names until a mission is finished */
  discoveryMode: boolean;
  /** Working design per mission */
  designs: Record<string, CellDesign>;
  /** "Before" snapshot per mission for the before/after comparison */
  before: Record<string, CellDesign>;
  attempts: Attempt[];
  /** Missions whose design met every goal */
  completed: Record<string, number>;
  /** Missions where the student chose to reveal the answer without completing */
  revealed: Record<string, number>;
  quizzes: Record<string, QuizRecord>;

  setDiscoveryMode: (on: boolean) => void;
  ensureDesign: (missionId: string) => void;
  updateDesign: (missionId: string, patch: Partial<CellDesign>) => void;
  resetDesign: (missionId: string) => void;
  setBefore: (missionId: string) => void;
  recordAttempt: (attempt: Attempt) => void;
  reveal: (missionId: string) => void;
  recordQuiz: (missionId: string, record: QuizRecord) => void;
  clearProgress: () => void;
}

function startDesign(missionId: string): CellDesign | undefined {
  const m = getMission(missionId);
  return m ? { ...m.startDesign } : undefined;
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => ({
      discoveryMode: true,
      designs: {},
      before: {},
      attempts: [],
      completed: {},
      revealed: {},
      quizzes: {},

      setDiscoveryMode: (on) => set({ discoveryMode: on }),

      ensureDesign: (missionId) => {
        if (get().designs[missionId]) return;
        const d = startDesign(missionId);
        if (!d) return;
        set((s) => ({ designs: { ...s.designs, [missionId]: d }, before: { ...s.before, [missionId]: { ...d } } }));
      },

      updateDesign: (missionId, patch) =>
        set((s) => {
          const cur = s.designs[missionId] ?? startDesign(missionId);
          if (!cur) return s;
          return { designs: { ...s.designs, [missionId]: { ...cur, ...patch } } };
        }),

      resetDesign: (missionId) => {
        const d = startDesign(missionId);
        if (!d) return;
        set((s) => ({ designs: { ...s.designs, [missionId]: d }, before: { ...s.before, [missionId]: { ...d } } }));
      },

      setBefore: (missionId) => {
        const cur = get().designs[missionId];
        if (cur) set((s) => ({ before: { ...s.before, [missionId]: { ...cur } } }));
      },

      recordAttempt: (attempt) =>
        set((s) => ({
          attempts: [...s.attempts, attempt].slice(-100),
          completed:
            attempt.fit === "good" && !s.completed[attempt.missionId]
              ? { ...s.completed, [attempt.missionId]: attempt.at }
              : s.completed,
        })),

      reveal: (missionId) => set((s) => ({ revealed: { ...s.revealed, [missionId]: Date.now() } })),

      recordQuiz: (missionId, record) => set((s) => ({ quizzes: { ...s.quizzes, [missionId]: record } })),

      clearProgress: () => set({ designs: {}, before: {}, attempts: [], completed: {}, revealed: {}, quizzes: {} }),
    }),
    {
      name: "cell-design-studio",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Rehydrated after mount (see <StoreHydrator />) so server and first client render match.
      skipHydration: true,
      partialize: (s) => ({
        discoveryMode: s.discoveryMode,
        designs: s.designs,
        before: s.before,
        attempts: s.attempts,
        completed: s.completed,
        revealed: s.revealed,
        quizzes: s.quizzes,
      }),
    },
  ),
);

/** Tissue name may be shown for this mission */
export function isNameVisible(s: Pick<StudioState, "discoveryMode" | "completed" | "revealed">, missionId: string): boolean {
  return !s.discoveryMode || !!s.completed[missionId] || !!s.revealed[missionId];
}

export function latestAttempt(attempts: Attempt[], missionId: string): Attempt | undefined {
  for (let i = attempts.length - 1; i >= 0; i--) if (attempts[i].missionId === missionId) return attempts[i];
  return undefined;
}
