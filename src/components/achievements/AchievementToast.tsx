"use client";

/**
 * Achievement toasts + passive tracker.
 *
 * Renders unlock notifications from the achievement store's queue, and tracks
 * a couple of achievements that depend on live store state (4 windows open;
 * triggering a storm) by subscribing to the relevant stores.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAchievementStore } from "@/store/achievement-store";
import { useWindowStore } from "@/store/window-store";
import { useEnvironmentStore } from "@/store/environment-store";

export function AchievementToast() {
  const toastQueue = useAchievementStore((s) => s.toastQueue);
  const dismissToast = useAchievementStore((s) => s.dismissToast);
  const unlock = useAchievementStore((s) => s.unlock);

  const windowCount = useWindowStore((s) => s.windows.length);
  const weather = useEnvironmentStore((s) => s.weather.condition);

  // Multitasker: 4+ windows open at once.
  useEffect(() => {
    if (windowCount >= 4) unlock("multitasker");
  }, [windowCount, unlock]);

  // Storm chaser: weather set to storm.
  useEffect(() => {
    if (weather === "storm") unlock("meteorologist");
  }, [weather, unlock]);

  // Auto-dismiss each toast after a few seconds.
  useEffect(() => {
    if (toastQueue.length === 0) return;
    const timers = toastQueue.map((a) =>
      setTimeout(() => dismissToast(a.id), 5000),
    );
    return () => timers.forEach(clearTimeout);
  }, [toastQueue, dismissToast]);

  return (
    <div className="pointer-events-none fixed right-5 top-12 z-[3500] flex flex-col gap-2">
      <AnimatePresence>
        {toastQueue.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            onClick={() => dismissToast(a.id)}
            className="glass glass-sheen pointer-events-auto flex w-72 cursor-pointer items-center gap-3 rounded-2xl p-3 text-white shadow-window"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-xl shadow-inner">
              {a.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-300">
                Achievement Unlocked
              </p>
              <p className="truncate text-sm font-semibold">{a.title}</p>
              <p className="truncate text-xs text-white/60">{a.description}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
