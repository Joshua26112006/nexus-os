"use client";

/**
 * WidgetLayer — renders every visible desktop widget inside its draggable
 * shell. Sits above the wallpaper/particles but below windows.
 */

import { AnimatePresence } from "framer-motion";
import { useWidgetStore, type WidgetType } from "@/store/widget-store";
import { WidgetShell } from "./WidgetShell";
import { ClockWidget } from "./ClockWidget";
import { WeatherWidget } from "./WeatherWidget";
import { CalendarWidget } from "./CalendarWidget";
import { SystemWidget } from "./SystemWidget";
import { StockWidget } from "./StockWidget";
import { NewsWidget } from "./NewsWidget";

const BODIES: Record<WidgetType, () => React.ReactElement> = {
  clock: ClockWidget,
  weather: WeatherWidget,
  calendar: CalendarWidget,
  system: SystemWidget,
  stock: StockWidget,
  news: NewsWidget,
};

/** Widths tuned per widget for a tidy layout. */
const WIDTHS: Partial<Record<WidgetType, number>> = {
  clock: 180,
  calendar: 240,
  stock: 260,
  news: 260,
  system: 240,
};

export function WidgetLayer() {
  const widgets = useWidgetStore((s) => s.widgets);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <div className="pointer-events-none h-full w-full [&>*]:pointer-events-auto">
        <AnimatePresence>
          {widgets
            .filter((w) => w.visible)
            .map((w) => {
              const Body = BODIES[w.type];
              return (
                <WidgetShell
                  key={w.id}
                  id={w.id}
                  type={w.type}
                  x={w.x}
                  y={w.y}
                  width={WIDTHS[w.type]}
                >
                  <Body />
                </WidgetShell>
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
}
