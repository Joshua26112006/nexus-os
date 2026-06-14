/**
 * AI Command Center store.
 *
 * Owns the palette's open/closed state and the conversation history. History is
 * persisted (AI-7) so past commands are available across reloads. Execution
 * itself is delegated to the orchestrator.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AiTurn } from "@/ai/types";
import { orchestrator } from "@/ai/orchestrator";
import { useWindowStore } from "@/store/window-store";
import { useAchievementStore } from "@/store/achievement-store";

/** Build the context the provider uses to disambiguate. */
function buildContext() {
  const windows = useWindowStore.getState().windows;
  const focused = windows.find((w) => w.focused) ?? null;
  return {
    runningApps: Array.from(new Set(windows.map((w) => w.appId))),
    focusedAppId: focused?.appId ?? null,
  };
}

interface AiState {
  open: boolean;
  history: AiTurn[];
  /** True while a command is being processed. */
  busy: boolean;

  openPalette: () => void;
  closePalette: () => void;
  togglePalette: () => void;

  /** Submit a natural-language command. */
  submit: (input: string) => Promise<AiTurn>;
  /** Run a pre-resolved intent (chosen suggestion). */
  runIntent: (input: string, intent: NonNullable<AiTurn["intent"]>) => Promise<AiTurn>;
  clearHistory: () => void;
}

export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      open: false,
      history: [],
      busy: false,

      openPalette: () => set({ open: true }),
      closePalette: () => set({ open: false }),
      togglePalette: () => set((s) => ({ open: !s.open })),

      submit: async (input) => {
        set({ busy: true });
        const turn = await orchestrator.process(input, buildContext());
        set((s) => ({ history: [turn, ...s.history].slice(0, 50), busy: false }));
        if (turn.ok) useAchievementStore.getState().incrementAiCommands();
        return turn;
      },

      runIntent: async (input, intent) => {
        set({ busy: true });
        const turn = await orchestrator.runIntent(input, intent);
        set((s) => ({ history: [turn, ...s.history].slice(0, 50), busy: false }));
        if (turn.ok) useAchievementStore.getState().incrementAiCommands();
        return turn;
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: "nexus.ai",
      version: 1,
      // Persist only history — open/busy are session state.
      partialize: (s) => ({ history: s.history }),
    },
  ),
);
