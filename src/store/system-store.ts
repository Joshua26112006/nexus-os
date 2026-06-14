/**
 * System store — owns the OS lifecycle (boot → login → desktop) and the
 * active user session. This is the State Store slice for kernel-level system
 * state described in Architecture.md §3.5.
 */

import { create } from "zustand";
import type { SystemPhase, UserProfile } from "@/types";
import { eventBus } from "@/core/event-bus";

interface SystemState {
  phase: SystemPhase;
  user: UserProfile | null;

  /** Called by the boot screen when the boot sequence finishes. */
  completeBoot: () => void;
  /** Sign a user in and move to the desktop. */
  login: (user: UserProfile) => void;
  /** Sign out and return to the login screen. */
  logout: () => void;
  /** Lock the session (returns to a login-style screen). */
  lock: () => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  phase: "booting",
  user: null,

  completeBoot: () => {
    set({ phase: "login" });
    eventBus.emit("system:boot-complete");
  },

  login: (user) => {
    set({ phase: "desktop", user });
    eventBus.emit("system:login", user);
  },

  logout: () => {
    set({ phase: "login", user: null });
    eventBus.emit("system:logout");
  },

  lock: () => {
    set({ phase: "locked" });
    eventBus.emit("system:lock");
  },
}));
