/**
 * Window snapping geometry.
 *
 * Pure helpers shared by the drag handler and keyboard shortcuts:
 *  - `detectSnapZone` maps a pointer position to a snap zone (or maximize),
 *  - `snapTargetRect` returns the pixel rectangle for a zone,
 *  - `desktopArea` is the usable region between the top bar and the dock.
 */

import type { Rect, SnapZone } from "@/types";
import { TOPBAR_HEIGHT, DOCK_HEIGHT } from "./constants";

/** A drag near the very top maximizes; "maximize" is not a stored SnapZone. */
export type SnapTarget = SnapZone | "maximize";

/** Pixels from an edge that trigger a snap while dragging. */
const EDGE = 26;
/** How far into the edge's length counts as a "corner" rather than a half. */
const CORNER = 90;

/** The usable desktop region (full width, between top bar and dock). */
export function desktopArea(): Rect {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const vh = typeof window !== "undefined" ? window.innerHeight : 820;
  return {
    x: 0,
    y: TOPBAR_HEIGHT,
    width: vw,
    height: vh - TOPBAR_HEIGHT - DOCK_HEIGHT,
  };
}

/** Map a pointer position to a snap target, or null when not near an edge. */
export function detectSnapZone(x: number, y: number): SnapTarget | null {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
  const area = desktopArea();
  const bottom = area.y + area.height;

  // Left / right edges (with top/bottom corners).
  if (x <= EDGE) {
    if (y <= area.y + CORNER) return "top-left";
    if (y >= bottom - CORNER) return "bottom-left";
    return "left";
  }
  if (x >= vw - EDGE) {
    if (y <= area.y + CORNER) return "top-right";
    if (y >= bottom - CORNER) return "bottom-right";
    return "right";
  }
  // Top edge (between the corners) → maximize.
  if (y <= area.y + EDGE) return "maximize";
  return null;
}

/** The pixel rectangle a snap target maps to. */
export function snapTargetRect(target: SnapTarget): Rect {
  const a = desktopArea();
  const halfW = Math.round(a.width / 2);
  const halfH = Math.round(a.height / 2);
  switch (target) {
    case "maximize":
      return { x: a.x, y: a.y, width: a.width, height: a.height };
    case "left":
      return { x: a.x, y: a.y, width: halfW, height: a.height };
    case "right":
      return { x: a.x + halfW, y: a.y, width: a.width - halfW, height: a.height };
    case "top-left":
      return { x: a.x, y: a.y, width: halfW, height: halfH };
    case "top-right":
      return { x: a.x + halfW, y: a.y, width: a.width - halfW, height: halfH };
    case "bottom-left":
      return { x: a.x, y: a.y + halfH, width: halfW, height: a.height - halfH };
    case "bottom-right":
      return {
        x: a.x + halfW,
        y: a.y + halfH,
        width: a.width - halfW,
        height: a.height - halfH,
      };
  }
}

/** The complementary half for snap-assist (left↔right). Null for non-halves. */
export function complementaryZone(zone: SnapZone): SnapZone | null {
  if (zone === "left") return "right";
  if (zone === "right") return "left";
  return null;
}

/** Human-readable label for a snap target (used in shortcuts/tooltips). */
export function snapLabel(target: SnapTarget): string {
  return target.replace("-", " ");
}
