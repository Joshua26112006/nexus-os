"use client";

/**
 * usePointerDrag — a reusable pointer-drag primitive used by both window
 * dragging and resizing.
 *
 * It captures the pointer, tracks the delta from the drag origin, and invokes
 * `onMove` with that delta inside a requestAnimationFrame so updates are
 * throttled to the frame (Architecture.md §8.3 — 60fps drag, no layout thrash).
 */

import { useCallback, useRef } from "react";

interface DragDelta {
  dx: number;
  dy: number;
  /** Absolute pointer position in viewport coordinates. */
  x: number;
  y: number;
}

interface UsePointerDragOptions {
  onStart?: () => void;
  onMove: (delta: DragDelta) => void;
  onEnd?: () => void;
}

export function usePointerDrag({ onStart, onMove, onEnd }: UsePointerDragOptions) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef<number | null>(null);
  const latest = useRef<DragDelta>({ dx: 0, dy: 0, x: 0, y: 0 });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only react to the primary (left) button.
      if (e.button !== 0) return;
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      origin.current = { x: e.clientX, y: e.clientY };
      onStart?.();

      const handleMove = (ev: PointerEvent) => {
        if (!origin.current) return;
        latest.current = {
          dx: ev.clientX - origin.current.x,
          dy: ev.clientY - origin.current.y,
          x: ev.clientX,
          y: ev.clientY,
        };
        if (frame.current === null) {
          frame.current = requestAnimationFrame(() => {
            frame.current = null;
            onMove(latest.current);
          });
        }
      };

      const handleUp = () => {
        // Flush the final frame so the last pointer position is always applied
        // before the drag ends (otherwise an rAF-throttled move can be dropped
        // on release — e.g. the frame that reaches a snap zone).
        if (frame.current !== null) {
          cancelAnimationFrame(frame.current);
          frame.current = null;
          onMove(latest.current);
        }
        origin.current = null;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
        onEnd?.();
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [onStart, onMove, onEnd],
  );

  return handlePointerDown;
}
