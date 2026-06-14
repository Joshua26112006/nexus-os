"use client";

/**
 * API Tester — a Postman-like client. Compose a request (method, URL, headers,
 * body), send it (real fetch), and inspect the response with status, timing,
 * and pretty-printed JSON. Falls back to a clear error on network/CORS issues.
 */

import { useState } from "react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
type Tab = "body" | "headers";

interface ResponseState {
  status: number;
  statusText: string;
  timeMs: number;
  body: string;
  ok: boolean;
}

export function ApiTesterApp() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/todos/1");
  const [headers, setHeaders] = useState('{\n  "Accept": "application/json"\n}');
  const [body, setBody] = useState('{\n  "title": "NEXUS",\n  "done": false\n}');
  const [tab, setTab] = useState<Tab>("body");
  const [resp, setResp] = useState<ResponseState | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    setResp(null);
    const t0 = performance.now();
    try {
      const parsedHeaders = headers.trim() ? JSON.parse(headers) : {};
      const res = await fetch(url, {
        method,
        headers: parsedHeaders,
        body: method === "GET" || method === "DELETE" ? undefined : body,
      });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* not json */ }
      setResp({
        status: res.status,
        statusText: res.statusText,
        timeMs: Math.round(performance.now() - t0),
        body: pretty,
        ok: res.ok,
      });
    } catch (err) {
      setResp({
        status: 0,
        statusText: "Network / CORS error",
        timeMs: Math.round(performance.now() - t0),
        body: String(err),
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* URL bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface p-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="rounded-md border border-border bg-surface-elevated px-2 py-2 text-sm font-semibold"
        >
          {METHODS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          spellCheck={false}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 rounded-md border border-border bg-surface-elevated px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-fg transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Request */}
        <div className="flex w-1/2 flex-col border-r border-border">
          <div className="flex shrink-0 gap-1 border-b border-border bg-surface px-3 py-1.5 text-sm">
            <TabBtn active={tab === "body"} onClick={() => setTab("body")}>Body</TabBtn>
            <TabBtn active={tab === "headers"} onClick={() => setTab("headers")}>Headers</TabBtn>
          </div>
          <textarea
            value={tab === "body" ? body : headers}
            onChange={(e) => (tab === "body" ? setBody : setHeaders)(e.target.value)}
            spellCheck={false}
            className="nexus-scroll flex-1 resize-none bg-bg p-3 font-mono text-xs focus:outline-none"
          />
        </div>

        {/* Response */}
        <div className="flex w-1/2 flex-col">
          <div className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-2 text-xs">
            {resp ? (
              <>
                <span className={`font-semibold ${resp.ok ? "text-emerald-500" : "text-rose-500"}`}>
                  {resp.status || "ERR"} {resp.statusText}
                </span>
                <span className="text-text-muted">{resp.timeMs} ms</span>
              </>
            ) : (
              <span className="text-text-muted">Response will appear here</span>
            )}
          </div>
          <pre className="nexus-scroll flex-1 overflow-auto bg-bg p-3 font-mono text-xs text-text">
            {resp?.body ?? "// Send a request to see the response"}
          </pre>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 transition ${active ? "bg-accent text-accent-fg" : "text-text-muted hover:bg-surface-elevated"}`}
    >
      {children}
    </button>
  );
}
