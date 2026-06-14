"use client";

/**
 * AI Workspace Builder — the signature surface.
 *
 * A glassy launcher that turns an intent into a fully arranged desktop. Pick a
 * preset (each shows a live mini-preview of its tiling layout and the apps it
 * opens) or describe your own ("a podcasting workspace") and let the matcher
 * find the closest fit. Invoked via Ctrl+Shift+W, the top bar, the AI, or
 * search.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useShellUiStore } from "@/store/shell-ui-store";
import { useSettingsStore } from "@/store/settings-store";
import { getApp } from "@/core/app-registry";
import {
  WORKSPACES,
  computeTiles,
  launchWorkspace,
  launchWorkspaceByText,
  type Workspace,
  type LayoutKind,
} from "@/services/workspaces/workspaces";

export function WorkspaceBuilder() {
  const open = useShellUiStore((s) => s.workspaceBuilderOpen);
  const close = useShellUiStore((s) => s.closeWorkspaceBuilder);
  const toggle = useShellUiStore((s) => s.toggleWorkspaceBuilder);
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);

  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);

  // Ctrl+Shift+W toggles; Esc closes.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "w" || e.key === "W")) {
        e.preventDefault();
        toggle();
      } else if (e.key === "Escape" && useShellUiStore.getState().workspaceBuilderOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle, close]);

  useEffect(() => {
    if (open) { setQuery(""); setFlash(null); }
  }, [open]);

  const runWorkspace = (ws: Workspace) => {
    const res = launchWorkspace(ws);
    setFlash({ ok: res.ok, text: res.message });
    setTimeout(close, 700);
  };

  const runText = () => {
    if (!query.trim()) return;
    const res = launchWorkspaceByText(query);
    setFlash({ ok: res.ok, text: res.message });
    if (res.ok) setTimeout(close, 700);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[3200] flex items-start justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.15 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={close} aria-hidden />

          <motion.div
            role="dialog"
            aria-label="Workspace Builder"
            initial={reducedMotion ? false : { opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="glass glass-sheen relative mt-[6vh] flex max-h-[84vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl text-white shadow-window"
            style={{
              boxShadow:
                "0 32px 80px -16px rgb(2 6 23 / 0.7), 0 0 0 1px rgb(var(--color-accent) / 0.25), 0 0 60px -10px rgb(var(--color-accent) / 0.4)",
            }}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-white/10 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="text-xl text-accent">✦</span>
                <h2 className="text-lg font-semibold">AI Workspace Builder</h2>
                <kbd className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50 ring-1 ring-white/15">
                  Esc
                </kbd>
              </div>
              <p className="mt-0.5 text-sm text-white/55">
                Describe what you&apos;re doing — NEXUS opens the right apps and arranges them.
              </p>

              {/* Describe-your-own input */}
              <div className="mt-3 flex items-center gap-2">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runText()}
                  placeholder="e.g. create a frontend developer workspace"
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={runText}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold transition hover:brightness-110"
                >
                  Build
                </button>
              </div>

              {flash && (
                <p className={`mt-2 text-sm ${flash.ok ? "text-emerald-400" : "text-rose-400"}`}>
                  {flash.ok ? "✓ " : "✕ "}{flash.text}
                </p>
              )}
            </div>

            {/* Presets */}
            <div className="nexus-scroll grid grid-cols-1 gap-3 overflow-auto p-5 sm:grid-cols-2 lg:grid-cols-3">
              {WORKSPACES.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => runWorkspace(ws)}
                  className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-accent/60 hover:bg-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl text-xl" style={{ background: `${ws.accent ?? "#6366f1"}33` }}>
                      {ws.icon}
                    </span>
                    <span className="text-sm font-semibold">{ws.name}</span>
                    <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] capitalize text-white/50">
                      {ws.layout.replace("-", " ")}
                    </span>
                  </div>

                  <LayoutPreview layout={ws.layout} count={ws.apps.length} accent={ws.accent ?? "#6366f1"} />

                  <p className="text-xs leading-snug text-white/55">{ws.description}</p>

                  <div className="flex flex-wrap gap-1">
                    {ws.widgets?.map((w) => (
                      <span key={w} className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] text-amber-300">
                        {w} widget
                      </span>
                    ))}
                    {ws.apps.map((id) => (
                      <span key={id} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/70">
                        {getApp(id)?.icon} {getApp(id)?.name ?? id}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A tiny live diagram of how the layout will tile, using the real tiling math. */
function LayoutPreview({ layout, count, accent }: { layout: LayoutKind; count: number; accent: string }) {
  const W = 220;
  const H = 70;
  const tiles = computeTiles(count, layout, { x: 0, y: 0, width: W, height: H });
  return (
    <div className="relative overflow-hidden rounded-lg bg-black/30" style={{ height: H }}>
      {tiles.map((t, i) => (
        <div
          key={i}
          className="absolute rounded-[3px] transition group-hover:brightness-125"
          style={{
            left: t.x + 2,
            top: t.y + 2,
            width: t.width - 4,
            height: t.height - 4,
            background: i === 0 ? accent : `${accent}66`,
            opacity: i === 0 ? 0.9 : 0.6,
          }}
        />
      ))}
    </div>
  );
}
