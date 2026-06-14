"use client";

/**
 * Keyboard Shortcut Overlay — press "?" anywhere (outside a text field) to see
 * every global shortcut. A polished cheat-sheet that signals depth.
 */

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShellUiStore } from "@/store/shell-ui-store";
import { useSettingsStore } from "@/store/settings-store";

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: "AI & Search",
    items: [
      ["Ctrl + Space", "Open AI Command Center"],
      ["Ctrl + K", "Command Palette / Global Search"],
      ["?", "This shortcut overlay"],
    ],
  },
  {
    title: "Windows",
    items: [
      ["Drag title bar", "Move window"],
      ["Drag edges/corners", "Resize window"],
      ["Double-click title", "Maximize / restore"],
    ],
  },
  {
    title: "Desktop",
    items: [
      ["Click dock icon", "Launch or focus an app"],
      ["Drag a widget", "Rearrange the desktop"],
      ["↑ ↑ ↓ ↓ ← → ← → B A", "A little surprise…"],
    ],
  },
];

export function ShortcutOverlay() {
  const open = useShellUiStore((s) => s.shortcutsOpen);
  const close = useShellUiStore((s) => s.closeShortcuts);
  const toggle = useShellUiStore((s) => s.toggleShortcuts);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas.
      const t = e.target as HTMLElement;
      const typing =
        t?.tagName === "INPUT" ||
        t?.tagName === "TEXTAREA" ||
        t?.isContentEditable;
      if (e.key === "?" && !typing) {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && useShellUiStore.getState().shortcutsOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[3100] flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.15 }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} aria-hidden />

          <motion.div
            role="dialog"
            aria-label="Keyboard shortcuts"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
            className="glass glass-sheen relative w-full max-w-2xl rounded-3xl p-7 text-white shadow-window"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-full bg-white/10 px-2 py-0.5 text-sm text-white/70 ring-1 ring-white/20 hover:bg-white/20"
              >
                Esc
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">
                    {group.title}
                  </p>
                  <ul className="space-y-2">
                    {group.items.map(([keys, desc]) => (
                      <li key={desc} className="text-sm">
                        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white ring-1 ring-white/15">
                          {keys}
                        </kbd>
                        <span className="mt-0.5 block text-xs text-white/60">{desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
