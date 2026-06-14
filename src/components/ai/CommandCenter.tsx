"use client";

/**
 * AI Command Center (Architecture.md §7 — the differentiator).
 *
 * A Spotlight-like floating palette, invoked globally with Ctrl+Space (AI-1).
 * Natural-language input is classified and executed via the orchestrator;
 * suggestions/autocomplete and recent history make it keyboard-first.
 *
 * Keyboard model:
 *  - Ctrl+Space toggles · Esc closes
 *  - ↑/↓ move through suggestions · Enter runs the selected suggestion, or
 *    submits the typed text if nothing is highlighted
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAiStore } from "@/store/ai-store";
import { useSettingsStore } from "@/store/settings-store";
import { useWindowStore } from "@/store/window-store";
import { orchestrator } from "@/ai/orchestrator";
import type { Suggestion } from "@/ai/types";

export function CommandCenter() {
  const open = useAiStore((s) => s.open);
  const closePalette = useAiStore((s) => s.closePalette);
  const togglePalette = useAiStore((s) => s.togglePalette);
  const submit = useAiStore((s) => s.submit);
  const runIntent = useAiStore((s) => s.runIntent);
  const busy = useAiStore((s) => s.busy);
  const history = useAiStore((s) => s.history);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [lastResult, setLastResult] = useState<{ ok: boolean; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkeys: Ctrl+Space toggles (AI-1); Esc closes from anywhere, even
  // if focus hasn't landed on the input yet.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        togglePalette();
      } else if (e.key === "Escape" && useAiStore.getState().open) {
        e.preventDefault();
        closePalette();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePalette, closePalette]);

  // Focus the input and reset transient state whenever the palette opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setLastResult(null);
      // Focus after the open animation begins.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Suggestions for the current query (memoised; provider is synchronous here).
  const suggestions = useMemo<Suggestion[]>(() => {
    if (!open) return [];
    const windows = useWindowStore.getState().windows;
    const focused = windows.find((w) => w.focused) ?? null;
    return orchestrator.suggest(query, {
      runningApps: Array.from(new Set(windows.map((w) => w.appId))),
      focusedAppId: focused?.appId ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  // Keep the selection index in range as the list changes.
  useEffect(() => {
    setSelected((s) => Math.min(s, Math.max(0, suggestions.length - 1)));
  }, [suggestions.length]);

  const runChosen = useCallback(
    async (suggestion: Suggestion) => {
      const turn = await runIntent(suggestion.text, suggestion.intent);
      setLastResult({ ok: turn.ok, text: turn.response });
      setQuery("");
      if (turn.ok) {
        // Close shortly after a successful action so the user sees the result.
        setTimeout(() => closePalette(), 650);
      }
    },
    [runIntent, closePalette],
  );

  const submitTyped = useCallback(async () => {
    if (!query.trim()) return;
    const turn = await submit(query);
    setLastResult({ ok: turn.ok, text: turn.response });
    setQuery("");
    if (turn.ok) setTimeout(() => closePalette(), 650);
  }, [query, submit, closePalette]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closePalette();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Tab" && suggestions[selected]) {
      // Tab completes the highlighted suggestion into the input.
      e.preventDefault();
      setQuery(suggestions[selected].text);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[selected] && !query.trim()) {
        runChosen(suggestions[selected]);
      } else if (suggestions[selected] && query.trim() && isExactish(query, suggestions[selected])) {
        runChosen(suggestions[selected]);
      } else {
        submitTyped();
      }
    }
  };

  const recent = history.slice(0, 4);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-start justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.15 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closePalette}
            aria-hidden
          />

          {/* Palette */}
          <motion.div
            role="dialog"
            aria-label="AI Command Center"
            initial={reducedMotion ? false : { opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-sheen relative mt-[12vh] w-[92%] max-w-xl overflow-hidden rounded-3xl shadow-window"
            style={{
              boxShadow:
                "0 32px 80px -16px rgb(2 6 23 / 0.7), 0 0 0 1px rgb(var(--color-accent) / 0.25), 0 0 48px -8px rgb(var(--color-accent) / 0.4)",
            }}
          >
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
              <motion.span
                className="text-xl text-accent"
                animate={busy ? { rotate: 360 } : { rotate: 0 }}
                transition={busy ? { repeat: Infinity, duration: 1.4, ease: "linear" } : {}}
              >
                ✦
              </motion.span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask NEXUS… (e.g. open notes, calculate 54 * 12)"
                spellCheck={false}
                aria-label="AI command input"
                className="flex-1 bg-transparent text-base text-text placeholder:text-text-muted focus:outline-none"
              />
              {busy && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              )}
              <kbd className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-muted ring-1 ring-border">
                Esc
              </kbd>
            </div>

            {/* Last result banner */}
            {lastResult && (
              <div
                className={`px-4 py-2 text-sm ${
                  lastResult.ok ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {lastResult.ok ? "✓ " : "✕ "}
                {lastResult.text}
              </div>
            )}

            {/* Suggestions */}
            <ul className="max-h-72 overflow-auto py-1 nexus-scroll">
              {suggestions.length === 0 && (
                <li className="px-4 py-3 text-sm text-text-muted">
                  Press Enter to run “{query}”.
                </li>
              )}
              {suggestions.map((s, i) => (
                <li key={s.text}>
                  <button
                    type="button"
                    onMouseEnter={() => setSelected(i)}
                    onClick={() => runChosen(s)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      i === selected ? "bg-accent/15" : "hover:bg-surface-elevated"
                    }`}
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className="flex-1">
                      <span className="block text-sm text-text">{s.text}</span>
                      <span className="block text-xs text-text-muted">{s.label}</span>
                    </span>
                    {i === selected && (
                      <kbd className="rounded bg-surface-elevated px-1.5 py-0.5 text-[10px] text-text-muted ring-1 ring-border">
                        ↵
                      </kbd>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {/* Recent history */}
            {recent.length > 0 && (
              <div className="border-t border-border px-4 py-2">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-text-muted">
                  Recent
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((turn) => (
                    <button
                      key={turn.id}
                      type="button"
                      onClick={() => setQuery(turn.input)}
                      className="rounded-full bg-surface-elevated px-2.5 py-1 text-xs text-text-muted transition hover:text-text"
                    >
                      {turn.ok ? "" : "✕ "}
                      {turn.input}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Heuristic: does the typed query essentially match the highlighted suggestion? */
function isExactish(query: string, suggestion: Suggestion): boolean {
  return suggestion.text.toLowerCase().startsWith(query.trim().toLowerCase());
}
