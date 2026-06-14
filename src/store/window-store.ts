/**
 * Window Manager store (Architecture.md §4.2).
 *
 * Single owner of all window state: geometry, stacking (z-order), focus, and
 * lifecycle (open/close/minimize/maximize). The shell's window layer renders
 * reactively from this store; drag/resize handlers call `moveWindow` /
 * `resizeWindow` which manipulate state, and the renderer reflects it.
 */

import { create } from "zustand";
import type {
  WindowInstance,
  OpenWindowOptions,
  Rect,
} from "@/types";
import { eventBus } from "@/core/event-bus";
import { createId, clamp } from "@/core/utils";
import {
  WINDOW_BASE_Z,
  DEFAULT_WINDOW_CONSTRAINTS,
  DEFAULT_WINDOW_SIZE,
  WINDOW_CASCADE_OFFSET,
} from "@/core/constants";

interface WindowState {
  windows: WindowInstance[];
  /** Monotonic counter producing the next z-index (focus brings to front). */
  topZIndex: number;
  /** Count of windows opened, used to cascade new window positions. */
  openedCount: number;

  openWindow: (options: OpenWindowOptions) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restoreWindow: (id: string) => void;
  moveWindow: (id: string, position: { x: number; y: number }) => void;
  resizeWindow: (id: string, rect: Rect) => void;
  /**
   * Place a window into an exact bounding box (used by the Workspace Builder's
   * tiling engine). Un-minimizes/un-maximizes the window first. Resizable
   * windows fill the box (clamped to min size); non-resizable windows keep
   * their size and are centered within the box.
   */
  setWindowBounds: (id: string, box: Rect) => void;
}

/** Compute a cascaded starting rect for a newly opened window. */
function cascadeRect(openedCount: number, size: { width: number; height: number }): Rect {
  const offset = (openedCount % 6) * WINDOW_CASCADE_OFFSET;
  return {
    x: 120 + offset,
    y: 80 + offset,
    width: size.width,
    height: size.height,
  };
}

export const useWindowStore = create<WindowState>((set, get) => ({
  windows: [],
  topZIndex: WINDOW_BASE_Z,
  openedCount: 0,

  openWindow: (options) => {
    const id = createId("win");
    const nextZ = get().topZIndex + 1;
    const openedCount = get().openedCount;

    const size = {
      width: options.rect?.width ?? DEFAULT_WINDOW_SIZE.width,
      height: options.rect?.height ?? DEFAULT_WINDOW_SIZE.height,
    };
    const base = cascadeRect(openedCount, size);

    const rect: Rect = {
      x: options.rect?.x ?? base.x,
      y: options.rect?.y ?? base.y,
      width: size.width,
      height: size.height,
    };

    const win: WindowInstance = {
      id,
      appId: options.appId,
      title: options.title,
      icon: options.icon,
      rect,
      restoreRect: null,
      flags: { minimized: false, maximized: false },
      constraints: { ...DEFAULT_WINDOW_CONSTRAINTS, ...options.constraints },
      zIndex: nextZ,
      focused: true,
    };

    set((state) => ({
      windows: [
        ...state.windows.map((w) => ({ ...w, focused: false })),
        win,
      ],
      topZIndex: nextZ,
      openedCount: state.openedCount + 1,
    }));

    eventBus.emit("window:open", { windowId: id, appId: options.appId });
    eventBus.emit("app:launch", { appId: options.appId });
    return id;
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    }));
    eventBus.emit("window:close", { windowId: id });
  },

  focusWindow: (id) => {
    const target = get().windows.find((w) => w.id === id);
    if (!target) return;
    // Already focused and on top — nothing to do.
    if (target.focused && target.zIndex === get().topZIndex && !target.flags.minimized) {
      return;
    }
    const nextZ = get().topZIndex + 1;
    set((state) => ({
      topZIndex: nextZ,
      windows: state.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              focused: true,
              zIndex: nextZ,
              flags: { ...w.flags, minimized: false },
            }
          : { ...w, focused: false },
      ),
    }));
    eventBus.emit("window:focus", { windowId: id });
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? { ...w, focused: false, flags: { ...w.flags, minimized: true } }
          : w,
      ),
    }));
    eventBus.emit("window:minimize", { windowId: id });
  },

  toggleMaximize: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.flags.maximized) {
          // Restore to the pre-maximize geometry.
          return {
            ...w,
            rect: w.restoreRect ?? w.rect,
            restoreRect: null,
            flags: { ...w.flags, maximized: false },
          };
        }
        // Maximize: snapshot current rect so we can restore later.
        return {
          ...w,
          restoreRect: w.rect,
          flags: { ...w.flags, maximized: true },
        };
      }),
    }));
    eventBus.emit("window:maximize", { windowId: id });
  },

  restoreWindow: (id) => {
    get().focusWindow(id);
  },

  moveWindow: (id, position) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id && !w.flags.maximized
          ? { ...w, rect: { ...w.rect, x: position.x, y: position.y } }
          : w,
      ),
    }));
  },

  resizeWindow: (id, rect) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id || w.flags.maximized || !w.constraints.resizable) {
          return w;
        }
        const width = Math.max(rect.width, w.constraints.minWidth);
        const height = Math.max(rect.height, w.constraints.minHeight);
        return { ...w, rect: { x: rect.x, y: rect.y, width, height } };
      }),
    }));
  },

  setWindowBounds: (id, box) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        const flags = { minimized: false, maximized: false };
        if (!w.constraints.resizable) {
          // Keep size; center within the target box.
          const { width, height } = w.rect;
          return {
            ...w,
            flags,
            restoreRect: null,
            rect: {
              x: Math.round(box.x + (box.width - width) / 2),
              y: Math.max(0, Math.round(box.y + (box.height - height) / 2)),
              width,
              height,
            },
          };
        }
        const width = Math.max(box.width, w.constraints.minWidth);
        const height = Math.max(box.height, w.constraints.minHeight);
        return {
          ...w,
          flags,
          restoreRect: null,
          rect: { x: Math.round(box.x), y: Math.round(box.y), width, height },
        };
      }),
    }));
  },
}));

/** Helper used by resize handlers to keep a rect within sane screen bounds. */
export function constrainPosition(
  x: number,
  y: number,
  viewportWidth: number,
): { x: number; y: number } {
  return {
    x: clamp(x, -9999, viewportWidth - 80),
    y: clamp(y, 0, 9999),
  };
}
