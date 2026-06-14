/**
 * Pending-intent store.
 *
 * Decouples the AI (and command handlers) from app internals. When a command
 * wants an app to do something on launch — e.g. "create a note titled X" or
 * "evaluate 54 * 12" — it stashes a typed payload here keyed by appId. The app
 * consumes (and clears) the payload when it mounts/receives focus.
 *
 * This keeps apps ignorant of the AI: they simply honour any pending intent.
 */

import { create } from "zustand";

/** Intent payloads, discriminated by which app consumes them. */
export type AppIntent =
  | { app: "notes"; action: "create"; title: string; body: string }
  | { app: "calculator"; action: "evaluate"; expression: string };

interface IntentState {
  /** At most one pending intent per app id. */
  pending: Partial<Record<AppIntent["app"], AppIntent>>;

  /** Queue an intent for an app to consume on mount. */
  setIntent: (intent: AppIntent) => void;
  /** Read and clear the pending intent for an app (one-shot). */
  consumeIntent: <A extends AppIntent["app"]>(
    app: A,
  ) => Extract<AppIntent, { app: A }> | null;
}

export const useIntentStore = create<IntentState>((set, get) => ({
  pending: {},

  setIntent: (intent) => {
    set((state) => ({ pending: { ...state.pending, [intent.app]: intent } }));
  },

  consumeIntent: (app) => {
    const intent = get().pending[app];
    if (!intent) return null;
    set((state) => {
      const next = { ...state.pending };
      delete next[app];
      return { pending: next };
    });
    return intent as Extract<AppIntent, { app: typeof app }>;
  },
}));
