/**
 * System-level types: boot phases, session, settings, and the event catalogue.
 */

/** The OS lifecycle as the user experiences it: boot → login → desktop. */
export type SystemPhase = "booting" | "login" | "desktop" | "locked";

/** The signed-in user (Phase 1: a single local profile, no real auth). */
export interface UserProfile {
  username: string;
  displayName: string;
  avatar: string;
}

/** Visual theme mode. `system` follows the OS preference. */
export type ThemeMode = "light" | "dark" | "system";

/** A selectable wallpaper. Phase 1 ships procedural gradient wallpapers. */
export interface Wallpaper {
  id: string;
  name: string;
  /** A CSS background value (gradient) — no external asset needed. */
  css: string;
}

/** User-configurable OS settings (Settings Service, Architecture.md §4.3). */
export interface SystemSettings {
  theme: ThemeMode;
  accent: string;
  wallpaperId: string;
  reducedMotion: boolean;
  /** Restore open windows + layout on launch (session restore). */
  restoreWindows: boolean;
}

/**
 * The central event catalogue (Architecture.md §3.1). Events are the only
 * sanctioned cross-component channel. Keyed by `domain:action`.
 */
export interface SystemEventMap {
  "system:boot-complete": undefined;
  "system:login": UserProfile;
  "system:logout": undefined;
  "system:lock": undefined;
  "window:open": { windowId: string; appId: string };
  "window:close": { windowId: string };
  "window:focus": { windowId: string };
  "window:minimize": { windowId: string };
  "window:maximize": { windowId: string };
  "app:launch": { appId: string };
  "settings:changed": { key: keyof SystemSettings };
  "fs:changed": {
    path: string;
    kind: "create" | "update" | "rename" | "delete" | "move" | "reset";
  };
  "achievement:unlock": { id: string };
  "easter-egg:trigger": { id: string };
}

export type SystemEventType = keyof SystemEventMap;
