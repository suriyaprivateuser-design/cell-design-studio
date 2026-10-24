"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { useStudio } from "./useStudio";

export const useHydrated = create<{ hydrated: boolean }>(() => ({ hydrated: false }));

/** Loads saved progress from localStorage once the app has mounted. */
export function StoreHydrator() {
  useEffect(() => {
    const done = () => useHydrated.setState({ hydrated: true });
    const unsub = useStudio.persist.onFinishHydration(done);
    Promise.resolve(useStudio.persist.rehydrate()).finally(done);
    return unsub;
  }, []);
  return null;
}
