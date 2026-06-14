"use client";

/**
 * ThemeProvider — applies reactive settings to the DOM (Architecture.md §8.6).
 *
 * Subscribes to the settings store and reflects theme (light/dark/system) and
 * accent color onto <html> via the `.dark` class and the `--color-accent`
 * token. This is the one place that touches the document for theming.
 */

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settings-store";

/** Convert "#rrggbb" to the "r g b" channel string our tokens expect. */
function hexToRgbChannels(hex: string): string | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  const r = parseInt(match[1], 16);
  const g = parseInt(match[2], 16);
  const b = parseInt(match[3], 16);
  return `${r} ${g} ${b}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSettingsStore((s) => s.theme);
  const accent = useSettingsStore((s) => s.accent);

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const isDark = theme === "dark" || (theme === "system" && prefersDark);
      root.classList.toggle("dark", isDark);
    };

    apply();

    // When following the system, react to OS-level changes live.
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);

  useEffect(() => {
    const channels = hexToRgbChannels(accent);
    if (channels) {
      document.documentElement.style.setProperty("--color-accent", channels);
    }
  }, [accent]);

  return <>{children}</>;
}
