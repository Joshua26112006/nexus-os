"use client";

/**
 * Dynamic wallpaper system (Phase 4 + 5).
 *
 * A living backdrop driven by three systems:
 *  - the selected wallpaper gradient (settings),
 *  - the day/night cycle (environment.sunPosition) which overlays a warm dawn,
 *    bright noon, amber dusk, or deep-blue night tint plus a moving sun/moon,
 *  - the weather (environment.weather) which colour-grades the scene.
 *
 * Live wallpaper mode adds the drifting light blooms and hue breathing; turning
 * it off yields a calm static backdrop. Still works fully offline.
 */

import { useMemo } from "react";
import { useSettingsStore } from "@/store/settings-store";
import {
  useEnvironmentStore,
  timeOfDayFromSun,
} from "@/store/environment-store";
import { WALLPAPERS, DEFAULT_WALLPAPER_ID } from "@/core/constants";

/** Sky-tint overlays for each time of day (layered with screen/overlay blend). */
const TIME_TINT: Record<string, string> = {
  dawn: "linear-gradient(180deg, rgba(251,146,60,0.28), rgba(129,140,248,0.12) 60%, transparent)",
  day: "linear-gradient(180deg, rgba(125,211,252,0.18), transparent 55%)",
  dusk: "linear-gradient(180deg, rgba(244,114,182,0.22), rgba(99,102,241,0.18) 55%, rgba(2,6,23,0.25))",
  night: "linear-gradient(180deg, rgba(2,6,23,0.55), rgba(15,23,42,0.35))",
};

/** Weather colour-grade overlays. */
const WEATHER_GRADE: Record<string, string> = {
  clear: "transparent",
  clouds: "linear-gradient(180deg, rgba(148,163,184,0.18), rgba(100,116,139,0.1))",
  rain: "linear-gradient(180deg, rgba(30,41,59,0.4), rgba(15,23,42,0.5))",
  snow: "linear-gradient(180deg, rgba(226,232,240,0.18), rgba(148,163,184,0.12))",
  storm: "linear-gradient(180deg, rgba(2,6,23,0.55), rgba(30,41,59,0.45))",
  fog: "linear-gradient(180deg, rgba(203,213,225,0.3), rgba(148,163,184,0.22))",
};

export function Wallpaper() {
  const wallpaperId = useSettingsStore((s) => s.wallpaperId);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const sunPosition = useEnvironmentStore((s) => s.sunPosition);
  const weather = useEnvironmentStore((s) => s.weather);
  const liveWallpaper = useEnvironmentStore((s) => s.liveWallpaper);

  const wallpaper = useMemo(
    () =>
      WALLPAPERS.find((w) => w.id === wallpaperId) ??
      WALLPAPERS.find((w) => w.id === DEFAULT_WALLPAPER_ID) ??
      WALLPAPERS[0],
    [wallpaperId],
  );

  const tod = timeOfDayFromSun(sunPosition);
  const animate = !reducedMotion && liveWallpaper;

  // The sun/moon arcs across the sky based on sunPosition (0..1).
  // Map daytime (0.25..0.75) to a left→right arc; show a moon at night.
  const isNight = tod === "night";
  const arc = ((sunPosition - 0.25) / 0.5); // 0 at 6am, 1 at 6pm
  const bodyLeft = `${Math.min(95, Math.max(5, arc * 90 + 5))}%`;
  const bodyTop = `${30 - Math.sin(Math.max(0, Math.min(1, arc)) * Math.PI) * 22 + 8}%`;

  return (
    <div aria-hidden className="absolute inset-0 z-0 overflow-hidden">
      {/* Base gradient. */}
      <div
        key={wallpaper.id}
        className="absolute inset-0 transition-[background] duration-1000 ease-out"
        style={{
          background: wallpaper.css,
          animation: animate ? "hue-breathe 18s ease-in-out infinite" : undefined,
        }}
      />

      {/* Sun / moon celestial body. */}
      <div
        className="absolute h-24 w-24 rounded-full blur-[2px] transition-all duration-1000"
        style={{
          left: bodyLeft,
          top: bodyTop,
          background: isNight
            ? "radial-gradient(circle, rgba(226,232,240,0.95), rgba(148,163,184,0.2) 60%, transparent 70%)"
            : "radial-gradient(circle, rgba(255,247,200,1), rgba(251,191,36,0.5) 50%, transparent 70%)",
          boxShadow: isNight
            ? "0 0 60px 20px rgba(226,232,240,0.25)"
            : "0 0 120px 40px rgba(251,191,36,0.4)",
          opacity: weather.condition === "fog" || weather.condition === "storm" ? 0.3 : 1,
        }}
      />

      {/* Ambient light blooms (live wallpaper only). */}
      {liveWallpaper && (
        <>
          <div
            className="absolute -left-1/4 -top-1/4 h-[80vmax] w-[80vmax] rounded-full opacity-50 mix-blend-screen blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(129,140,248,0.5), rgba(129,140,248,0) 60%)",
              animation: animate ? "bloom-drift 24s ease-in-out infinite" : undefined,
            }}
          />
          <div
            className="absolute -bottom-1/4 -right-1/4 h-[70vmax] w-[70vmax] rounded-full opacity-40 mix-blend-screen blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(192,132,252,0.5), rgba(192,132,252,0) 60%)",
              animation: animate
                ? "bloom-drift-alt 30s ease-in-out infinite"
                : undefined,
            }}
          />
        </>
      )}

      {/* Time-of-day tint. */}
      <div
        className="absolute inset-0 transition-[background] duration-1000 mix-blend-soft-light"
        style={{ background: TIME_TINT[tod] }}
      />

      {/* Weather colour grade. */}
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{ background: WEATHER_GRADE[weather.condition] }}
      />

      {/* Vignette. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 40%, transparent 55%, rgba(2,6,23,0.45) 100%)",
        }}
      />

      {/* Film grain. */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_DATA_URL, backgroundSize: "180px 180px" }}
      />
    </div>
  );
}

const GRAIN_DATA_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
