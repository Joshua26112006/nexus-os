"use client";

/**
 * Window — the visual frame hosting an app process (Architecture.md §4.2,
 * shell/window-layer/window-frame). Provides:
 *  - a draggable title bar
 *  - minimize / maximize / close controls (WM-1, WM-2)
 *  - resize handles (when resizable and not maximized)
 *  - click-to-focus (WM-3)
 *
 * Geometry mutations are delegated to the window store; this component only
 * translates pointer interactions into store calls and renders current state.
 */

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import type { WindowInstance, Rect } from "@/types";
import { useWindowStore } from "@/store/window-store";
import { useSettingsStore } from "@/store/settings-store";
import { usePointerDrag } from "@/hooks/usePointerDrag";
import { DOCK_HEIGHT, TITLEBAR_HEIGHT, TOPBAR_HEIGHT } from "@/core/constants";
import { detectSnapZone, type SnapTarget } from "@/core/snap";
import { ResizeHandles } from "./ResizeHandles";
import { WindowContent } from "./WindowContent";
import { cn } from "@/core/utils";

interface WindowProps {
  win: WindowInstance;
}

export function Window({ win }: WindowProps) {
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const moveWindow = useWindowStore((s) => s.moveWindow);
  const resizeWindow = useWindowStore((s) => s.resizeWindow);
  const snapWindow = useWindowStore((s) => s.snapWindow);
  const setDragPreview = useWindowStore((s) => s.setDragPreview);
  const clearSnapAssist = useWindowStore((s) => s.clearSnapAssist);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  // Snapshot position at drag start so deltas apply to a stable origin.
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // The snap zone under the cursor on the most recent drag frame.
  const pendingSnap = useRef<SnapTarget | null>(null);
  // True while dragging/resizing — suppresses the smooth geometry transition.
  const [interacting, setInteracting] = useState(false);

  const onTitlePointerDown = usePointerDrag({
    onStart: () => {
      focusWindow(win.id);
      dragStart.current = { x: win.rect.x, y: win.rect.y };
      pendingSnap.current = null;
      setInteracting(true);
    },
    onMove: ({ dx, dy, x, y }) => {
      if (win.flags.maximized) return;
      moveWindow(win.id, {
        x: dragStart.current.x + dx,
        y: Math.max(0, dragStart.current.y + dy),
      });
      // Live snap preview based on the absolute pointer position.
      const zone = detectSnapZone(x, y);
      if (zone !== pendingSnap.current) {
        pendingSnap.current = zone;
        setDragPreview(zone);
      }
    },
    onEnd: () => {
      setDragPreview(null);
      setInteracting(false);
      if (pendingSnap.current) {
        snapWindow(win.id, pendingSnap.current);
        pendingSnap.current = null;
      }
    },
  });

  const handleResize = (rect: Rect) => {
    resizeWindow(win.id, rect);
  };

  // Maximized windows fill the desktop area between the top bar and the dock,
  // so neither piece of shell chrome overlaps the window (or vice versa).
  const geometry: React.CSSProperties = win.flags.maximized
    ? {
        left: 0,
        top: TOPBAR_HEIGHT,
        width: "100%",
        height: `calc(100% - ${TOPBAR_HEIGHT + DOCK_HEIGHT}px)`,
      }
    : {
        left: win.rect.x,
        top: win.rect.y,
        width: win.rect.width,
        height: win.rect.height,
      };

  if (win.flags.minimized) return null;

  return (
    <motion.div
      role="dialog"
      aria-label={win.title}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={
        reducedMotion
          ? undefined
          : { opacity: 0, scale: 0.94, transition: { duration: 0.13, ease: "easeIn" } }
      }
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 30, mass: 0.7 }
      }
      style={{
        ...geometry,
        zIndex: win.zIndex,
        boxShadow: win.focused
          ? "0 32px 64px -16px rgb(2 6 23 / 0.65), 0 0 0 1px rgb(var(--color-accent) / 0.35), 0 0 40px -8px rgb(var(--color-accent) / 0.35)"
          : undefined,
      }}
      onPointerDown={() => {
        focusWindow(win.id);
        clearSnapAssist();
      }}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-window border text-text shadow-window",
        "bg-surface/90 backdrop-blur-xl",
        win.focused ? "border-white/10" : "border-white/5 opacity-95",
        // Animate snap/keyboard repositioning, but not while actively dragging
        // or resizing (which must track the cursor 1:1).
        !interacting && !reducedMotion &&
          "transition-[left,top,width,height] duration-200 ease-os",
      )}
    >
      {/* Title bar — glassy, with a subtle top sheen. */}
      <div
        onPointerDown={onTitlePointerDown}
        onDoubleClick={() => toggleMaximize(win.id)}
        style={{ height: TITLEBAR_HEIGHT }}
        className={cn(
          "group/titlebar relative flex shrink-0 select-none items-center gap-2 border-b border-white/5 px-3",
          win.flags.maximized ? "cursor-default" : "cursor-grab active:cursor-grabbing",
          win.focused ? "bg-white/[0.04]" : "bg-transparent",
        )}
      >
        {/* Traffic lights (left, macOS-style) reveal glyphs on hover. */}
        <div className="flex items-center gap-2">
          <TrafficLight
            label="Close"
            glyph="✕"
            className="bg-rose-500 hover:bg-rose-400"
            onClick={(e) => {
              e.stopPropagation();
              closeWindow(win.id);
            }}
          />
          <TrafficLight
            label="Minimize"
            glyph="–"
            className="bg-amber-400 hover:bg-amber-300"
            onClick={(e) => {
              e.stopPropagation();
              minimizeWindow(win.id);
            }}
          />
          <TrafficLight
            label={win.flags.maximized ? "Restore" : "Maximize"}
            glyph="+"
            className="bg-emerald-400 hover:bg-emerald-300"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize(win.id);
            }}
          />
        </div>

        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 truncate text-xs font-medium text-text-muted">
          {win.icon && <span className="mr-1.5">{win.icon}</span>}
          {win.title}
        </span>
      </div>

      {/* Content area */}
      <div className="nexus-scroll relative flex-1 overflow-auto">
        <WindowContent win={win} />
      </div>

      {win.constraints.resizable && !win.flags.maximized && (
        <ResizeHandles
          rect={win.rect}
          onResize={handleResize}
          onActiveChange={setInteracting}
        />
      )}
    </motion.div>
  );
}

function TrafficLight({
  label,
  glyph,
  className,
  onClick,
}: {
  label: string;
  glyph: string;
  className: string;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn(
        "flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-bold leading-none text-black/55 ring-1 ring-black/10 transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
    >
      {/* Glyph appears only when hovering the title-bar cluster. */}
      <span className="opacity-0 transition-opacity group-hover/titlebar:opacity-100">
        {glyph}
      </span>
    </button>
  );
}
