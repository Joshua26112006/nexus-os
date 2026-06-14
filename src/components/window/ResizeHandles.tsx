"use client";

/**
 * ResizeHandles — eight edge/corner grips that resize a window (WM-1).
 *
 * Each handle reports the pointer delta; the parent applies it to the window's
 * rect according to which direction is being dragged, honoring min-size
 * constraints (enforced in the window store's `resizeWindow`).
 */

import { useRef } from "react";
import type { Rect, ResizeDirection } from "@/types";
import { usePointerDrag } from "@/hooks/usePointerDrag";

const DIRECTIONS: { dir: ResizeDirection; className: string }[] = [
  { dir: "n", className: "top-0 left-2 right-2 h-1.5 cursor-ns-resize" },
  { dir: "s", className: "bottom-0 left-2 right-2 h-1.5 cursor-ns-resize" },
  { dir: "e", className: "right-0 top-2 bottom-2 w-1.5 cursor-ew-resize" },
  { dir: "w", className: "left-0 top-2 bottom-2 w-1.5 cursor-ew-resize" },
  { dir: "ne", className: "top-0 right-0 h-3 w-3 cursor-nesw-resize" },
  { dir: "nw", className: "top-0 left-0 h-3 w-3 cursor-nwse-resize" },
  { dir: "se", className: "bottom-0 right-0 h-3 w-3 cursor-nwse-resize" },
  { dir: "sw", className: "bottom-0 left-0 h-3 w-3 cursor-nesw-resize" },
];

/** Apply a pointer delta to a rect for a given resize direction. */
function applyResize(start: Rect, dir: ResizeDirection, dx: number, dy: number): Rect {
  let { x, y, width, height } = start;

  if (dir.includes("e")) width = start.width + dx;
  if (dir.includes("s")) height = start.height + dy;
  if (dir.includes("w")) {
    width = start.width - dx;
    x = start.x + dx;
  }
  if (dir.includes("n")) {
    height = start.height - dy;
    y = start.y + dy;
  }

  return { x, y, width, height };
}

interface ResizeHandlesProps {
  rect: Rect;
  onResize: (rect: Rect) => void;
}

export function ResizeHandles({ rect, onResize }: ResizeHandlesProps) {
  return (
    <>
      {DIRECTIONS.map(({ dir, className }) => (
        <Handle
          key={dir}
          dir={dir}
          className={className}
          rect={rect}
          onResize={onResize}
        />
      ))}
    </>
  );
}

function Handle({
  dir,
  className,
  rect,
  onResize,
}: {
  dir: ResizeDirection;
  className: string;
  rect: Rect;
  onResize: (rect: Rect) => void;
}) {
  // Snapshot the rect at drag start so deltas apply to a stable origin.
  const startRect = useRef<Rect>(rect);

  const onPointerDown = usePointerDrag({
    onStart: () => {
      startRect.current = rect;
    },
    onMove: ({ dx, dy }) => {
      onResize(applyResize(startRect.current, dir, dx, dy));
    },
  });

  return (
    <div
      role="presentation"
      onPointerDown={onPointerDown}
      className={`absolute z-10 ${className}`}
    />
  );
}
