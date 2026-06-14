"use client";

/**
 * WindowContent — the dispatch seam between the generic window frame and the
 * app that fills it (Architecture.md §6).
 *
 * Apps are lazy-loaded, so the app component is rendered inside a <Suspense>
 * boundary with a polished loading state while its chunk downloads. Apps not in
 * the registry fall back to a "coming soon" panel. The window frame never
 * changes per app.
 */

import { Suspense } from "react";
import type { WindowInstance } from "@/types";
import { getApp } from "@/core/app-registry";
import { getAppComponent } from "@/apps/registry";

export function WindowContent({ win }: { win: WindowInstance }) {
  const AppComponent = getAppComponent(win.appId);

  if (AppComponent) {
    return (
      <Suspense fallback={<AppLoading />}>
        <AppComponent win={win} />
      </Suspense>
    );
  }

  // Fallback for apps without a registered component (e.g. Browser, AI Center).
  const app = getApp(win.appId);
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-bg p-8 text-center">
      <div className="text-5xl">{app?.icon ?? "🪟"}</div>
      <h2 className="text-lg font-semibold text-text">{app?.name ?? win.title}</h2>
      <p className="max-w-xs text-sm text-text-muted">
        This app arrives in a later phase. The foundation — window management,
        the desktop, and state — is what&apos;s running now.
      </p>
      <span className="mt-2 rounded-full bg-surface-elevated px-3 py-1 text-xs text-text-muted ring-1 ring-border">
        {win.appId} · {Math.round(win.rect.width)}×{Math.round(win.rect.height)}
      </span>
    </div>
  );
}

/** Loading state shown while a lazy app chunk downloads. */
function AppLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-bg">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  );
}
