"use client";

/**
 * TopBar — the system tray / menu bar (DE-5).
 *
 * Phase 1 shows the OS name, a live clock, the signed-in user, and a logout
 * control. Wallpaper switching is exposed here too so the wallpaper system is
 * demonstrably interactive before the Settings app exists.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSystemStore } from "@/store/system-store";
import { useSettingsStore } from "@/store/settings-store";
import { WALLPAPERS } from "@/core/constants";
import { useAiStore } from "@/store/ai-store";
import { useShellUiStore } from "@/store/shell-ui-store";
import { useAchievementStore } from "@/store/achievement-store";

export function TopBar() {
  const user = useSystemStore((s) => s.user);
  const logout = useSystemStore((s) => s.logout);
  const wallpaperId = useSettingsStore((s) => s.wallpaperId);
  const setWallpaper = useSettingsStore((s) => s.setWallpaper);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const openPalette = useAiStore((s) => s.openPalette);
  const setDevMode = useShellUiStore((s) => s.setDevMode);
  const openWorkspaceBuilder = useShellUiStore((s) => s.openWorkspaceBuilder);

  // Secret: click the wordmark 5× quickly to unlock Developer Mode.
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleWordmarkClick = () => {
    clickCount.current += 1;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => (clickCount.current = 0), 1200);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      setDevMode(true);
      useAchievementStore.getState().unlock("developer");
    }
  };

  return (
    <header className="glass absolute inset-x-0 top-0 z-[1000] flex h-8 items-center justify-between border-x-0 border-t-0 border-b border-white/10 px-4 text-xs text-white">
      <div className="flex items-center gap-2.5 font-medium">
        <button
          type="button"
          onClick={handleWordmarkClick}
          className="cursor-default tracking-[0.25em] text-white/90 focus:outline-none"
          aria-label="NEXUS"
        >
          NEXUS
        </button>
        <motion.button
          type="button"
          onClick={openPalette}
          title="AI Command Center (Ctrl+Space)"
          aria-label="Open AI Command Center"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 ring-1 ring-white/20 transition hover:bg-white/20"
        >
          <span className="text-accent">✦</span>
          <span className="hidden text-white/80 sm:inline">Ask NEXUS</span>
          <kbd className="hidden rounded bg-white/10 px-1 text-[9px] text-white/50 sm:inline">
            ⌃␣
          </kbd>
        </motion.button>
        <motion.button
          type="button"
          onClick={openWorkspaceBuilder}
          title="AI Workspace Builder (Ctrl+Shift+W)"
          aria-label="Open Workspace Builder"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 ring-1 ring-white/20 transition hover:bg-white/20"
        >
          <span>🗂️</span>
          <span className="hidden text-white/80 md:inline">Workspaces</span>
        </motion.button>
      </div>

      <div className="flex items-center gap-3">
        {/* Wallpaper quick-switcher — proves the wallpaper system is live. */}
        <div className="flex items-center gap-1.5">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              type="button"
              aria-label={`Wallpaper: ${wp.name}`}
              title={wp.name}
              onClick={() => setWallpaper(wp.id)}
              className={`h-3.5 w-3.5 rounded-full ring-1 transition ${
                wallpaperId === wp.id
                  ? "ring-2 ring-white"
                  : "ring-white/40 hover:ring-white/80"
              }`}
              style={{ background: wp.css }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded px-2 py-0.5 text-white/80 ring-1 ring-white/20 transition hover:bg-white/15"
        >
          {theme === "dark" ? "☾" : "☀"}
        </button>

        <Clock />

        {user && (
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded px-2 py-0.5 ring-1 ring-white/20 transition hover:bg-white/15"
          >
            <span>{user.avatar}</span>
            <span className="hidden sm:inline">{user.displayName}</span>
            <span className="text-white/50">⏏</span>
          </button>
        )}
      </div>
    </header>
  );
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <span className="w-32" aria-hidden />;

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <span className="tabular-nums text-white/90">
      {date} · {time}
    </span>
  );
}
