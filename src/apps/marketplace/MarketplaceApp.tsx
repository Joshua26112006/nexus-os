"use client";

/**
 * Marketplace — two stores in one app:
 *  - Themes: curated accent + wallpaper combinations applied with one click.
 *  - Apps: the installed app catalogue (launchable) plus "coming soon" entries
 *    that hint at the platform's future.
 *
 * Theme application routes through the existing settings store, so it reuses
 * the live theming pipeline from earlier phases.
 */

import { useState } from "react";
import { useSettingsStore } from "@/store/settings-store";
import { APP_REGISTRY } from "@/core/app-registry";
import { launchApp } from "@/core/launcher";
import { WALLPAPERS } from "@/core/constants";

type Tab = "themes" | "apps";

interface ThemePack {
  id: string;
  name: string;
  accent: string;
  wallpaperId: string;
  theme: "light" | "dark";
}

const THEME_PACKS: ThemePack[] = [
  { id: "midnight", name: "Midnight", accent: "#6366f1", wallpaperId: "aurora", theme: "dark" },
  { id: "nebula", name: "Nebula", accent: "#8b5cf6", wallpaperId: "nebula", theme: "dark" },
  { id: "vapor", name: "Vaporwave", accent: "#f43f5e", wallpaperId: "synthwave", theme: "dark" },
  { id: "deep", name: "Deep Sea", accent: "#0ea5e9", wallpaperId: "abyss", theme: "dark" },
  { id: "ember", name: "Ember", accent: "#f59e0b", wallpaperId: "ember", theme: "dark" },
  { id: "horizon", name: "Horizon", accent: "#06b6d4", wallpaperId: "horizon", theme: "dark" },
  { id: "daylight", name: "Daylight", accent: "#6366f1", wallpaperId: "slate", theme: "light" },
  { id: "forest", name: "Forest", accent: "#10b981", wallpaperId: "aurora", theme: "dark" },
];

const COMING_SOON = [
  { name: "Music", icon: "🎵" },
  { name: "Photos", icon: "🖼️" },
  { name: "Mail", icon: "✉️" },
  { name: "Maps", icon: "🗺️" },
  { name: "Code", icon: "💻" },
  { name: "Chat", icon: "💬" },
];

export function MarketplaceApp() {
  const [tab, setTab] = useState<Tab>("themes");

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* Header / tabs */}
      <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-4 py-3">
        <span className="mr-3 text-base font-semibold">🛍️ Marketplace</span>
        <TabButton active={tab === "themes"} onClick={() => setTab("themes")}>
          Themes
        </TabButton>
        <TabButton active={tab === "apps"} onClick={() => setTab("apps")}>
          Apps
        </TabButton>
      </div>

      <div className="nexus-scroll flex-1 overflow-auto p-5">
        {tab === "themes" ? <ThemeStore /> : <AppStore />}
      </div>
    </div>
  );
}

function ThemeStore() {
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const setWallpaper = useSettingsStore((s) => s.setWallpaper);
  const currentWp = useSettingsStore((s) => s.wallpaperId);
  const currentAccent = useSettingsStore((s) => s.accent);

  const apply = (pack: ThemePack) => {
    setTheme(pack.theme);
    setAccent(pack.accent);
    setWallpaper(pack.wallpaperId);
  };

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-text-muted">Featured Themes</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {THEME_PACKS.map((pack) => {
          const wp = WALLPAPERS.find((w) => w.id === pack.wallpaperId);
          const active = currentWp === pack.wallpaperId && currentAccent === pack.accent;
          return (
            <div
              key={pack.id}
              className="overflow-hidden rounded-xl border border-border bg-surface transition hover:shadow-lg"
            >
              <div className="relative h-24" style={{ background: wp?.css }}>
                <span
                  className="absolute bottom-2 right-2 h-5 w-5 rounded-full ring-2 ring-white/60"
                  style={{ background: pack.accent }}
                />
              </div>
              <div className="flex items-center justify-between p-2.5">
                <span className="text-sm font-medium">{pack.name}</span>
                <button
                  type="button"
                  onClick={() => apply(pack)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-accent text-accent-fg hover:brightness-110"
                  }`}
                >
                  {active ? "Active" : "Apply"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AppStore() {
  const installable = APP_REGISTRY.filter((a) => a.id !== "marketplace");
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-muted">Installed</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {installable.map((app) => (
            <div
              key={app.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-2xl">
                {app.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{app.name}</p>
                <button
                  type="button"
                  onClick={() => app.id !== "ai" && launchApp(app.id)}
                  className="text-xs text-accent hover:underline"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-text-muted">Coming Soon</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {COMING_SOON.map((app) => (
            <div
              key={app.name}
              className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 p-3 opacity-70"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-elevated text-2xl">
                {app.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{app.name}</p>
                <span className="text-xs text-text-muted">Soon</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "bg-accent text-accent-fg" : "text-text-muted hover:bg-surface-elevated"
      }`}
    >
      {children}
    </button>
  );
}
