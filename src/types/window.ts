/**
 * Window manager types.
 *
 * A "window" is the visual host of an app process (Architecture.md §4.2).
 * Geometry, stacking, and lifecycle state all live here so the Window Manager
 * service is the single owner of window state.
 */

/** Axis-aligned rectangle in desktop coordinates (pixels). */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Constraints an app declares for its window (from the app manifest later). */
export interface WindowConstraints {
  minWidth: number;
  minHeight: number;
  resizable: boolean;
}

/** Lifecycle/visual state flags for a window. */
export interface WindowFlags {
  minimized: boolean;
  maximized: boolean;
}

/**
 * A managed window. `appId` references the app it hosts; in Phase 1 there are
 * no real apps yet, so windows render placeholder content.
 */
export interface WindowInstance {
  id: string;
  appId: string;
  title: string;
  icon?: string;
  /** Current geometry while floating (restored to this when un-maximized). */
  rect: Rect;
  /** Geometry snapshot taken before maximizing, to restore on un-maximize. */
  restoreRect: Rect | null;
  flags: WindowFlags;
  constraints: WindowConstraints;
  zIndex: number;
  focused: boolean;
}

/** The eight directions a window edge/corner can be resized from. */
export type ResizeDirection =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

/** Options accepted when opening a new window. */
export interface OpenWindowOptions {
  appId: string;
  title: string;
  icon?: string;
  rect?: Partial<Rect>;
  constraints?: Partial<WindowConstraints>;
}
