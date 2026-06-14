/**
 * Environment store — the "living desktop" state.
 *
 * Owns three ambient systems that make the desktop feel alive:
 *  - Day/night cycle: a 0–1 "sky position" derived from the real clock (or
 *    overridden manually) that tints the wallpaper from dawn → noon → dusk →
 *    night.
 *  - Weather: a simulated condition (clear/clouds/rain/snow/storm/fog) that
 *    drives particle overlays and colour grading.
 *  - Live wallpaper: toggles extra motion (animated aurora, parallax blooms).
 *
 * All of this is local and simulated — no external APIs — so it works offline.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WeatherCondition =
  | "clear"
  | "clouds"
  | "rain"
  | "snow"
  | "storm"
  | "fog";

export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export interface WeatherState {
  condition: WeatherCondition;
  /** Temperature in °C (simulated). */
  temperature: number;
  /** A short location label. */
  location: string;
  humidity: number;
  windKph: number;
}

interface EnvironmentState {
  /** When true, time-of-day follows the real clock; else it's manual. */
  autoCycle: boolean;
  /** 0..1 around the day. 0/1 = midnight, 0.5 = noon. */
  sunPosition: number;
  weather: WeatherState;
  liveWallpaper: boolean;

  setAutoCycle: (auto: boolean) => void;
  setSunPosition: (pos: number) => void;
  setWeather: (condition: WeatherCondition) => void;
  setLiveWallpaper: (on: boolean) => void;
  /** Recompute sunPosition from the current time (used when autoCycle). */
  tickFromClock: () => void;
}

/** Map a Date to a 0..1 sun position (0 = midnight). */
function sunPositionFromDate(d: Date): number {
  const minutes = d.getHours() * 60 + d.getMinutes();
  return minutes / 1440;
}

/** Derive a coarse time-of-day bucket from a 0..1 sun position. */
export function timeOfDayFromSun(pos: number): TimeOfDay {
  const h = pos * 24;
  if (h >= 5 && h < 8) return "dawn";
  if (h >= 8 && h < 18) return "day";
  if (h >= 18 && h < 21) return "dusk";
  return "night";
}

/** Simulated weather presets with plausible numbers. */
const WEATHER_PRESETS: Record<WeatherCondition, Omit<WeatherState, "location">> = {
  clear: { condition: "clear", temperature: 24, humidity: 38, windKph: 8 },
  clouds: { condition: "clouds", temperature: 19, humidity: 55, windKph: 14 },
  rain: { condition: "rain", temperature: 14, humidity: 82, windKph: 22 },
  snow: { condition: "snow", temperature: -3, humidity: 76, windKph: 12 },
  storm: { condition: "storm", temperature: 16, humidity: 88, windKph: 38 },
  fog: { condition: "fog", temperature: 11, humidity: 94, windKph: 5 },
};

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set) => ({
      autoCycle: true,
      sunPosition: sunPositionFromDate(new Date()),
      weather: { ...WEATHER_PRESETS.clear, location: "Neo Kyoto" },
      liveWallpaper: true,

      setAutoCycle: (auto) =>
        set((s) => ({
          autoCycle: auto,
          sunPosition: auto ? sunPositionFromDate(new Date()) : s.sunPosition,
        })),

      setSunPosition: (pos) =>
        set({ autoCycle: false, sunPosition: Math.min(1, Math.max(0, pos)) }),

      setWeather: (condition) =>
        set((s) => ({
          weather: { ...WEATHER_PRESETS[condition], location: s.weather.location },
        })),

      setLiveWallpaper: (on) => set({ liveWallpaper: on }),

      tickFromClock: () =>
        set((s) =>
          s.autoCycle ? { sunPosition: sunPositionFromDate(new Date()) } : s,
        ),
    }),
    {
      name: "nexus.environment",
      version: 1,
      partialize: (s) => ({
        autoCycle: s.autoCycle,
        sunPosition: s.sunPosition,
        weather: s.weather,
        liveWallpaper: s.liveWallpaper,
      }),
    },
  ),
);

/** The list of conditions, for UIs that let the user pick weather. */
export const WEATHER_CONDITIONS: WeatherCondition[] = [
  "clear",
  "clouds",
  "rain",
  "snow",
  "storm",
  "fog",
];

/** A glyph for each condition (used by widgets and the companion). */
export const WEATHER_ICON: Record<WeatherCondition, string> = {
  clear: "☀️",
  clouds: "☁️",
  rain: "🌧️",
  snow: "❄️",
  storm: "⛈️",
  fog: "🌫️",
};
