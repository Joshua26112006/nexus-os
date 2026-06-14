"use client";

/**
 * Hidden Developer Mode overlay.
 *
 * Unlocked by clicking the NEXUS wordmark 5× (see TopBar) or via the
 * "system.devmode" command. When active, shows a live diagnostics HUD: FPS,
 * frame time, open-window count, and current environment state — the kind of
 * thing that makes power users grin.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useShellUiStore } from "@/store/shell-ui-store";
import { useWindowStore } from "@/store/window-store";
import { useEnvironmentStore, timeOfDayFromSun } from "@/store/environment-store";

export function DevModeOverlay() {
  const devMode = useShellUiStore((s) => s.devMode);
  const toggleDevMode = useShellUiStore((s) => s.toggleDevMode);
  const windowCount = useWindowStore((s) => s.windows.length);
  const sunPosition = useEnvironmentStore((s) => s.sunPosition);
  const weather = useEnvironmentStore((s) => s.weather.condition);

  const [fps, setFps] = useState(60);
  const frameTime = useRef(16.7);

  // Lightweight FPS meter via rAF.
  useEffect(() => {
    if (!devMode) return;
    let raf = 0;
    let last = performance.now();
    let frames = 0;
    let acc = 0;
    const loop = (now: number) => {
      const dt = now - last;
      last = now;
      frameTime.current = dt;
      frames++;
      acc += dt;
      if (acc >= 500) {
        setFps(Math.round((frames * 1000) / acc));
        frames = 0;
        acc = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [devMode]);

  if (!devMode) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass fixed bottom-28 left-5 z-[3200] w-56 rounded-xl p-3 font-mono text-[11px] text-emerald-300 shadow-dock"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-emerald-400">◉ DEV MODE</span>
        <button
          type="button"
          onClick={toggleDevMode}
          className="rounded bg-white/10 px-1.5 text-white/60 hover:bg-white/20"
        >
          ✕
        </button>
      </div>
      <Row label="FPS" value={`${fps}`} warn={fps < 45} />
      <Row label="Frame" value={`${frameTime.current.toFixed(1)}ms`} />
      <Row label="Windows" value={`${windowCount}`} />
      <Row label="Sun" value={`${(sunPosition * 24).toFixed(1)}h (${timeOfDayFromSun(sunPosition)})`} />
      <Row label="Weather" value={weather} />
      <Row label="Build" value="NEXUS 0.5.0" />
    </motion.div>
  );
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className={warn ? "text-rose-400" : "text-emerald-300"}>{value}</span>
    </div>
  );
}
