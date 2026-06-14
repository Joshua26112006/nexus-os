"use client";

/**
 * Settings (Phase 2, SE-1/2/4). A reactive form over the settings store:
 * theme, accent, wallpaper, reduced-motion, plus a file-system reset. Changes
 * apply live across the OS via the settings store + ThemeProvider.
 */

import { useSettingsStore } from "@/store/settings-store";
import { useVfsStore } from "@/store/vfs-store";
import {
  useEnvironmentStore,
  WEATHER_CONDITIONS,
  WEATHER_ICON,
  type TimeOfDay,
} from "@/store/environment-store";
import { useWidgetStore, WIDGET_META, type WidgetType } from "@/store/widget-store";
import { WALLPAPERS } from "@/core/constants";
import { cn } from "@/core/utils";
import type { ThemeMode } from "@/types";

const ACCENTS = [
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Emerald", value: "#10b981" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Amber", value: "#f59e0b" },
];

export function SettingsApp() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const accent = useSettingsStore((s) => s.accent);
  const setAccent = useSettingsStore((s) => s.setAccent);
  const wallpaperId = useSettingsStore((s) => s.wallpaperId);
  const setWallpaper = useSettingsStore((s) => s.setWallpaper);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion);
  const restoreWindows = useSettingsStore((s) => s.restoreWindows);
  const setRestoreWindows = useSettingsStore((s) => s.setRestoreWindows);
  const resetFileSystem = useVfsStore((s) => s.resetFileSystem);

  return (
    <div className="nexus-scroll h-full w-full overflow-auto bg-bg p-6 text-text">
      <h1 className="mb-6 text-xl font-semibold">Settings</h1>

      {/* Appearance — Theme */}
      <Section title="Theme">
        <div className="flex gap-2">
          {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition",
                theme === mode
                  ? "border-accent bg-accent/15 text-text"
                  : "border-border text-text-muted hover:bg-surface-elevated",
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </Section>

      {/* Accent color */}
      <Section title="Accent Color">
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              aria-label={a.name}
              title={a.name}
              onClick={() => setAccent(a.value)}
              className={cn(
                "h-9 w-9 rounded-full ring-offset-2 ring-offset-bg transition",
                accent === a.value ? "ring-2 ring-text" : "ring-1 ring-border",
              )}
              style={{ background: a.value }}
            />
          ))}
        </div>
      </Section>

      {/* Wallpaper */}
      <Section title="Wallpaper">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp.id}
              type="button"
              onClick={() => setWallpaper(wp.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg p-1.5 transition",
                wallpaperId === wp.id
                  ? "ring-2 ring-accent"
                  : "ring-1 ring-border hover:ring-text-muted",
              )}
            >
              <span
                className="h-12 w-full rounded-md"
                style={{ background: wp.css }}
              />
              <span className="text-xs text-text-muted">{wp.name}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <div className="space-y-2">
          <Toggle
            label="Reduce motion"
            description="Minimize animations across the OS."
            checked={reducedMotion}
            onChange={() => setReducedMotion(!reducedMotion)}
          />
          <Toggle
            label="Restore windows on launch"
            description="Reopen your windows and layout exactly as you left them."
            checked={restoreWindows}
            onChange={() => setRestoreWindows(!restoreWindows)}
          />
        </div>
      </Section>

      {/* Desktop & Ambient — Phase 5 living-desktop controls. */}
      <AmbientSection />

      {/* System */}
      <Section title="System">
        <button
          type="button"
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              window.confirm(
                "Reset the file system to defaults? This deletes all your files.",
              )
            ) {
              resetFileSystem();
            }
          }}
          className="rounded-lg border border-rose-500/50 px-4 py-2 text-sm text-rose-400 transition hover:bg-rose-500/10"
        >
          Reset file system
        </button>
        <p className="mt-3 text-xs text-text-muted">
          NEXUS OS · Phase 2 · Core Applications
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A labelled on/off switch row. */
function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-sm">
        {label}
        <span className="block text-xs text-text-muted">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-accent" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            checked ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}

/** Living-desktop controls: widgets, weather, day/night, live wallpaper. */
function AmbientSection() {
  const widgets = useWidgetStore((s) => s.widgets);
  const toggleWidget = useWidgetStore((s) => s.toggleWidget);
  const weather = useEnvironmentStore((s) => s.weather);
  const setWeather = useEnvironmentStore((s) => s.setWeather);
  const liveWallpaper = useEnvironmentStore((s) => s.liveWallpaper);
  const setLiveWallpaper = useEnvironmentStore((s) => s.setLiveWallpaper);
  const autoCycle = useEnvironmentStore((s) => s.autoCycle);
  const setAutoCycle = useEnvironmentStore((s) => s.setAutoCycle);
  const setSunPosition = useEnvironmentStore((s) => s.setSunPosition);

  const widgetTypes: WidgetType[] = ["clock", "weather", "calendar", "system", "stock", "news"];
  const visibleSet = new Set(widgets.filter((w) => w.visible).map((w) => w.type));

  const TIMES: { key: TimeOfDay; label: string; pos: number }[] = [
    { key: "dawn", label: "Dawn", pos: 6 / 24 },
    { key: "day", label: "Day", pos: 12 / 24 },
    { key: "dusk", label: "Dusk", pos: 19 / 24 },
    { key: "night", label: "Night", pos: 23 / 24 },
  ];

  return (
    <Section title="Desktop & Ambient">
      {/* Widgets */}
      <p className="mb-2 text-xs text-text-muted">Widgets</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {widgetTypes.map((t) => {
          const on = visibleSet.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => toggleWidget(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition",
                on
                  ? "border-accent bg-accent/15 text-text"
                  : "border-border text-text-muted hover:bg-surface-elevated",
              )}
            >
              <span>{WIDGET_META[t].icon}</span>
              {WIDGET_META[t].name}
            </button>
          );
        })}
      </div>

      {/* Weather */}
      <p className="mb-2 text-xs text-text-muted">Weather</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {WEATHER_CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setWeather(c)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm capitalize transition",
              weather.condition === c
                ? "border-accent bg-accent/15 text-text"
                : "border-border text-text-muted hover:bg-surface-elevated",
            )}
          >
            <span>{WEATHER_ICON[c]}</span>
            {c}
          </button>
        ))}
      </div>

      {/* Time of day */}
      <p className="mb-2 text-xs text-text-muted">
        Time of day {autoCycle && <span className="text-accent">· Auto</span>}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {TIMES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setSunPosition(t.pos)}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted transition hover:bg-surface-elevated"
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAutoCycle(!autoCycle)}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-sm transition",
            autoCycle
              ? "border-accent bg-accent/15 text-text"
              : "border-border text-text-muted hover:bg-surface-elevated",
          )}
        >
          Auto cycle
        </button>
      </div>

      {/* Live wallpaper toggle */}
      <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <span className="text-sm">
          Live wallpaper
          <span className="block text-xs text-text-muted">
            Animated aurora, drifting light, and motion.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={liveWallpaper}
          onClick={() => setLiveWallpaper(!liveWallpaper)}
          className={cn(
            "relative h-6 w-11 rounded-full transition",
            liveWallpaper ? "bg-accent" : "bg-border",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
              liveWallpaper ? "left-[22px]" : "left-0.5",
            )}
          />
        </button>
      </label>
    </Section>
  );
}
