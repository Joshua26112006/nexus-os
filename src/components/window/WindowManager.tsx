"use client";

/**
 * WindowManager — the shell's window layer (Architecture.md §3, §4.2).
 *
 * Renders every window from the window store, ordered by z-index so the
 * focused/topmost window paints last. Holds no geometry logic of its own — it
 * is a pure reactive view over the store.
 */

import { useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useWindowStore } from "@/store/window-store";
import { Window } from "./Window";
import { SnapLayer } from "./SnapLayer";

export function WindowManager() {
  // Select the raw array (stable reference) and sort in a memo. Sorting inside
  // the Zustand selector would return a new array each render and trip
  // useSyncExternalStore's "getSnapshot should be cached" infinite-loop guard.
  const windowList = useWindowStore((s) => s.windows);
  const windows = useMemo(
    () => [...windowList].sort((a, b) => a.zIndex - b.zIndex),
    [windowList],
  );

  // Keyboard window management: Ctrl+Alt+Arrows snap the focused window
  // (← left, → right, ↑ maximize, ↓ restore/minimize).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey || !e.altKey) return;
      const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
      if (!keys.includes(e.key)) return;
      const st = useWindowStore.getState();
      const focused = st.windows.find((w) => w.focused && !w.flags.minimized);
      if (!focused) return;
      e.preventDefault();
      if (e.key === "ArrowLeft") st.snapWindow(focused.id, "left");
      else if (e.key === "ArrowRight") st.snapWindow(focused.id, "right");
      else if (e.key === "ArrowUp") st.snapWindow(focused.id, "maximize");
      else if (e.key === "ArrowDown") {
        if (focused.snapZone || focused.flags.maximized) st.restoreFloating(focused.id);
        else st.minimizeWindow(focused.id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} win={win} />
        ))}
      </AnimatePresence>
      <SnapLayer />
    </div>
  );
}
