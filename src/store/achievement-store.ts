/**
 * Achievement system.
 *
 * A catalogue of unlockable achievements plus the set the user has earned.
 * Unlocks are persisted. The store wires itself to the event bus (see
 * `initAchievements`) so progress is tracked passively as the user explores —
 * opening apps, using the AI, finding secrets, etc.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { eventBus } from "@/core/event-bus";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Secret achievements are hidden until unlocked. */
  secret?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-boot", title: "Hello, NEXUS", description: "Sign in for the first time", icon: "🚀" },
  { id: "first-window", title: "Window Shopper", description: "Open your first app", icon: "🪟" },
  { id: "multitasker", title: "Multitasker", description: "Open 4 windows at once", icon: "🎛️" },
  { id: "ai-user", title: "Talk to the Machine", description: "Run an AI command", icon: "✦" },
  { id: "power-user", title: "Power User", description: "Run 10 AI commands", icon: "⚡" },
  { id: "searcher", title: "Spotlight", description: "Use the Command Palette", icon: "🔍" },
  { id: "decorator", title: "Interior Designer", description: "Change the wallpaper", icon: "🖼️" },
  { id: "meteorologist", title: "Storm Chaser", description: "Trigger a thunderstorm", icon: "⛈️" },
  { id: "konami", title: "The Old Ways", description: "Enter the Konami code", icon: "🕹️", secret: true },
  { id: "developer", title: "Behind the Curtain", description: "Unlock Developer Mode", icon: "🛠️", secret: true },
];

interface AchievementState {
  unlocked: Record<string, number>; // id -> unlock timestamp
  /** Transient queue of just-unlocked achievements for the toast UI. */
  toastQueue: Achievement[];
  aiCommandCount: number;

  unlock: (id: string) => void;
  dismissToast: (id: string) => void;
  incrementAiCommands: () => void;
  isUnlocked: (id: string) => boolean;
}

export const useAchievementStore = create<AchievementState>()(
  persist(
    (set, get) => ({
      unlocked: {},
      toastQueue: [],
      aiCommandCount: 0,

      unlock: (id) => {
        if (get().unlocked[id]) return; // already earned
        const achievement = ACHIEVEMENTS.find((a) => a.id === id);
        if (!achievement) return;
        set((s) => ({
          unlocked: { ...s.unlocked, [id]: Date.now() },
          toastQueue: [...s.toastQueue, achievement],
        }));
        eventBus.emit("achievement:unlock", { id });
      },

      dismissToast: (id) =>
        set((s) => ({ toastQueue: s.toastQueue.filter((a) => a.id !== id) })),

      incrementAiCommands: () => {
        const next = get().aiCommandCount + 1;
        set({ aiCommandCount: next });
        get().unlock("ai-user");
        if (next >= 10) get().unlock("power-user");
      },

      isUnlocked: (id) => Boolean(get().unlocked[id]),
    }),
    {
      name: "nexus.achievements",
      version: 1,
      partialize: (s) => ({
        unlocked: s.unlocked,
        aiCommandCount: s.aiCommandCount,
      }),
    },
  ),
);

let initialised = false;

/** Wire achievement tracking to OS events. Call once at desktop mount. */
export function initAchievements(): void {
  if (initialised) return;
  initialised = true;
  const store = useAchievementStore.getState;

  eventBus.on("system:login", () => store().unlock("first-boot"));
  eventBus.on("window:open", () => store().unlock("first-window"));
  eventBus.on("settings:changed", ({ key }) => {
    if (key === "wallpaperId") store().unlock("decorator");
  });
}
