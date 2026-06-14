"use client";

/**
 * AI Writing Studio — a markdown document editor with live preview, templates,
 * an AI-assist toolbar (rule-based, offline), and word-count stats. Documents
 * persist to localStorage.
 */

import { useEffect, useMemo, useState } from "react";

const STORE_KEY = "nexus.writer";

const TEMPLATES: Record<string, string> = {
  Blank: "",
  "Blog Post":
    "# Title\n\n_A compelling subtitle._\n\n## Introduction\n\nHook the reader here.\n\n## Main Point\n\n- Point one\n- Point two\n\n## Conclusion\n\nWrap it up.\n",
  "Meeting Notes":
    "# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n1. \n2. \n\n## Decisions\n- \n\n## Action Items\n- [ ] \n",
  "Product Spec":
    "# Product Spec\n\n## Problem\n\n## Goals\n\n## Non-goals\n\n## Proposed Solution\n\n## Risks\n",
};

/** Tiny, safe markdown → HTML renderer (headings, bold, italics, lists, code). */
function renderMarkdown(md: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    let line = esc(raw);
    line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    line = line.replace(/\*(.+?)\*/g, "<em>$1</em>");
    line = line.replace(/`(.+?)`/g, "<code>$1</code>");
    if (/^#{3}\s/.test(raw)) out.push(`<h3>${line.slice(4)}</h3>`);
    else if (/^#{2}\s/.test(raw)) out.push(`<h2>${line.slice(3)}</h2>`);
    else if (/^#\s/.test(raw)) out.push(`<h1>${line.slice(2)}</h1>`);
    else if (/^[-*]\s/.test(raw)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${line.slice(2)}</li>`);
      continue;
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(line.trim() ? `<p>${line}</p>` : "");
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

export function WriterApp() {
  const [doc, setDoc] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORE_KEY) ?? TEMPLATES["Blog Post"];
    }
    return TEMPLATES["Blog Post"];
  });
  const [preview, setPreview] = useState(true);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, doc);
  }, [doc]);

  const stats = useMemo(() => {
    const words = doc.trim() ? doc.trim().split(/\s+/).length : 0;
    const chars = doc.length;
    const mins = Math.max(1, Math.round(words / 200));
    return { words, chars, mins };
  }, [doc]);

  const aiAssist = (kind: "expand" | "summarize" | "headline") => {
    if (kind === "headline") {
      setDoc((d) => `# ${(d.split("\n")[0] || "Untitled").replace(/^#+\s*/, "")}\n\n${d}`);
    } else if (kind === "summarize") {
      const first = doc.split(/\n\n/)[0] ?? doc.slice(0, 120);
      setDoc((d) => `> **TL;DR:** ${first.replace(/[#*>]/g, "").trim().slice(0, 160)}…\n\n${d}`);
    } else {
      setDoc((d) => d + "\n\nFurthermore, this point can be expanded with concrete examples, data, and a clear call to action that resonates with the reader.");
    }
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg text-text">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <select
          onChange={(e) => e.target.value && setDoc(TEMPLATES[e.target.value])}
          className="rounded-md border border-border bg-surface-elevated px-2 py-1 text-sm"
          defaultValue=""
        >
          <option value="" disabled>📄 Template…</option>
          {Object.keys(TEMPLATES).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="mx-1 h-5 w-px bg-border" />
        <span className="text-xs font-medium text-text-muted">✨ AI:</span>
        <AiBtn onClick={() => aiAssist("headline")}>Add headline</AiBtn>
        <AiBtn onClick={() => aiAssist("summarize")}>Summarize</AiBtn>
        <AiBtn onClick={() => aiAssist("expand")}>Expand</AiBtn>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="ml-auto rounded-md bg-surface-elevated px-2.5 py-1 text-xs hover:brightness-110"
        >
          {preview ? "Hide preview" : "Show preview"}
        </button>
      </div>

      {/* Editor + preview */}
      <div className="flex min-h-0 flex-1">
        <textarea
          value={doc}
          onChange={(e) => setDoc(e.target.value)}
          spellCheck={false}
          placeholder="Write in Markdown…"
          className="nexus-scroll min-w-0 flex-1 resize-none bg-bg p-5 font-mono text-sm leading-relaxed focus:outline-none"
        />
        {preview && (
          <div
            className="writer-preview nexus-scroll min-w-0 flex-1 overflow-auto border-l border-border bg-surface p-5 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(doc) }}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 items-center gap-4 border-t border-border bg-surface px-4 py-1.5 text-xs text-text-muted">
        <span>{stats.words} words</span>
        <span>{stats.chars} chars</span>
        <span>~{stats.mins} min read</span>
        <span className="ml-auto">Autosaved</span>
      </div>
    </div>
  );
}

function AiBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-accent/15 px-2 py-1 text-xs text-accent transition hover:bg-accent/25"
    >
      {children}
    </button>
  );
}
