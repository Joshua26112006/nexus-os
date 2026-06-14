"use client";

/**
 * AI Workflow Builder — compose an automation as a vertical chain of nodes
 * (trigger → steps → output). Add nodes from a palette, reorder, and "run" the
 * workflow to watch each step light up in sequence. A visual, satisfying way to
 * design AI pipelines.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Node {
  id: string;
  type: string;
  icon: string;
  label: string;
}

const PALETTE: Omit<Node, "id">[] = [
  { type: "trigger", icon: "⚡", label: "On new file" },
  { type: "ai", icon: "✦", label: "Summarize with AI" },
  { type: "ai", icon: "🌐", label: "Translate" },
  { type: "transform", icon: "🔀", label: "Extract keywords" },
  { type: "transform", icon: "🏷️", label: "Classify sentiment" },
  { type: "action", icon: "📨", label: "Send notification" },
  { type: "action", icon: "💾", label: "Save to Notes" },
  { type: "action", icon: "📊", label: "Append to sheet" },
];

const uid = () => Math.random().toString(36).slice(2, 9);

export function WorkflowApp() {
  const [nodes, setNodes] = useState<Node[]>([
    { id: uid(), type: "trigger", icon: "⚡", label: "On new file" },
    { id: uid(), type: "ai", icon: "✦", label: "Summarize with AI" },
    { id: uid(), type: "action", icon: "💾", label: "Save to Notes" },
  ]);
  const [running, setRunning] = useState<number>(-1);

  const add = (n: Omit<Node, "id">) => setNodes((list) => [...list, { ...n, id: uid() }]);
  const remove = (id: string) => setNodes((list) => list.filter((n) => n.id !== id));

  const run = async () => {
    for (let i = 0; i < nodes.length; i++) {
      setRunning(i);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 600));
    }
    setRunning(nodes.length); // done
    setTimeout(() => setRunning(-1), 800);
  };

  return (
    <div className="flex h-full w-full bg-bg text-text">
      {/* Palette */}
      <div className="w-56 shrink-0 border-r border-border bg-surface p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Nodes</p>
        <div className="space-y-1.5">
          {PALETTE.map((n) => (
            <button
              key={n.label}
              type="button"
              onClick={() => add(n)}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface-elevated px-2.5 py-2 text-left text-sm transition hover:border-accent"
            >
              <span>{n.icon}</span>
              <span className="flex-1">{n.label}</span>
              <span className="text-text-muted">＋</span>
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-3">
          <span className="text-base font-semibold">🔗 Workflow</span>
          <button
            type="button"
            onClick={run}
            disabled={running >= 0}
            className="ml-auto rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg transition hover:brightness-110 disabled:opacity-60"
          >
            {running >= 0 && running < nodes.length ? "Running…" : "▶ Run"}
          </button>
        </div>

        <div className="nexus-scroll flex-1 overflow-auto p-6">
          <div className="mx-auto flex max-w-md flex-col items-center">
            <AnimatePresence>
              {nodes.map((n, i) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex w-full flex-col items-center"
                >
                  <div
                    className={`group flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 transition ${
                      running === i
                        ? "border-accent bg-accent/15 shadow-[0_0_20px_-4px] shadow-accent"
                        : running > i
                          ? "border-emerald-500/50 bg-emerald-500/10"
                          : "border-border bg-surface"
                    }`}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-lg">
                      {n.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{n.label}</p>
                      <p className="text-xs capitalize text-text-muted">{n.type}</p>
                    </div>
                    {running > i && <span className="text-emerald-500">✓</span>}
                    <button
                      type="button"
                      onClick={() => remove(n.id)}
                      className="hidden text-text-muted hover:text-rose-400 group-hover:block"
                    >
                      ✕
                    </button>
                  </div>
                  {i < nodes.length - 1 && (
                    <div className={`h-6 w-0.5 ${running > i ? "bg-emerald-500" : "bg-border"}`} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {nodes.length === 0 && (
              <p className="mt-10 text-sm text-text-muted">Add nodes from the palette to build a workflow.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
