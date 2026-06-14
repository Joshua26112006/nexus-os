"use client";

/**
 * JSON Visualizer — paste JSON to get a collapsible tree view, with format and
 * minify actions and live validation. Handles large/nested structures.
 */

import { useMemo, useState } from "react";

const SAMPLE = `{
  "os": "NEXUS",
  "version": "0.6.0",
  "features": ["ai", "widgets", "weather"],
  "stats": { "apps": 26, "uptime": 99.99, "aiNative": true },
  "users": [
    { "id": 1, "name": "Ada", "roles": ["admin"] },
    { "id": 2, "name": "Linus", "roles": ["dev", "ops"] }
  ]
}`;

export function JsonVisualizerApp() {
  const [text, setText] = useState(SAMPLE);

  const parsed = useMemo<{ ok: true; value: unknown } | { ok: false; error: string }>(() => {
    try {
      return { ok: true, value: JSON.parse(text) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }, [text]);

  return (
    <div className="flex h-full w-full bg-bg text-text">
      {/* Input */}
      <div className="flex w-1/2 flex-col border-r border-border">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-2">
          <span className="text-sm font-semibold">Input</span>
          <button
            type="button"
            onClick={() => parsed.ok && setText(JSON.stringify(parsed.value, null, 2))}
            disabled={!parsed.ok}
            className="ml-auto rounded bg-surface-elevated px-2 py-1 text-xs hover:brightness-110 disabled:opacity-50"
          >
            Format
          </button>
          <button
            type="button"
            onClick={() => parsed.ok && setText(JSON.stringify(parsed.value))}
            disabled={!parsed.ok}
            className="rounded bg-surface-elevated px-2 py-1 text-xs hover:brightness-110 disabled:opacity-50"
          >
            Minify
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
          className="nexus-scroll flex-1 resize-none bg-bg p-3 font-mono text-xs focus:outline-none"
        />
        {!parsed.ok && (
          <div className="shrink-0 border-t border-border bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
            ✕ {parsed.error}
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex w-1/2 flex-col">
        <div className="shrink-0 border-b border-border bg-surface px-3 py-2 text-sm font-semibold">
          Tree View
        </div>
        <div className="nexus-scroll flex-1 overflow-auto p-3 font-mono text-xs">
          {parsed.ok ? <JsonNode value={parsed.value} name="root" depth={0} /> : (
            <span className="text-text-muted">Fix the JSON to see the tree.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function JsonNode({ value, name, depth }: { value: unknown; name: string; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  const isObject = value !== null && typeof value === "object";

  if (!isObject) {
    return (
      <div style={{ paddingLeft: depth * 14 }}>
        <span className="text-sky-400">{name}</span>
        <span className="text-text-muted">: </span>
        <ValueSpan value={value} />
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);
  const bracket = Array.isArray(value) ? ["[", "]"] : ["{", "}"];

  return (
    <div style={{ paddingLeft: depth * 14 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-left hover:opacity-80">
        <span className="text-text-muted">{open ? "▾" : "▸"} </span>
        <span className="text-violet-400">{name}</span>
        <span className="text-text-muted"> {bracket[0]}{!open && `…${entries.length}`}{!open && bracket[1]}</span>
      </button>
      {open && (
        <div>
          {entries.map(([k, v]) => (
            <JsonNode key={k} name={k} value={v} depth={depth + 1} />
          ))}
          <div className="text-text-muted" style={{ paddingLeft: depth * 14 }}>{bracket[1]}</div>
        </div>
      )}
    </div>
  );
}

function ValueSpan({ value }: { value: unknown }) {
  if (typeof value === "string") return <span className="text-emerald-400">&quot;{value}&quot;</span>;
  if (typeof value === "number") return <span className="text-amber-400">{value}</span>;
  if (typeof value === "boolean") return <span className="text-rose-400">{String(value)}</span>;
  return <span className="text-text-muted">null</span>;
}
