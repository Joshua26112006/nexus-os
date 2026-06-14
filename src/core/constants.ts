/** OS-wide constants and configuration defaults. */

import type { Wallpaper, WindowConstraints } from "@/types";

/** Base z-index windows stack from. Shell chrome (dock) sits above this band. */
export const WINDOW_BASE_Z = 100;

/** Height reserved at the bottom for the dock (px). */
export const DOCK_HEIGHT = 88;

/** Height of the top system bar / menu bar (px). Matches TopBar's `h-8`. */
export const TOPBAR_HEIGHT = 32;

/** Height of a window title bar (px). */
export const TITLEBAR_HEIGHT = 40;

/** Pixels from each edge that trigger window snapping during a drag. */
export const SNAP_THRESHOLD = 12;

/** Default window constraints when an app doesn't specify its own. */
export const DEFAULT_WINDOW_CONSTRAINTS: WindowConstraints = {
  minWidth: 320,
  minHeight: 200,
  resizable: true,
};

/** Default size for newly opened windows. */
export const DEFAULT_WINDOW_SIZE = { width: 720, height: 480 };

/** Offset applied to each successive new window so they cascade. */
export const WINDOW_CASCADE_OFFSET = 28;

/**
 * Built-in wallpapers (procedural gradients — no external assets, so they
 * work fully offline, per the local-first principle in PRD §6).
 */
export const WALLPAPERS: Wallpaper[] = [
  {
    id: "aurora",
    name: "Aurora",
    css: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #6d28d9 100%)",
  },
  {
    id: "nebula",
    name: "Nebula",
    css: "radial-gradient(circle at 30% 20%, #4c1d95 0%, #0f172a 55%), radial-gradient(circle at 80% 80%, #be185d 0%, transparent 60%)",
  },
  {
    id: "horizon",
    name: "Horizon",
    css: "linear-gradient(180deg, #020617 0%, #0c4a6e 60%, #0891b2 100%)",
  },
  {
    id: "ember",
    name: "Ember",
    css: "linear-gradient(135deg, #1c1917 0%, #7c2d12 55%, #ea580c 100%)",
  },
  {
    id: "slate",
    name: "Slate",
    css: "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
  },
  {
    id: "synthwave",
    name: "Synthwave",
    css: "linear-gradient(180deg, #2b0b3f 0%, #5b1d6e 40%, #d6336c 75%, #ff9e64 100%)",
  },
  {
    id: "abyss",
    name: "Abyss",
    css: "radial-gradient(circle at 50% 120%, #155e75 0%, #0c4a6e 30%, #020617 70%)",
  },
];

export const DEFAULT_WALLPAPER_ID = "aurora";
export const DEFAULT_ACCENT = "#6366f1";
