/**
 * Widget store — interactive desktop widgets.
 *
 * Widgets are draggable cards pinned to the desktop (below windows). The store
 * owns which widgets exist, whether each is shown, and its position. Positions
 * persist so a user's arranged desktop survives reloads.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WidgetType =
  | "clock"
  | "weather"
  | "calendar"
  | "system"
  | "stock"
  | "news";

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  visible: boolean;
}

interface WidgetState {
  widgets: WidgetInstance[];
  moveWidget: (id: string, x: number, y: number) => void;
  toggleWidget: (type: WidgetType) => void;
  isVisible: (type: WidgetType) => boolean;
  resetWidgets: () => void;
}

/** Default desktop arrangement — a tasteful right-hand column (icons go left). */
function defaultWidgets(): WidgetInstance[] {
  return [
    { id: "w-clock", type: "clock", x: 1200, y: 70, visible: true },
    { id: "w-weather", type: "weather", x: 1160, y: 250, visible: true },
    { id: "w-system", type: "system", x: 1160, y: 460, visible: true },
    { id: "w-calendar", type: "calendar", x: 0, y: 0, visible: false },
    { id: "w-stock", type: "stock", x: 0, y: 0, visible: false },
    { id: "w-news", type: "news", x: 0, y: 0, visible: false },
  ];
}

/** Sensible spawn position for a widget being turned on for the first time. */
function spawnPosition(index: number): { x: number; y: number } {
  return { x: 300 + (index % 3) * 280, y: 90 + Math.floor(index / 3) * 200 };
}

export const useWidgetStore = create<WidgetState>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets(),

      moveWidget: (id, x, y) =>
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === id ? { ...w, x: Math.max(0, x), y: Math.max(40, y) } : w,
          ),
        })),

      toggleWidget: (type) =>
        set((state) => {
          let spawnIndex = 0;
          return {
            widgets: state.widgets.map((w) => {
              if (w.type !== type) return w;
              const turningOn = !w.visible;
              const pos =
                turningOn && w.x === 0 && w.y === 0
                  ? spawnPosition(spawnIndex++)
                  : { x: w.x, y: w.y };
              return { ...w, visible: turningOn, ...pos };
            }),
          };
        }),

      isVisible: (type) => get().widgets.some((w) => w.type === type && w.visible),

      resetWidgets: () => set({ widgets: defaultWidgets() }),
    }),
    {
      name: "nexus.widgets",
      version: 1,
    },
  ),
);

export const WIDGET_META: Record<WidgetType, { name: string; icon: string }> = {
  clock: { name: "Clock", icon: "🕐" },
  weather: { name: "Weather", icon: "🌤️" },
  calendar: { name: "Calendar", icon: "📅" },
  system: { name: "System Monitor", icon: "📊" },
  stock: { name: "Stocks", icon: "📈" },
  news: { name: "News", icon: "📰" },
};
