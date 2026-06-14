"use client";

/** Weather widget — reflects the live environment weather (simulated). */

import {
  useEnvironmentStore,
  WEATHER_ICON,
  WEATHER_CONDITIONS,
} from "@/store/environment-store";

const LABEL: Record<string, string> = {
  clear: "Clear",
  clouds: "Cloudy",
  rain: "Rain",
  snow: "Snow",
  storm: "Thunderstorm",
  fog: "Fog",
};

export function WeatherWidget() {
  const weather = useEnvironmentStore((s) => s.weather);
  const setWeather = useEnvironmentStore((s) => s.setWeather);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-semibold tabular-nums">
            {weather.temperature}°
          </p>
          <p className="text-xs text-white/60">{weather.location}</p>
        </div>
        <span className="text-5xl">{WEATHER_ICON[weather.condition]}</span>
      </div>

      <p className="text-sm font-medium">{LABEL[weather.condition]}</p>

      <div className="flex justify-between text-xs text-white/55">
        <span>💧 {weather.humidity}%</span>
        <span>💨 {weather.windKph} km/h</span>
      </div>

      {/* Quick weather switcher — drives the whole desktop's weather. */}
      <div className="flex flex-wrap gap-1 pt-1">
        {WEATHER_CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Set weather: ${LABEL[c]}`}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setWeather(c)}
            className={`rounded-md px-1.5 py-0.5 text-sm transition ${
              weather.condition === c
                ? "bg-white/25 ring-1 ring-white/40"
                : "bg-white/5 hover:bg-white/15"
            }`}
          >
            {WEATHER_ICON[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
