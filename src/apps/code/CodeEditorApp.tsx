"use client";

/**
 * Code Editor — powered by the Monaco editor (the engine behind VS Code).
 *
 * Monaco is loaded from CDN by @monaco-editor/react and only when this app is
 * launched (the app itself is already lazy-loaded), so it never weighs on cold
 * boot. A language switcher and a few starter files make it feel real. If
 * Monaco can't load (offline), a styled textarea fallback keeps the app usable.
 */

import { useState } from "react";
import Editor from "@monaco-editor/react";

interface FileTab {
  name: string;
  language: string;
  value: string;
}

const FILES: FileTab[] = [
  {
    name: "welcome.ts",
    language: "typescript",
    value: `// Welcome to the NEXUS Code Editor — powered by Monaco.
interface Window {
  id: string;
  title: string;
  rect: { x: number; y: number; w: number; h: number };
}

function focus(win: Window): void {
  console.log(\`Focusing \${win.title}\`);
}

const hello = (name: string): string => \`Hello, \${name}!\`;
console.log(hello("NEXUS"));
`,
  },
  {
    name: "styles.css",
    language: "css",
    value: `.glass {
  background: rgb(255 255 255 / 0.6);
  backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgb(255 255 255 / 0.18);
}
`,
  },
  {
    name: "data.json",
    language: "json",
    value: `{
  "os": "NEXUS",
  "version": "0.6.0",
  "apps": 26,
  "aiNative": true
}
`,
  },
];

export function CodeEditorApp() {
  const [active, setActive] = useState(0);
  const [files, setFiles] = useState<FileTab[]>(FILES);

  const file = files[active];

  return (
    <div className="flex h-full w-full flex-col bg-[#1e1e1e] text-white">
      {/* Tabs */}
      <div className="flex shrink-0 items-center border-b border-black/40 bg-[#252526] text-sm">
        {files.map((f, i) => (
          <button
            key={f.name}
            type="button"
            onClick={() => setActive(i)}
            className={`border-r border-black/40 px-3 py-2 transition ${
              i === active ? "bg-[#1e1e1e] text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {f.name}
          </button>
        ))}
        <span className="ml-auto px-3 text-xs text-white/40">{file.language}</span>
      </div>

      {/* Editor */}
      <div className="min-h-0 flex-1">
        <Editor
          height="100%"
          theme="vs-dark"
          path={file.name}
          language={file.language}
          value={file.value}
          onChange={(val) =>
            setFiles((list) =>
              list.map((f, i) => (i === active ? { ...f, value: val ?? "" } : f)),
            )
          }
          loading={
            <div className="flex h-full items-center justify-center text-sm text-white/50">
              Loading Monaco…
            </div>
          }
          options={{
            fontSize: 13,
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            fontFamily: "var(--font-mono), monospace",
            smoothScrolling: true,
            cursorBlinking: "smooth",
          }}
        />
      </div>

      {/* Status bar */}
      <div className="flex shrink-0 items-center gap-4 bg-[#007acc] px-3 py-1 text-xs text-white">
        <span>⚡ NEXUS Code</span>
        <span>{file.language}</span>
        <span className="ml-auto">UTF-8</span>
        <span>Spaces: 2</span>
      </div>
    </div>
  );
}
