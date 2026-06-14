"use client";

/**
 * WindowManager — the shell's window layer (Architecture.md §3, §4.2).
 *
 * Renders every window from the window store, ordered by z-index so the
 * focused/topmost window paints last. Holds no geometry logic of its own — it
 * is a pure reactive view over the store.
 */

import { useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/store/window-store";
import { Window } from "./Window";

export function WindowManager() {
  // Select the raw array (stable reference) and sort in a memo. Sorting inside
  // the Zustand selector would return a new array each render and trip
  // useSyncExternalStore's "getSnapshot should be cached" infinite-loop guard.
  const windowList = useWindowStore((s) => s.windows);
  const windows = useMemo(
    () => [...windowList].sort((a, b) => a.zIndex - b.zIndex),
    [windowList],
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} win={win} />
        ))}
      </AnimatePresence>
    </div>
  );
}
