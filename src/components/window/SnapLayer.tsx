"use client";

/**
 * SnapLayer — the visual layer for window snapping.
 *
 *  - While a window is dragged near an edge/corner, a translucent "ghost" shows
 *    exactly where it will snap (driven by the store's `dragPreview`).
 *  - After a window snaps to a half, Snap Assist fills the empty half with
 *    pickable thumbnails of the other open windows — click one to tile it.
 *
 * Rendered above windows but below the global overlays.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useWindowStore } from "@/store/window-store";
import { useSettingsStore } from "@/store/settings-store";
import { getApp } from "@/core/app-registry";
import { snapTargetRect } from "@/core/snap";

export function SnapLayer() {
  const dragPreview = useWindowStore((s) => s.dragPreview);
  const snapAssist = useWindowStore((s) => s.snapAssist);
  const windows = useWindowStore((s) => s.windows);
  const snapWindow = useWindowStore((s) => s.snapWindow);
  const clearSnapAssist = useWindowStore((s) => s.clearSnapAssist);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  // Dismiss snap-assist on Esc, and auto-dismiss after a few seconds so it
  // never lingers. (It also clears when another window is interacted with.)
  useEffect(() => {
    if (!snapAssist) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSnapAssist();
    };
    window.addEventListener("keydown", onKey);
    const timer = setTimeout(clearSnapAssist, 6000);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [snapAssist, clearSnapAssist]);

  // Candidate windows for snap-assist: open, not minimized, not the source.
  const candidates = snapAssist
    ? windows.filter(
        (w) =>
          w.id !== snapAssist.sourceId &&
          !w.flags.minimized &&
          w.snapZone !== snapAssist.fillZone,
      )
    : [];

  const previewRect = dragPreview ? snapTargetRect(dragPreview) : null;
  const assistRect = snapAssist ? snapTargetRect(snapAssist.fillZone) : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[1500]">
      {/* Live drag preview ghost */}
      <AnimatePresence>
        {previewRect && (
          <motion.div
            key={dragPreview}
            initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="absolute rounded-2xl border-2 border-accent/80 bg-accent/20 backdrop-blur-sm"
            style={{
              left: previewRect.x + 8,
              top: previewRect.y + 8,
              width: previewRect.width - 16,
              height: previewRect.height - 16,
              boxShadow: "0 0 40px -4px rgb(var(--color-accent) / 0.6)",
            }}
          >
            <div className="flex h-full items-center justify-center">
              <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                Snap here
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Snap Assist picker — fills the empty half; no blocking backdrop, so
          the rest of the desktop stays interactive (clicking a window or
          pressing Esc dismisses it). */}
      <AnimatePresence>
        {snapAssist && assistRect && candidates.length > 0 && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute flex flex-col rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl"
            style={{
              left: assistRect.x + 12,
              top: assistRect.y + 12,
              width: assistRect.width - 24,
              height: assistRect.height - 24,
            }}
          >
              <div className="mb-3 flex items-center justify-between text-white">
                <span className="text-sm font-medium">Fill this side with…</span>
                <button
                  type="button"
                  onClick={clearSnapAssist}
                  aria-label="Dismiss snap assist"
                  className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70 hover:bg-white/20"
                >
                  ✕
                </button>
              </div>
              <div className="nexus-scroll grid grid-cols-2 gap-2 overflow-auto sm:grid-cols-3">
                {candidates.map((w) => {
                  const app = getApp(w.appId);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      aria-label={`Snap ${w.title} here`}
                      onClick={() => {
                        snapWindow(w.id, snapAssist.fillZone);
                        clearSnapAssist();
                      }}
                      className="group flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 p-2 text-white transition hover:border-accent/60 hover:bg-white/10"
                    >
                      <span className="text-2xl transition group-hover:scale-110">
                        {app?.icon ?? "🪟"}
                      </span>
                      <span className="line-clamp-1 text-xs text-white/80">{w.title}</span>
                    </button>
                  );
                })}
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
