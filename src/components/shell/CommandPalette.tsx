"use client";

/**
 * Command Palette (Ctrl+K) — a fast, keyboard-first launcher with Global
 * Search across apps, commands, and files (services/search/global-search).
 *
 * Distinct from the AI Command Center (Ctrl+Space, natural language): this is a
 * deterministic fuzzy launcher in the spirit of VS Code / Raycast.
 */

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShellUiStore } from "@/store/shell-ui-store";
import { useSettingsStore } from "@/store/settings-store";
import {
  searchEverything,
  type SearchResult,
  type SearchKind,
} from "@/services/search/global-search";

const KIND_LABEL: Record<SearchKind, string> = {
  app: "App",
  command: "Command",
  file: "File",
  setting: "Setting",
};

export function CommandPalette() {
  const open = useShellUiStore((s) => s.commandPaletteOpen);
  const close = useShellUiStore((s) => s.closeCommandPalette);
  const toggle = useShellUiStore((s) => s.toggleCommandPalette);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);

  // Ctrl+K toggles from anywhere; Esc closes.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && useShellUiStore.getState().commandPaletteOpen) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, close]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      // Reward discovering global search.
      import("@/store/achievement-store").then((m) =>
        m.useAchievementStore.getState().unlock("searcher"),
      );
    }
  }, [open]);

  const results = useMemo<SearchResult[]>(
    () => (open ? searchEverything(query) : []),
    [query, open],
  );

  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, results.length - 1)));
  }, [results.length]);

  const runResult = async (r: SearchResult) => {
    await r.run();
    close();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      e.preventDefault();
      runResult(results[selected]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[3100] flex items-start justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.15 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={close} aria-hidden />

          <motion.div
            role="dialog"
            aria-label="Command Palette"
            initial={reducedMotion ? false : { opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-sheen relative mt-[12vh] w-[92%] max-w-xl overflow-hidden rounded-2xl shadow-window"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5">
              <span className="text-text-muted">⌘</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search apps, commands, files…"
                aria-label="Global search"
                spellCheck={false}
                className="flex-1 bg-transparent text-base text-text placeholder:text-text-muted focus:outline-none"
              />
              <kbd className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-muted ring-1 ring-border">
                Esc
              </kbd>
            </div>

            <ul className="max-h-80 overflow-auto py-1 nexus-scroll">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-text-muted">
                  No results for “{query}”.
                </li>
              )}
              {results.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => runResult(r)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      i === selected ? "bg-accent/15" : "hover:bg-white/5"
                    }`}
                  >
                    <span className="text-lg">{r.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text">{r.title}</span>
                      <span className="block truncate text-xs text-text-muted">
                        {r.subtitle}
                      </span>
                    </span>
                    <span className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-muted ring-1 ring-border">
                      {KIND_LABEL[r.kind]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
