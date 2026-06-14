"use client";

/**
 * Desktop icons — shortcuts for every installed app, pinned top-left like a
 * classic OS. Single click selects; double-click (or Enter) launches. Icons
 * flow into vertical columns so all apps fit without clutter.
 *
 * Because shortcuts are generated from the App Registry, every app gets one for
 * free — satisfying "every app must support desktop shortcuts".
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { APP_REGISTRY } from "@/core/app-registry";
import { launchApp } from "@/core/launcher";
import { useAiStore } from "@/store/ai-store";
import { useSettingsStore } from "@/store/settings-store";
import { TOPBAR_HEIGHT } from "@/core/constants";

export function DesktopIcons() {
  const [selected, setSelected] = useState<string | null>(null);
  const openPalette = useAiStore((s) => s.openPalette);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const launch = (appId: string) => {
    if (appId === "ai") {
      openPalette();
      return;
    }
    launchApp(appId);
  };

  return (
    <div
      className="pointer-events-none absolute left-3 z-[2] flex flex-col flex-wrap content-start gap-1"
      style={{ top: TOPBAR_HEIGHT + 8, height: `calc(100% - ${TOPBAR_HEIGHT + 110}px)` }}
      onClick={() => setSelected(null)}
    >
      {APP_REGISTRY.map((app, i) => (
        <motion.button
          key={app.id}
          type="button"
          initial={reducedMotion ? false : { opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.02, 0.4) }}
          onClick={(e) => {
            e.stopPropagation();
            setSelected(app.id);
          }}
          onDoubleClick={() => launch(app.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") launch(app.id);
          }}
          aria-label={`${app.name} shortcut`}
          className={`pointer-events-auto flex w-20 flex-col items-center gap-1 rounded-lg px-1 py-2 text-center transition ${
            selected === app.id ? "bg-white/20 ring-1 ring-white/30" : "hover:bg-white/10"
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-2xl shadow-sm ring-1 ring-white/15 backdrop-blur-sm">
            {app.icon}
          </span>
          <span className="line-clamp-2 text-[11px] leading-tight text-white/90 drop-shadow">
            {app.name}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
