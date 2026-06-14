/**
 * Window Manager store (Architecture.md §4.2).
 *
 * Single owner of all window state: geometry, stacking (z-order), focus, and
 * lifecycle (open/close/minimize/maximize). The shell's window layer renders
 * reactively from this store; drag/resize handlers call `moveWindow` /
 * `resizeWindow` which manipulate state, and the renderer reflects it.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  WindowInstance,
  OpenWindowOptions,
  Rect,
  SnapZone,
} from "@/types";
import { eventBus } from "@/core/event-bus";
import { createId, clamp } from "@/core/utils";
import {
  WINDOW_BASE_Z,
  DEFAULT_WINDOW_CONSTRAINTS,
  DEFAULT_WINDOW_SIZE,
  WINDOW_CASCADE_OFFSET,
  TOPBAR_HEIGHT,
  DOCK_HEIGHT,
} from "@/core/constants";
import {
  snapTargetRect,
  complementaryZone,
  type SnapTarget,
} from "@/core/snap";

/** A descriptor of a recently-closed window, for "reopen closed" (Ctrl+Shift+T). */
interface ClosedWindow {
  appId: string;
  title: string;
  icon?: string;
  rect: Rect;
  constraints: WindowInstance["constraints"];
}

/**
 * Fit a target box to a window, respecting resizability: resizable windows fill
 * the box (clamped to min size); fixed-size windows keep their size and center.
 */
function fitBounds(win: WindowInstance, box: Rect): Rect {
  if (!win.constraints.resizable) {
    return {
      x: Math.round(box.x + (box.width - win.rect.width) / 2),
      y: Math.max(0, Math.round(box.y + (box.height - win.rect.height) / 2)),
      width: win.rect.width,
      height: win.rect.height,
    };
  }
  return {
    x: Math.round(box.x),
    y: Math.round(box.y),
    width: Math.max(box.width, win.constraints.minWidth),
    height: Math.max(box.height, win.constraints.minHeight),
  };
}

/** Transient snap-assist prompt: pick a window to fill the empty half. */
interface SnapAssistState {
  fillZone: SnapZone;
  /** The window that was just snapped (excluded from the picker). */
  sourceId: string;
}

interface WindowState {
  windows: WindowInstance[];
  /** Monotonic counter producing the next z-index (focus brings to front). */
  topZIndex: number;
  /** Count of windows opened, used to cascade new window positions. */
  openedCount: number;
  /** Live snap-zone preview shown while dragging a title bar (transient). */
  dragPreview: SnapTarget | null;
  /** Snap-assist prompt, shown after snapping a window to a half (transient). */
  snapAssist: SnapAssistState | null;
  /** Stack of recently-closed windows for "reopen closed window". */
  closedStack: ClosedWindow[];

  openWindow: (options: OpenWindowOptions) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restoreWindow: (id: string) => void;
  moveWindow: (id: string, position: { x: number; y: number }) => void;
  resizeWindow: (id: string, rect: Rect) => void;
  /** Snap a window to a zone (or maximize); records floating geometry. */
  snapWindow: (id: string, target: SnapTarget) => void;
  /** Restore a snapped/maximized window to its floating geometry. */
  restoreFloating: (id: string) => void;
  /** Set/clear the live drag preview zone. */
  setDragPreview: (target: SnapTarget | null) => void;
  /** Dismiss the snap-assist prompt. */
  clearSnapAssist: () => void;
  /**
   * Re-hydrate a restored session for the current viewport: re-snap snapped
   * windows, clamp floating windows on-screen, and ensure a single focus.
   * Called once when the desktop mounts.
   */
  restoreSession: () => void;
  /** Close all windows and reset session state (used when restore is off). */
  clearSession: () => void;
  /** Reopen the most recently closed window at its previous location. */
  reopenLast: () => void;
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

export const useWindowStore = create<WindowState>()(
  persist(
    (set, get) => ({
  windows: [],
  topZIndex: WINDOW_BASE_Z,
  openedCount: 0,
  dragPreview: null,
  snapAssist: null,
  closedStack: [],

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
      snapZone: null,
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
    set((state) => {
      const closing = state.windows.find((w) => w.id === id);
      const closed: ClosedWindow[] = closing
        ? [
            {
              appId: closing.appId,
              title: closing.title,
              icon: closing.icon,
              rect: closing.restoreRect ?? closing.rect,
              constraints: closing.constraints,
            },
            ...state.closedStack,
          ].slice(0, 10)
        : state.closedStack;
      return {
        windows: state.windows.filter((w) => w.id !== id),
        closedStack: closed,
      };
    });
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
          // Restore to the pre-maximize geometry; also clear any snap.
          return {
            ...w,
            rect: w.restoreRect ?? w.rect,
            restoreRect: null,
            snapZone: null,
            flags: { ...w.flags, maximized: false },
          };
        }
        // Maximize: snapshot floating geometry once (preserve it if the window
        // is currently snapped, so restore returns to the true floating size).
        return {
          ...w,
          restoreRect: w.snapZone ? w.restoreRect : w.rect,
          snapZone: null,
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
      windows: state.windows.map((w) => {
        if (w.id !== id || w.flags.maximized) return w;
        // Dragging a snapped window un-snaps it: restore its floating size and
        // let it follow the cursor (matching native OS behaviour).
        if (w.snapZone && w.restoreRect) {
          return {
            ...w,
            snapZone: null,
            rect: {
              x: position.x,
              y: position.y,
              width: w.restoreRect.width,
              height: w.restoreRect.height,
            },
          };
        }
        return { ...w, rect: { ...w.rect, x: position.x, y: position.y } };
      }),
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

  snapWindow: (id, target) => {
    set((state) => {
      const win = state.windows.find((w) => w.id === id);
      if (!win) return state;
      // Snapshot floating geometry once (don't overwrite if already snapped/max).
      const restoreRect =
        win.snapZone || win.flags.maximized ? win.restoreRect : win.rect;

      if (target === "maximize") {
        return {
          windows: state.windows.map((w) =>
            w.id === id
              ? {
                  ...w,
                  restoreRect,
                  snapZone: null,
                  flags: { minimized: false, maximized: true },
                }
              : w,
          ),
        };
      }

      const box = snapTargetRect(target);
      return {
        windows: state.windows.map((w) => {
          if (w.id !== id) return w;
          const flags = { minimized: false, maximized: false };
          return { ...w, flags, restoreRect, snapZone: target, rect: fitBounds(w, box) };
        }),
      };
    });

    get().focusWindow(id);

    // Offer snap-assist when snapping to a half and other windows are available.
    if (target === "left" || target === "right") {
      const fillZone = complementaryZone(target);
      const others = get().windows.filter(
        (w) => w.id !== id && !w.flags.minimized,
      );
      if (fillZone && others.length > 0) {
        set({ snapAssist: { fillZone, sourceId: id } });
      } else {
        set({ snapAssist: null });
      }
    } else {
      set({ snapAssist: null });
    }
  },

  restoreFloating: (id) => {
    set((state) => ({
      windows: state.windows.map((w) => {
        if (w.id !== id) return w;
        const rect = w.restoreRect ?? w.rect;
        return {
          ...w,
          snapZone: null,
          restoreRect: null,
          flags: { ...w.flags, maximized: false, minimized: false },
          rect,
        };
      }),
    }));
  },

  setDragPreview: (target) => set({ dragPreview: target }),
  clearSnapAssist: () => set({ snapAssist: null }),

  restoreSession: () => {
    if (typeof window === "undefined") return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    set((state) => {
      if (state.windows.length === 0) return state;
      const maxZ = state.windows.reduce((m, w) => Math.max(m, w.zIndex), WINDOW_BASE_Z);
      return {
        topZIndex: Math.max(state.topZIndex, maxZ),
        // Transient bits never survive a reload.
        dragPreview: null,
        snapAssist: null,
        windows: state.windows.map((w) => {
          // Single focus: the top-most non-minimized window.
          const focused = w.zIndex === maxZ && !w.flags.minimized;
          if (w.flags.maximized) return { ...w, focused };
          if (w.snapZone) {
            // Re-derive the snapped rect for the current viewport size.
            return { ...w, focused, rect: fitBounds(w, snapTargetRect(w.snapZone)) };
          }
          // Floating: clamp on-screen and within the viewport.
          const width = Math.min(w.rect.width, vw);
          const height = Math.min(w.rect.height, vh - TOPBAR_HEIGHT - DOCK_HEIGHT);
          const x = clamp(w.rect.x, 0, Math.max(0, vw - 120));
          const y = clamp(w.rect.y, TOPBAR_HEIGHT, Math.max(TOPBAR_HEIGHT, vh - DOCK_HEIGHT - 60));
          return { ...w, focused, rect: { x, y, width, height } };
        }),
      };
    });
  },

  clearSession: () => {
    set({
      windows: [],
      topZIndex: WINDOW_BASE_Z,
      openedCount: 0,
      dragPreview: null,
      snapAssist: null,
    });
  },

  reopenLast: () => {
    const [last, ...rest] = get().closedStack;
    if (!last) return;
    set({ closedStack: rest });
    get().openWindow({
      appId: last.appId,
      title: last.title,
      icon: last.icon,
      rect: last.rect,
      constraints: last.constraints,
    });
  },
    }),
    {
      name: "nexus.windows",
      version: 1,
      // Persist only the durable session state — never the transient UI bits.
      partialize: (s) => ({
        windows: s.windows,
        topZIndex: s.topZIndex,
        openedCount: s.openedCount,
        closedStack: s.closedStack,
      }),
    },
  ),
);

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
