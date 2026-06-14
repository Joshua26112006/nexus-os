"use client";

/**
 * AI Research Workspace — collect sources, take notes, and generate an AI
 * synthesis. Three panes: sources, notes, and an AI summary that weaves your
 * notes + sources into a structured brief (rule-based synthesis, offline).
 */

import { useState } from "react";

interface Source {
  id: string;
  title: string;
  url: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

export function ResearchApp() {
  const [topic, setTopic] = useState("The future of browser-based operating systems");
  const [sources, setSources] = useState<Source[]>([
    { id: uid(), title: "WASM & the Browser Runtime", url: "nexus.os/wasm" },
    { id: uid(), title: "OPFS storage deep-dive", url: "nexus.os/opfs" },
  ]);
  const [notes, setNotes] = useState(
    "- Browsers now expose OPFS, WebGPU, and File System Access.\n- AI makes natural-language control viable.\n- Distribution collapses to a URL.",
  );
  const [summary, setSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const addSource = () => {
    const title = prompt("Source title:");
    if (!title) return;
    const url = prompt("URL:") || "";
    setSources((s) => [...s, { id: uid(), title, url }]);
  };

  const generate = async () => {
    setGenerating(true);
    setSummary(null);
    await new Promise((r) => setTimeout(r, 900));
    const bullets = notes.split("\n").map((l) => l.replace(/^[-*]\s*/, "").trim()).filter(Boolean);
    const synthesized = [
      `# Research Brief: ${topic}`,
      "",
      `## Overview`,
      `Drawing on ${sources.length} source${sources.length === 1 ? "" : "s"} and ${bullets.length} key observation${bullets.length === 1 ? "" : "s"}, this brief synthesizes the current state of the topic.`,
      "",
      `## Key Findings`,
      ...bullets.map((b, i) => `${i + 1}. ${b}`),
      "",
      `## Sources`,
      ...sources.map((s) => `- ${s.title}${s.url ? ` (${s.url})` : ""}`),
      "",
      `## Conclusion`,
      `The evidence points to a clear trajectory: ${bullets[0] ? bullets[0].toLowerCase() : "the field is advancing rapidly"}. Further investigation is warranted.`,
    ].join("\n");
    setSummary(synthesized);
    setGenerating(false);
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* Topic */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-3">
        <span className="text-base">🔬</span>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="flex-1 bg-transparent text-base font-semibold focus:outline-none"
        />
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="rounded-md bg-accent px-4 py-1.5 text-sm font-semibold text-accent-fg transition hover:brightness-110 disabled:opacity-60"
        >
          {generating ? "Synthesizing…" : "✦ Generate Brief"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sources */}
        <div className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
          <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold">
            Sources
            <button type="button" onClick={addSource} className="text-text-muted hover:text-text">＋</button>
          </div>
          <div className="nexus-scroll flex-1 overflow-auto px-2">
            {sources.map((s) => (
              <div key={s.id} className="group mb-1.5 rounded-lg border border-border bg-surface-elevated p-2">
                <div className="flex items-start justify-between gap-1">
                  <p className="text-xs font-medium">{s.title}</p>
                  <button
                    type="button"
                    onClick={() => setSources((list) => list.filter((x) => x.id !== s.id))}
                    className="hidden text-text-muted hover:text-rose-400 group-hover:block"
                  >✕</button>
                </div>
                {s.url && <p className="truncate text-[11px] text-accent">{s.url}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="flex w-1/2 flex-col border-r border-border">
          <div className="px-3 py-2 text-sm font-semibold">Notes</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            spellCheck={false}
            placeholder="Jot down findings…"
            className="nexus-scroll flex-1 resize-none bg-bg p-3 font-mono text-sm focus:outline-none"
          />
        </div>

        {/* Summary */}
        <div className="flex flex-1 flex-col">
          <div className="px-3 py-2 text-sm font-semibold">✦ AI Brief</div>
          <div className="nexus-scroll flex-1 overflow-auto bg-surface p-3">
            {summary ? (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{summary}</pre>
            ) : (
              <p className="text-sm text-text-muted">
                {generating ? "Weaving your notes and sources together…" : "Click \"Generate Brief\" to synthesize your research."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
