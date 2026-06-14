"use client";

/**
 * Database Explorer — a mock relational database browser. Pick a table, view
 * rows in a grid, filter with a simple query box, and inspect the schema. All
 * data is in-memory and seeded — no real DB, but it feels like one.
 */

import { useMemo, useState } from "react";

interface Table {
  name: string;
  columns: { name: string; type: string }[];
  rows: Record<string, string | number | boolean>[];
}

const DB: Table[] = [
  {
    name: "users",
    columns: [
      { name: "id", type: "int" },
      { name: "name", type: "text" },
      { name: "email", type: "text" },
      { name: "role", type: "text" },
      { name: "active", type: "bool" },
    ],
    rows: [
      { id: 1, name: "Ada Lovelace", email: "ada@nexus.os", role: "admin", active: true },
      { id: 2, name: "Linus T.", email: "linus@nexus.os", role: "dev", active: true },
      { id: 3, name: "Grace H.", email: "grace@nexus.os", role: "dev", active: false },
      { id: 4, name: "Alan T.", email: "alan@nexus.os", role: "ops", active: true },
      { id: 5, name: "Margaret H.", email: "maggie@nexus.os", role: "viewer", active: true },
    ],
  },
  {
    name: "projects",
    columns: [
      { name: "id", type: "int" },
      { name: "title", type: "text" },
      { name: "owner_id", type: "int" },
      { name: "stars", type: "int" },
    ],
    rows: [
      { id: 1, title: "NEXUS Core", owner_id: 2, stars: 4210 },
      { id: 2, title: "AI Command Center", owner_id: 1, stars: 3180 },
      { id: 3, title: "Widget Kit", owner_id: 3, stars: 920 },
    ],
  },
  {
    name: "events",
    columns: [
      { name: "id", type: "int" },
      { name: "type", type: "text" },
      { name: "user_id", type: "int" },
      { name: "ts", type: "text" },
    ],
    rows: [
      { id: 1, type: "login", user_id: 1, ts: "2026-06-14T09:00" },
      { id: 2, type: "app.launch", user_id: 2, ts: "2026-06-14T09:02" },
      { id: 3, type: "ai.command", user_id: 1, ts: "2026-06-14T09:05" },
    ],
  },
];

export function DatabaseApp() {
  const [activeTable, setActiveTable] = useState(DB[0].name);
  const [filter, setFilter] = useState("");

  const table = DB.find((t) => t.name === activeTable)!;
  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return table.rows;
    return table.rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [table, filter]);

  return (
    <div className="flex h-full w-full bg-bg text-text">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r border-border bg-surface p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
          🗄️ nexus.db
        </p>
        {DB.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => { setActiveTable(t.name); setFilter(""); }}
            className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition ${
              t.name === activeTable ? "bg-accent/15 text-text" : "text-text-muted hover:bg-surface-elevated"
            }`}
          >
            <span>▦ {t.name}</span>
            <span className="text-xs text-text-muted">{t.rows.length}</span>
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-3 py-2">
          <code className="rounded bg-surface-elevated px-2 py-1 text-xs text-text-muted">
            SELECT * FROM {table.name}
          </code>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter rows…"
            className="ml-auto w-48 rounded-md border border-border bg-surface-elevated px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <span className="text-xs text-text-muted">{rows.length} rows</span>
        </div>

        <div className="nexus-scroll flex-1 overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-surface">
              <tr>
                {table.columns.map((c) => (
                  <th key={c.name} className="border-b border-border px-3 py-2 text-left font-semibold">
                    {c.name}
                    <span className="ml-1 text-[10px] font-normal text-text-muted">{c.type}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-surface-elevated">
                  {table.columns.map((c) => (
                    <td key={c.name} className="border-b border-border/50 px-3 py-1.5 font-mono text-xs">
                      {typeof r[c.name] === "boolean" ? (
                        <span className={r[c.name] ? "text-emerald-500" : "text-rose-500"}>
                          {String(r[c.name])}
                        </span>
                      ) : (
                        String(r[c.name])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
