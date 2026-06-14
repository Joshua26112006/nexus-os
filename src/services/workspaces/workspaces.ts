/**
 * AI Workspace Builder — the signature feature.
 *
 * A workspace is a named bundle of apps + widgets + a window-tiling layout +
 * optional ambiance. Saying "create a frontend developer workspace" launches
 * the right apps and arranges them intelligently in one move.
 *
 * This module owns: the workspace catalogue, a natural-language matcher, the
 * tiling math, and the orchestration that opens everything and lays it out.
 */

import type { Rect } from "@/types";
import type { WidgetType } from "@/store/widget-store";
import { useWindowStore } from "@/store/window-store";
import { useWidgetStore } from "@/store/widget-store";
import { useSettingsStore } from "@/store/settings-store";
import { launchApp } from "@/core/launcher";
import { TOPBAR_HEIGHT, DOCK_HEIGHT } from "@/core/constants";

/** How the launched windows are tiled. */
export type LayoutKind = "main-left" | "main-right" | "columns" | "grid";

export interface Workspace {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** App ids to open, primary first (the primary gets the largest tile). */
  apps: string[];
  /** Desktop widgets to enable. */
  widgets?: WidgetType[];
  layout: LayoutKind;
  /** Optional ambiance applied on launch. */
  accent?: string;
  wallpaperId?: string;
  /** Keywords the NL matcher uses to resolve free-text descriptions. */
  keywords: string[];
}

export const WORKSPACES: Workspace[] = [
  {
    id: "frontend",
    name: "Frontend Developer",
    description: "Code editor, terminal, and notes — arranged for shipping UI.",
    icon: "💻",
    apps: ["code", "terminal", "notes"],
    layout: "main-left",
    accent: "#0ea5e9",
    keywords: ["frontend", "front end", "front-end", "developer", "dev", "coding", "code", "programmer", "engineer", "web", "software"],
  },
  {
    id: "student",
    name: "Student",
    description: "Calendar, notes, and a whiteboard for studying and planning.",
    icon: "🎓",
    apps: ["notes", "calendar", "whiteboard"],
    layout: "columns",
    accent: "#10b981",
    keywords: ["student", "study", "studying", "school", "college", "university", "learning", "homework", "class"],
  },
  {
    id: "trader",
    name: "Stock Trader",
    description: "Live stock widget, calculator, and notes for tracking markets.",
    icon: "📈",
    apps: ["notes", "calculator"],
    widgets: ["stock"],
    layout: "main-left",
    accent: "#f59e0b",
    keywords: ["trader", "trading", "stock", "stocks", "invest", "investing", "investor", "finance", "market", "markets", "crypto"],
  },
  {
    id: "writer",
    name: "Writer",
    description: "Writing studio, research workspace, and notes for long-form work.",
    icon: "✍️",
    apps: ["writer", "research", "notes"],
    layout: "main-left",
    accent: "#8b5cf6",
    keywords: ["writer", "writing", "author", "blog", "blogger", "content", "novelist", "journalist"],
  },
  {
    id: "designer",
    name: "Designer",
    description: "Whiteboard, image editor, and gallery for visual work.",
    icon: "🎨",
    apps: ["whiteboard", "imageeditor", "gallery"],
    layout: "main-left",
    accent: "#ec4899",
    keywords: ["designer", "design", "ux", "ui", "creative", "artist", "art", "graphic"],
  },
  {
    id: "research",
    name: "Researcher",
    description: "Research workspace, browser, and notes for deep dives.",
    icon: "🔬",
    apps: ["research", "browser", "notes"],
    layout: "main-left",
    accent: "#06b6d4",
    keywords: ["research", "researcher", "academic", "scientist", "paper", "study", "analysis"],
  },
  {
    id: "data",
    name: "Data Analyst",
    description: "Database explorer, JSON visualizer, and code editor.",
    icon: "📊",
    apps: ["database", "json", "code"],
    layout: "columns",
    accent: "#3b82f6",
    keywords: ["data", "analyst", "analytics", "database", "sql", "json", "scientist"],
  },
  {
    id: "gamer",
    name: "Gamer",
    description: "Arcade, snake, and chess — clock out and play.",
    icon: "🎮",
    apps: ["arcade", "snake", "chess"],
    layout: "grid",
    accent: "#a855f7",
    keywords: ["gamer", "gaming", "game", "games", "play", "arcade", "fun", "relax", "break"],
  },
];

/** Resolve free text (e.g. "frontend developer") to a workspace, or null. */
export function matchWorkspace(text: string): Workspace | null {
  const q = text.trim().toLowerCase();
  if (!q) return null;

  // Exact id/name match first.
  const exact = WORKSPACES.find(
    (w) => w.id === q || w.name.toLowerCase() === q,
  );
  if (exact) return exact;

  // Score by keyword hits; longer keywords weigh more (more specific).
  let best: { ws: Workspace; score: number } | null = null;
  for (const ws of WORKSPACES) {
    let score = 0;
    for (const kw of ws.keywords) {
      if (q.includes(kw)) score += kw.length;
    }
    if (score > 0 && (!best || score > best.score)) best = { ws, score };
  }
  return best?.ws ?? null;
}

// ---- Tiling engine ----

const MARGIN = 16;
const GAP = 12;

/** The usable desktop area (between the top bar and the dock). */
function desktopArea(): Rect {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 820;
  return {
    x: MARGIN,
    y: TOPBAR_HEIGHT + MARGIN,
    width: vw - MARGIN * 2,
    height: vh - TOPBAR_HEIGHT - DOCK_HEIGHT - MARGIN * 2,
  };
}

/** Compute `count` tile boxes for a layout within `area` (primary = index 0). */
export function computeTiles(count: number, layout: LayoutKind, area: Rect): Rect[] {
  if (count <= 0) return [];
  if (count === 1) return [area];

  if (layout === "columns") {
    const w = (area.width - GAP * (count - 1)) / count;
    return Array.from({ length: count }, (_, i) => ({
      x: area.x + i * (w + GAP),
      y: area.y,
      width: w,
      height: area.height,
    }));
  }

  if (layout === "grid") {
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    const cw = (area.width - GAP * (cols - 1)) / cols;
    const ch = (area.height - GAP * (rows - 1)) / rows;
    return Array.from({ length: count }, (_, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      return {
        x: area.x + c * (cw + GAP),
        y: area.y + r * (ch + GAP),
        width: cw,
        height: ch,
      };
    });
  }

  // main-left / main-right: primary takes ~60% on one side, rest stack on the
  // other side filling the remaining height.
  const primaryRatio = 0.6;
  const mainW = area.width * primaryRatio - GAP / 2;
  const sideW = area.width - mainW - GAP;
  const others = count - 1;
  const sideH = (area.height - GAP * (others - 1)) / others;

  const mainX = layout === "main-left" ? area.x : area.x + sideW + GAP;
  const sideX = layout === "main-left" ? area.x + mainW + GAP : area.x;

  const tiles: Rect[] = [
    { x: mainX, y: area.y, width: mainW, height: area.height },
  ];
  for (let i = 0; i < others; i++) {
    tiles.push({
      x: sideX,
      y: area.y + i * (sideH + GAP),
      width: sideW,
      height: sideH,
    });
  }
  return tiles;
}

/** Tile the given windows (in order; first = primary) using a layout. */
export function arrangeWindows(windowIds: string[], layout: LayoutKind): void {
  const ids = windowIds.filter(Boolean);
  if (ids.length === 0) return;
  const tiles = computeTiles(ids.length, layout, desktopArea());
  const setBounds = useWindowStore.getState().setWindowBounds;
  ids.forEach((id, i) => setBounds(id, tiles[i]));
  // Focus the primary window last so it's on top.
  useWindowStore.getState().focusWindow(ids[0]);
}

export interface WorkspaceResult {
  ok: boolean;
  message: string;
}

/** Launch a workspace: ambiance → widgets → apps → tiling. */
export function launchWorkspace(workspace: Workspace): WorkspaceResult {
  // Ambiance.
  if (workspace.accent) useSettingsStore.getState().setAccent(workspace.accent);
  if (workspace.wallpaperId) useSettingsStore.getState().setWallpaper(workspace.wallpaperId);

  // Widgets.
  const widgetStore = useWidgetStore.getState();
  for (const w of workspace.widgets ?? []) {
    if (!widgetStore.isVisible(w)) widgetStore.toggleWidget(w);
  }

  // Apps (collect window ids in priority order).
  const ids: string[] = [];
  for (const appId of workspace.apps) {
    const id = launchApp(appId);
    if (id) ids.push(id);
  }

  // Tile them.
  arrangeWindows(ids, workspace.layout);

  return {
    ok: true,
    message: `${workspace.icon} Launched the ${workspace.name} workspace — ${ids.length} apps arranged.`,
  };
}

/** Launch by free-text description; returns a result even when unmatched. */
export function launchWorkspaceByText(text: string): WorkspaceResult {
  const ws = matchWorkspace(text);
  if (!ws) {
    return {
      ok: false,
      message: `No workspace matched "${text}". Try: ${WORKSPACES.map((w) => w.name).join(", ")}.`,
    };
  }
  return launchWorkspace(ws);
}
