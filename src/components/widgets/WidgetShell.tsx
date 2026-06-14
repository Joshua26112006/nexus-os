"use client";

/**
 * WidgetShell — a draggable glassmorphic container for a desktop widget.
 *
 * Reuses the OS pointer-drag primitive so widgets move at 60fps like windows,
 * and persists position via the widget store. A close affordance appears on
 * hover. Sits below windows in the z-stack.
 */

import { useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useWidgetStore, type WidgetType } from "@/store/widget-store";
import { useSettingsStore } from "@/store/settings-store";
import { usePointerDrag } from "@/hooks/usePointerDrag";

interface WidgetShellProps {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  width?: number;
  children: ReactNode;
}

export function WidgetShell({ id, type, x, y, width = 230, children }: WidgetShellProps) {
  const moveWidget = useWidgetStore((s) => s.moveWidget);
  const toggleWidget = useWidgetStore((s) => s.toggleWidget);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const start = useRef({ x, y });

  const onPointerDown = usePointerDrag({
    onStart: () => {
      start.current = { x, y };
    },
    onMove: ({ dx, dy }) => {
      moveWidget(id, start.current.x + dx, start.current.y + dy);
    },
  });

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      style={{ left: x, top: y, width }}
      onPointerDown={onPointerDown}
      className="group/widget glass glass-sheen absolute z-[5] cursor-grab rounded-2xl p-4 text-white shadow-dock active:cursor-grabbing"
    >
      {/* Close button (hover-revealed). */}
      <button
        type="button"
        aria-label="Hide widget"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => toggleWidget(type)}
        className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white/80 opacity-0 ring-1 ring-white/20 transition hover:bg-black/80 group-hover/widget:opacity-100"
      >
        ✕
      </button>
      {children}
    </motion.div>
  );
}
