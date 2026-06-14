"use client";

/**
 * Desktop — the shell composition (Architecture.md Layer 3).
 *
 * Layers, bottom to top: wallpaper → particles → widgets → window manager →
 * chrome (top bar, dock) → companion → global overlays (palette, shortcuts,
 * achievements, easter eggs, dev HUD). Holds no app logic; each surface is a
 * reactive consumer of the stores.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Wallpaper } from "./Wallpaper";
import { ParticleField } from "./ParticleField";
import { DesktopIcons } from "./DesktopIcons";
import { TopBar } from "./TopBar";
import { Dock } from "./Dock";
import { WindowManager } from "@/components/window/WindowManager";
import { WidgetLayer } from "@/components/widgets/WidgetLayer";
import { CommandCenter } from "@/components/ai/CommandCenter";
import { AICompanion } from "@/components/ai/AICompanion";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ShortcutOverlay } from "@/components/shell/ShortcutOverlay";
import { WorkspaceBuilder } from "@/components/workspaces/WorkspaceBuilder";
import { EasterEggs } from "@/components/shell/EasterEggs";
import { DevModeOverlay } from "@/components/shell/DevModeOverlay";
import { AchievementToast } from "@/components/achievements/AchievementToast";
import { registerSystemCommands } from "@/services/commands/system-commands";
import { initAchievements } from "@/store/achievement-store";
import { useEnvironmentStore } from "@/store/environment-store";
import { useWindowStore } from "@/store/window-store";
import { useSettingsStore } from "@/store/settings-store";

export function Desktop() {
  const tickFromClock = useEnvironmentStore((s) => s.tickFromClock);

  // Register OS commands and achievement tracking, and restore the previous
  // session (open windows + layout) — all once when the desktop mounts.
  useEffect(() => {
    registerSystemCommands();
    initAchievements();
    const win = useWindowStore.getState();
    if (useSettingsStore.getState().restoreWindows) {
      win.restoreSession();
    } else {
      win.clearSession();
    }
  }, []);

  // Advance the day/night cycle from the real clock every minute.
  useEffect(() => {
    tickFromClock();
    const t = setInterval(tickFromClock, 60_000);
    return () => clearInterval(t);
  }, [tickFromClock]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative h-full w-full overflow-hidden"
    >
      <Wallpaper />
      <ParticleField />
      <DesktopIcons />
      <WidgetLayer />
      <WindowManager />
      <TopBar />
      <Dock />
      <AICompanion />

      {/* Global overlays */}
      <CommandCenter />
      <CommandPalette />
      <ShortcutOverlay />
      <WorkspaceBuilder />
      <AchievementToast />
      <EasterEggs />
      <DevModeOverlay />
    </motion.div>
  );
}
