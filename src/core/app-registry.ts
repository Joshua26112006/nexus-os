/**
 * App Registry — enumerates installed app manifests (Architecture.md §6.1,
 * ProjectStructure.md §3.7 `registry.ts`).
 *
 * Phase 1 ships placeholder apps only: the dock launches them and the window
 * manager opens windows for them, but they render a "coming soon" body. Real
 * app implementations arrive in later phases without changing this seam.
 */

import type { AppManifest } from "@/types";
import { DEFAULT_WINDOW_CONSTRAINTS } from "@/core/constants";

const baseWindow = {
  defaultSize: { width: 760, height: 520 },
  constraints: DEFAULT_WINDOW_CONSTRAINTS,
};

export const APP_REGISTRY: AppManifest[] = [
  {
    id: "files",
    name: "Files",
    icon: "📁",
    singleton: false,
    window: baseWindow,
    capabilities: ["fs:read", "fs:write"],
  },
  {
    id: "browser",
    name: "Browser",
    icon: "🌐",
    singleton: false,
    window: { defaultSize: { width: 900, height: 600 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["network"],
  },
  {
    id: "notes",
    name: "Notes",
    icon: "📝",
    singleton: false,
    window: baseWindow,
    capabilities: ["fs:read", "fs:write", "ai"],
  },
  {
    id: "terminal",
    name: "Terminal",
    icon: "▶_",
    singleton: false,
    window: { defaultSize: { width: 680, height: 420 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["fs:read", "fs:write"],
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: "🧮",
    singleton: true,
    window: { defaultSize: { width: 320, height: 480 }, constraints: { minWidth: 280, minHeight: 420, resizable: false } },
    capabilities: [],
  },
  {
    id: "ai",
    name: "AI Center",
    icon: "✦",
    singleton: true,
    window: { defaultSize: { width: 480, height: 620 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["ai"],
  },
  {
    id: "settings",
    name: "Settings",
    icon: "⚙",
    singleton: true,
    window: baseWindow,
    capabilities: ["settings:write"],
  },
  {
    id: "marketplace",
    name: "Marketplace",
    icon: "🛍️",
    singleton: true,
    window: { defaultSize: { width: 880, height: 600 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["settings:write"],
  },

  // ---- Productivity ----
  {
    id: "whiteboard", name: "Whiteboard", icon: "🖌️", singleton: false,
    window: { defaultSize: { width: 940, height: 640 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "productivity",
  },
  {
    id: "kanban", name: "Kanban", icon: "📋", singleton: false,
    window: { defaultSize: { width: 920, height: 600 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "productivity",
  },
  {
    id: "calendar", name: "Calendar", icon: "📅", singleton: true,
    window: { defaultSize: { width: 860, height: 620 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "productivity",
  },
  {
    id: "writer", name: "AI Writing Studio", icon: "✍️", singleton: false,
    window: { defaultSize: { width: 900, height: 640 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["fs:read", "fs:write", "ai"], category: "productivity",
  },

  // ---- Developer tools ----
  {
    id: "code", name: "Code Editor", icon: "💻", singleton: false,
    window: { defaultSize: { width: 960, height: 660 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["fs:read", "fs:write"], category: "developer",
  },
  {
    id: "apitester", name: "API Tester", icon: "🛰️", singleton: false,
    window: { defaultSize: { width: 900, height: 640 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["network"], category: "developer",
  },
  {
    id: "json", name: "JSON Visualizer", icon: "🧬", singleton: false,
    window: { defaultSize: { width: 860, height: 620 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "developer",
  },
  {
    id: "database", name: "Database Explorer", icon: "🗄️", singleton: false,
    window: { defaultSize: { width: 940, height: 620 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "developer",
  },

  // ---- Media ----
  {
    id: "music", name: "Music Studio", icon: "🎵", singleton: true,
    window: { defaultSize: { width: 820, height: 600 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "media",
  },
  {
    id: "video", name: "Video Player", icon: "🎬", singleton: false,
    window: { defaultSize: { width: 880, height: 600 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "media",
  },
  {
    id: "imageeditor", name: "Image Editor", icon: "🎨", singleton: false,
    window: { defaultSize: { width: 920, height: 640 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "media",
  },
  {
    id: "gallery", name: "Gallery", icon: "🖼️", singleton: false,
    window: { defaultSize: { width: 880, height: 620 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "media",
  },

  // ---- AI apps ----
  {
    id: "chat", name: "AI Chat", icon: "💬", singleton: false,
    window: { defaultSize: { width: 560, height: 680 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["ai"], category: "ai",
  },
  {
    id: "promptbuilder", name: "Image Prompt Builder", icon: "🪄", singleton: false,
    window: { defaultSize: { width: 880, height: 620 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["ai"], category: "ai",
  },
  {
    id: "workflow", name: "AI Workflow Builder", icon: "🔗", singleton: false,
    window: { defaultSize: { width: 940, height: 640 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["ai"], category: "ai",
  },
  {
    id: "research", name: "AI Research", icon: "🔬", singleton: false,
    window: { defaultSize: { width: 940, height: 640 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: ["ai"], category: "ai",
  },

  // ---- Fun ----
  {
    id: "arcade", name: "Retro Arcade", icon: "🕹️", singleton: false,
    window: { defaultSize: { width: 720, height: 640 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "games",
  },
  {
    id: "snake", name: "Snake", icon: "🐍", singleton: false,
    window: { defaultSize: { width: 520, height: 600 }, constraints: { minWidth: 460, minHeight: 560, resizable: false } },
    capabilities: [], category: "games",
  },
  {
    id: "chess", name: "Chess", icon: "♟️", singleton: false,
    window: { defaultSize: { width: 600, height: 680 }, constraints: DEFAULT_WINDOW_CONSTRAINTS },
    capabilities: [], category: "games",
  },
  {
    id: "pet", name: "Virtual Pet", icon: "🐾", singleton: true,
    window: { defaultSize: { width: 460, height: 600 }, constraints: { minWidth: 420, minHeight: 540, resizable: false } },
    capabilities: [], category: "games",
  },
];

/** Look up an app manifest by id. */
export function getApp(appId: string): AppManifest | undefined {
  return APP_REGISTRY.find((a) => a.id === appId);
}

/**
 * Apps pinned to the dock. With 25+ apps installed, the dock shows a curated
 * subset; everything else is reachable via desktop icons, the launcher, the
 * Command Palette (Ctrl+K), and the AI. Order matters — it's the dock order.
 */
export const DOCK_PINNED_IDS = [
  "files",
  "browser",
  "notes",
  "writer",
  "code",
  "terminal",
  "kanban",
  "music",
  "gallery",
  "chat",
  "arcade",
  "ai",
  "settings",
];

/** The pinned app manifests, in dock order. */
export function dockApps(): AppManifest[] {
  return DOCK_PINNED_IDS.map((id) => getApp(id)).filter(
    (a): a is AppManifest => Boolean(a),
  );
}
