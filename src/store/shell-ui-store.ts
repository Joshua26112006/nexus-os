/**
 * Shell UI store — open/close state for global overlays that aren't windows:
 * the Command Palette (Ctrl+K), the Keyboard Shortcut overlay (?), and the
 * hidden Developer Mode flag.
 *
 * Keeping these here lets any surface (commands, companion, easter eggs) toggle
 * them without prop-drilling.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ShellUiState {
  commandPaletteOpen: boolean;
  shortcutsOpen: boolean;
  workspaceBuilderOpen: boolean;
  /** Hidden developer mode — unlocked via an easter egg or command. */
  devMode: boolean;

  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  openShortcuts: () => void;
  closeShortcuts: () => void;
  toggleShortcuts: () => void;

  openWorkspaceBuilder: () => void;
  closeWorkspaceBuilder: () => void;
  toggleWorkspaceBuilder: () => void;

  setDevMode: (on: boolean) => void;
  toggleDevMode: () => void;
}

export const useShellUiStore = create<ShellUiState>()(
  persist(
    (set) => ({
      commandPaletteOpen: false,
      shortcutsOpen: false,
      workspaceBuilderOpen: false,
      devMode: false,

      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () =>
        set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      openShortcuts: () => set({ shortcutsOpen: true }),
      closeShortcuts: () => set({ shortcutsOpen: false }),
      toggleShortcuts: () => set((s) => ({ shortcutsOpen: !s.shortcutsOpen })),

      openWorkspaceBuilder: () => set({ workspaceBuilderOpen: true }),
      closeWorkspaceBuilder: () => set({ workspaceBuilderOpen: false }),
      toggleWorkspaceBuilder: () =>
        set((s) => ({ workspaceBuilderOpen: !s.workspaceBuilderOpen })),

      setDevMode: (on) => set({ devMode: on }),
      toggleDevMode: () => set((s) => ({ devMode: !s.devMode })),
    }),
    {
      name: "nexus.shell-ui",
      version: 1,
      // Only devMode is worth persisting; overlays are session state.
      partialize: (s) => ({ devMode: s.devMode }),
    },
  ),
);
