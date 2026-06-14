"use client";

/**
 * Terminal (Phase 2). An interactive REPL over the shared VFS, with scrollback,
 * command history (up/down), and a live prompt showing the working directory.
 */

import { useEffect, useRef, useState } from "react";
import { useVfsStore, VFS_ROOT_ID } from "@/store/vfs-store";
import { runCommand } from "./shell";

interface Line {
  id: number;
  text: string;
  kind: "input" | "output";
}

export function TerminalApp() {
  const getPath = useVfsStore((s) => s.getPath);

  const [cwdId, setCwdId] = useState(VFS_ROOT_ID);
  const [lines, setLines] = useState<Line[]>([
    { id: 0, text: "NEXUS Terminal — type 'help' for commands.", kind: "output" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number | null>(null);

  const lineId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const cwdPath = getPath(cwdId) || "/";

  // Keep the view scrolled to the latest line.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines]);

  const addLines = (texts: string[], kind: Line["kind"]) => {
    setLines((prev) => [
      ...prev,
      ...texts.map((text) => ({ id: lineId.current++, text, kind })),
    ]);
  };

  const submit = () => {
    const command = input;
    addLines([`${cwdPath} $ ${command}`], "input");

    const result = runCommand(command, cwdId);

    if (result.clear) {
      setLines([]);
    } else if (result.output.length) {
      addLines(result.output, "output");
    }
    if (result.newCwdId) setCwdId(result.newCwdId);

    if (command.trim()) setHistory((h) => [...h, command]);
    setHistoryIdx(null);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const idx = historyIdx === null ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(idx);
      setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === null) return;
      const idx = historyIdx + 1;
      if (idx >= history.length) {
        setHistoryIdx(null);
        setInput("");
      } else {
        setHistoryIdx(idx);
        setInput(history[idx]);
      }
    }
  };

  return (
    <div
      className="nexus-scroll h-full w-full overflow-auto bg-[#0a0e1a] p-3 font-mono text-sm text-emerald-300"
      ref={scrollRef}
      onClick={() => inputRef.current?.focus()}
    >
      {lines.map((line) => (
        <div
          key={line.id}
          className={line.kind === "input" ? "text-sky-300" : "whitespace-pre-wrap text-emerald-300"}
        >
          {line.text || " "}
        </div>
      ))}

      {/* Prompt */}
      <div className="flex items-center">
        <span className="shrink-0 text-sky-300">{cwdPath} $&nbsp;</span>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          spellCheck={false}
          autoComplete="off"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-emerald-100 caret-emerald-300 focus:outline-none"
        />
      </div>
    </div>
  );
}
