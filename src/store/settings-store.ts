/**
 * Settings store — reactive, persisted OS preferences (Architecture.md §4.3).
 *
 * Persisted to localStorage (small, synchronous config). Emits
 * `settings:changed` so theming/shell can react. Theme application to the DOM
 * is handled by a subscriber in the ThemeProvider component.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SystemSettings, ThemeMode } from "@/types";
import { eventBus } from "@/core/event-bus";
import {
  DEFAULT_ACCENT,
  DEFAULT_WALLPAPER_ID,
} from "@/core/constants";

interface SettingsState extends SystemSettings {
  setTheme: (theme: ThemeMode) => void;
  setAccent: (accent: string) => void;
  setWallpaper: (wallpaperId: string) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      accent: DEFAULT_ACCENT,
      wallpaperId: DEFAULT_WALLPAPER_ID,
      reducedMotion: false,

      setTheme: (theme) => {
        set({ theme });
        eventBus.emit("settings:changed", { key: "theme" });
      },
      setAccent: (accent) => {
        set({ accent });
        eventBus.emit("settings:changed", { key: "accent" });
      },
      setWallpaper: (wallpaperId) => {
        set({ wallpaperId });
        eventBus.emit("settings:changed", { key: "wallpaperId" });
      },
      setReducedMotion: (reducedMotion) => {
        set({ reducedMotion });
        eventBus.emit("settings:changed", { key: "reducedMotion" });
      },
    }),
    {
      name: "nexus.settings",
      version: 1,
    },
  ),
);
