/**
 * App launcher — bridges the App Registry to the Window Manager.
 *
 * This is the single entry point the dock (and later the AI/command registry)
 * use to open an app. It enforces the manifest's `singleton` flag: launching a
 * singleton that's already open just focuses the existing window.
 */

import { getApp } from "@/core/app-registry";
import { useWindowStore } from "@/store/window-store";

/** Launch an app by id. Returns the window id, or null if the app is unknown. */
export function launchApp(appId: string): string | null {
  const app = getApp(appId);
  if (!app) return null;

  const store = useWindowStore.getState();

  if (app.singleton) {
    const existing = store.windows.find((w) => w.appId === appId);
    if (existing) {
      store.focusWindow(existing.id);
      return existing.id;
    }
  }

  return store.openWindow({
    appId: app.id,
    title: app.name,
    icon: app.icon,
    rect: app.window.defaultSize,
    constraints: app.window.constraints,
  });
}
