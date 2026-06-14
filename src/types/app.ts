/**
 * App manifest types (Architecture.md §6.1).
 *
 * In Phase 1 we don't implement real apps, but the dock and window manager
 * need a stable app-descriptor contract to launch against. Defining it now
 * keeps the seam clean for when apps land in later phases.
 */

import type { WindowConstraints, Rect } from "./window";

/** Capabilities an app can request from the kernel's capability broker. */
export type Capability =
  | "fs:read"
  | "fs:write"
  | "network"
  | "ai"
  | "notifications"
  | "settings:write";

/** Default window geometry/behaviour for an app. */
export interface AppWindowDefaults {
  defaultSize: Pick<Rect, "width" | "height">;
  constraints: WindowConstraints;
}

/**
 * The contract describing an installable app. Phase 1 ships only placeholder
 * apps so the dock and WM have something to launch; `entry` is intentionally
 * omitted until real apps exist.
 */
export type AppCategory =
  | "system"
  | "productivity"
  | "developer"
  | "media"
  | "ai"
  | "games";

export interface AppManifest {
  id: string;
  name: string;
  /** Single emoji or short glyph used as the icon. */
  icon: string;
  /** Whether only one window of this app may exist at a time. */
  singleton: boolean;
  window: AppWindowDefaults;
  capabilities: Capability[];
  /** Grouping for the dock/launcher/marketplace. */
  category?: AppCategory;
}
